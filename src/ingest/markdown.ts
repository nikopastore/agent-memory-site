import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import type { Note } from '../types.js';
import { sha256 } from '../util/hash.js';
import { normalizePath } from '../util/path.js';

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'note'
  );
}

export function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : /\.(md|qmd)$/i.test(d.name) ? [p] : [];
  });
}

/**
 * Extract wiki-link targets. Handles:
 *   [[Foo]]              → "Foo"
 *   [[Foo#Heading]]      → "Foo"
 *   [[Foo^block]]        → "Foo"
 *   [[Foo|alias]]        → "Foo"
 *   [[Foo#H|alias]]      → "Foo"
 */
export function extractWikiLinks(body: string): string[] {
  return [...body.matchAll(/\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|[^\]]+)?\]\]/g)].map((m) => m[1].trim());
}

function escapeRawHtml(body: string): string {
  // Escape angle brackets so embedded <script>/<img> render as visible text
  // after marked processes the result. Other HTML special chars are handled
  // by marked itself.
  return body.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
}

const SAFE_LINK_SCHEME = /^(?:https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;
const SAFE_IMAGE_SCHEME = /^(?:https?:|\/|\.\/|\.\.\/|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);)/i;

function attrEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function makeMarked(): Marked {
  const m = new Marked({ async: true, gfm: true });
  m.use({
    renderer: {
      link(token: { href: string; title?: string | null; text: string; tokens?: unknown }) {
        const href = token.href || '';
        const safe = SAFE_LINK_SCHEME.test(href) || /\.html(?:#|$|\?)/i.test(href);
        const cleaned = safe ? href : '#blocked';
        const t = token.title ? ` title="${attrEscape(token.title)}"` : '';
        const extra = safe ? '' : ' data-blocked="unsafe-scheme"';
        return `<a href="${attrEscape(cleaned)}"${t}${extra}>${token.text}</a>`;
      },
      image(token: { href: string; title?: string | null; text: string }) {
        const href = token.href || '';
        if (!SAFE_IMAGE_SCHEME.test(href)) {
          return `<span class="blocked-image">[image blocked: ${attrEscape(token.text || '')}]</span>`;
        }
        const t = token.title ? ` title="${attrEscape(token.title)}"` : '';
        return `<img src="${attrEscape(href)}" alt="${attrEscape(token.text || '')}"${t}>`;
      },
    },
  });
  return m;
}

const marked = makeMarked();

// Wiki-link sentinels. Plain ASCII that survives both escapeRawHtml and marked.
// Resolved by buildSite once the privacy-filtered visible set is known.
export const WIKI_OPEN = '@@WIKI@@';
export const WIKI_CLOSE = '@@/WIKI@@';

function b64encode(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64').replace(/=+$/, '');
}

function b64decode(s: string): string {
  return Buffer.from(s + '==='.slice((s.length + 3) % 4), 'base64').toString('utf8');
}

export function tokenizeWikiLinks(body: string): string {
  return body.replace(
    /\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|([^\]]+))?\]\]/g,
    (_full, target, label) => {
      const slug = slugify(String(target).trim());
      const labelText = label ? String(label).trim() : String(target).trim();
      return `${WIKI_OPEN}${slug}::${b64encode(labelText)}${WIKI_CLOSE}`;
    },
  );
}

/**
 * Resolve wiki-link sentinels using only the allowed (visible) slug set.
 * Unresolved links collapse to `[redacted-link]` — this is what prevents
 * private note titles leaking through public builds.
 */
export function resolveWikiTokens(html: string, allowed: Map<string, string>): string {
  const re = new RegExp(`${WIKI_OPEN}([a-z0-9-]+)::([A-Za-z0-9+/]*)${WIKI_CLOSE}`, 'g');
  return html.replace(re, (_m, slug: string, b64: string) => {
    const label = b64decode(b64);
    const safeLabel = attrEscape(label);
    const href = allowed.get(slug);
    if (href) return `<a class="wiki-link" href="${attrEscape(href)}">${safeLabel}</a>`;
    return `<span class="redacted-link" title="Linked note not visible in this build mode.">[redacted-link]</span>`;
  });
}

/**
 * Plain-text variant of `resolveWikiTokens`. Used for `text`, search-index
 * body, descriptions, llms-full.txt — anywhere a string (not HTML) is emitted.
 */
export function resolveWikiTokensText(text: string, allowed: Map<string, string>): string {
  const re = new RegExp(`${WIKI_OPEN}([a-z0-9-]+)::([A-Za-z0-9+/]*)${WIKI_CLOSE}`, 'g');
  return text.replace(re, (_m, slug: string, b64: string) => {
    const label = b64decode(b64);
    return allowed.has(slug) ? label : '[redacted-link]';
  });
}

/** Strip wiki sentinels entirely (no replacement). Useful for the raw `body` we store. */
export function stripWikiTokens(s: string): string {
  const re = new RegExp(`${WIKI_OPEN}([a-z0-9-]+)::([A-Za-z0-9+/]*)${WIKI_CLOSE}`, 'g');
  return s.replace(re, (_m, _slug: string, b64: string) => b64decode(b64));
}

export interface ParseError {
  file: string;
  reason: string;
}

export interface ParseOutcome {
  notes: Note[];
  errors: ParseError[];
}

/**
 * Parse a vault with full error detail. One bad note no longer kills the
 * whole run — it's recorded in `errors` and skipped. Use this from validate /
 * build so users see EVERY issue in one pass.
 */
