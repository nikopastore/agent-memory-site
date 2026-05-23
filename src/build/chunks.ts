import type { Chunk, Note } from '../types.js';
import { shortHash } from '../util/hash.js';

const MAX_CHARS = 4000; // ~1000 tokens at the 4-char heuristic

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'section'
  );
}

interface RawSection {
  heading: string | null;
  level: number;
  text: string;
}

function splitSections(body: string): RawSection[] {
  const lines = body.split('\n');
  const sections: RawSection[] = [];
  let current: { heading: string | null; level: number; buf: string[] } = {
    heading: null,
    level: 0,
    buf: [],
  };
  const flush = () => {
    const text = current.buf.join('\n').trim();
    if (text || current.heading) sections.push({ heading: current.heading, level: current.level, text });
  };
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = { heading: m[2].trim(), level: m[1].length, buf: [] };
    } else {
      current.buf.push(line);
    }
  }
  flush();
  return sections;
}

function cleanText(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[*_>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function forceSplit(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  const parts: string[] = [];
  let buf = '';
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((buf + ' ' + sentence).trim().length > MAX_CHARS && buf) {
      parts.push(buf.trim());
      buf = sentence;
    } else {
      buf = (buf + ' ' + sentence).trim();
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  // last-resort hard split
  return parts.flatMap((p) =>
    p.length <= MAX_CHARS ? [p] : (p.match(new RegExp(`.{1,${MAX_CHARS}}`, 'g')) || []).map((x) => x.trim()),
  );
}

export function chunkNote(note: Note): Chunk[] {
  const body = note.body;
  if (!body.trim()) return [];

  const sections = splitSections(body);
  const headingPathStack: { heading: string; level: number }[] = [];
  const tagsRaw = note.meta?.tags;
  const tags = Array.isArray(tagsRaw) ? tagsRaw.map(String) : [];
  const keywordsRaw = note.meta?.keywords;
  const keywords = Array.isArray(keywordsRaw) ? keywordsRaw.map(String) : undefined;
  const supersedesRaw = note.meta?.supersedes;
  const supersedes = Array.isArray(supersedesRaw) ? supersedesRaw.map(String) : undefined;
  const supersededBy = typeof note.meta?.superseded_by === 'string' ? note.meta.superseded_by : undefined;

  const seen = new Map<string, number>();
  const chunks: Chunk[] = [];

  for (const section of sections) {
    // maintain a hierarchical heading path
    if (section.heading) {
      while (headingPathStack.length && headingPathStack[headingPathStack.length - 1].level >= section.level) {
        headingPathStack.pop();
      }
      headingPathStack.push({ heading: section.heading, level: section.level });
    }

    const cleaned = cleanText(section.text);
    if (!cleaned) continue;

    const parts = forceSplit(cleaned);
    // Dedupe consecutive identical headings (idiomatic Markdown often starts
    // with `# Title` matching the frontmatter title, producing [title, title]).
    const rawPath = headingPathStack.length
      ? [note.title, ...headingPathStack.map((h) => h.heading)]
      : [note.title];
    const headingPath = rawPath.filter((h, i, arr) => i === 0 || h.toLowerCase() !== arr[i - 1].toLowerCase());
    const sectionHeading = headingPathStack[headingPathStack.length - 1]?.heading || null;
    const sectionSlug = sectionHeading ? slug(sectionHeading) : 'intro';

    for (const text of parts) {
      const baseSlug = sectionSlug;
      const count = (seen.get(baseSlug) || 0) + 1;
      seen.set(baseSlug, count);
      const chunkSlug = count > 1 ? `${baseSlug}-${count}` : baseSlug;
      const contentHash = shortHash(text);
      chunks.push({
        chunk_id: `${note.id}#${chunkSlug}`,
        doc_id: note.id,
        title: note.title,
        heading_path: headingPath,
        type: String(note.meta?.type || note.category),
        text,
        html: `<section><h2>${escapeHtml(sectionHeading || note.title)}</h2><p>${escapeHtml(text)}</p></section>`,
        source_path: note.relPath,
        canonical_url: `notes/${note.slug}.html`,
        updated: note.updated_at,
        created_at: note.created_at,
        tags,
        keywords,
        tokens: Math.max(1, Math.ceil(text.length / 4)),
        content_hash: contentHash,
        visibility: note.meta?.visibility,
        sensitivity: note.meta?.sensitivity,
        supersedes,
        superseded_by: supersededBy,
      });
    }
  }

  return chunks;
}