export async function parseVaultWithDetails(source: string): Promise<ParseOutcome> {
  const files = walk(source);
  const errors: ParseError[] = [];
  const results = await Promise.all(
    files.map(async (f): Promise<Note | null> => {
      const relRaw = path.relative(source, f);
      const rel = normalizePath(relRaw);
      let raw: string;
      try {
        raw = await fs.promises.readFile(f, 'utf8');
      } catch (err) {
        errors.push({ file: rel, reason: `read failed: ${(err as Error).message}` });
        return null;
      }
      let parsed: ReturnType<typeof matter>;
      try {
        parsed = matter(raw);
      } catch (err) {
        // Trim YAML's multi-line traceback to the first line — it's much more readable.
        const firstLine = (err as Error).message.split('\n')[0];
        errors.push({ file: rel, reason: `frontmatter parse failed: ${firstLine}` });
        return null;
      }
      const category = rel.includes('/') ? slugify(rel.split('/')[0]) : 'root';
      const fallbackTitle = path.basename(f).replace(/\.(md|qmd)$/i, '');
      const title = String(parsed.data?.title ?? fallbackTitle);
      const slug = slugify(rel.replace(/\.(md|qmd)$/i, ''));
      const rawBody = parsed.content.trim();
      // Tokenize ONCE on the raw body. Both the HTML pipeline and the text
      // pipeline use the tokenized form so that downstream artifacts (chunks,
      // search-index, llms-full, description meta) never embed the literal
      // wiki-link target name. buildSite resolves sentinels later, using only
      // the privacy-filtered visible set.
      const body = tokenizeWikiLinks(rawBody);
      const html = (await marked.parse(tokenizeWikiLinks(escapeRawHtml(rawBody)))) as string;
      const text = body
        .replace(/```[\s\S]*?```/g, ' ')
        // Strip markdown punctuation but preserve dashes (otherwise wiki-link
        // sentinel slugs get mangled before buildSite can resolve them).
        .replace(/^[-*]\s+/gm, ' ') // list bullets at start of line
        .replace(/[#>*_`[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      let stat: fs.Stats | undefined;
      try {
        stat = await fs.promises.stat(f);
      } catch {
        // ignore — stat is optional
      }
      const metaCreated = typeof parsed.data?.created_at === 'string' ? parsed.data.created_at : undefined;
      const metaUpdated = typeof parsed.data?.updated === 'string' ? parsed.data.updated : undefined;
      const metaDate = typeof parsed.data?.date === 'string' ? parsed.data.date : undefined;
      return {
        id: slug,
        sourcePath: f,
        relPath: rel,
        slug,
        category,
        title,
        body,
        html,
        text,
        meta: parsed.data || {},
        // Extract wiki links from the RAW body (the tokenized body no longer
        // has [[...]] syntax). content_hash also tracks the raw body so
        // sentinels don't churn the hash.
        links: extractWikiLinks(rawBody).map(slugify),
        backlinks: [],
        content_hash: sha256(rawBody).slice(0, 16),
        created_at: metaCreated || (stat ? stat.birthtime.toISOString() : undefined),
        updated_at: metaUpdated || metaDate || (stat ? stat.mtime.toISOString() : undefined),
      };
    }),
  );
  const notes = results.filter((r): r is Note => r !== null);

  // Disambiguate slug collisions deterministically by appending a short content hash.
  const slugCounts = new Map<string, number>();
  for (const n of notes) slugCounts.set(n.slug, (slugCounts.get(n.slug) || 0) + 1);
  for (const n of notes) {
    if ((slugCounts.get(n.slug) || 0) > 1) {
      const suffix = n.content_hash.slice(0, 6);
      n.slug = `${n.slug}-${suffix}`;
      n.id = n.slug;
    }
  }

  // Backlinks (by slug id, then by slugified title).
  const byId = new Map(notes.map((n) => [n.id, n]));
  const byTitle = new Map(notes.map((n) => [slugify(n.title), n]));
  for (const n of notes) {
    for (const l of n.links) {
      const target = byId.get(l) || byTitle.get(l);
      if (target && target.id !== n.id) target.backlinks.push(n.id);
    }
  }

  return { notes, errors };
}

/**
 * Back-compat shim. Logs any per-file parse errors to stderr (so build/serve
 * users see them) and returns just the successfully parsed notes.
 *
 * Prefer `parseVaultWithDetails` if you need to surface errors structurally
 * (e.g. in `validate --json`).
 */
export async function parseVault(source: string): Promise<Note[]> {
  const outcome = await parseVaultWithDetails(source);
  for (const e of outcome.errors) {
    process.stderr.write(`⚠ Skipped ${e.file}: ${e.reason}\n`);
  }
  return outcome.notes;
}

/**
 * Legacy helper kept for back-compat with tests. Prefer tokenize/resolveWikiTokens
 * inside the build pipeline (which is privacy-aware).
 */
export function wikiToMarkdown(body: string): string {
  return body
    .replace(/\[\[([^\]|#^]+)(?:[#^][^\]|]*)?\|([^\]]+)\]\]/g, (_, target, label) => `[${label}](${slugify(target)}.html)`)
    .replace(/\[\[([^\]|#^]+)(?:[#^][^\]|]*)?\]\]/g, (_, x) => `[${x}](${slugify(x)}.html)`);
}
