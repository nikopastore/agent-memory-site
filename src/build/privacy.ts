import type { BuildMode, MemoryMeta, Note } from '../types.js';

const sensitive = new Set(['credential', 'financial', 'medical', 'personal']);

// Tight, anchored patterns — no nested quantifiers. Run sequentially, not as one mega-alt.
const secretPatterns: RegExp[] = [
  /\b(?:sk-[A-Za-z0-9_-]{20,})\b/g,
  /\b(?:gh[pousr]_[A-Za-z0-9_]{20,})\b/g,
  /\b(?:github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\b(?:AKIA[0-9A-Z]{16})\b/g,
  /\b(?:xox[baprs]-[A-Za-z0-9-]{20,})\b/g,
  /\b(?:eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/g, // JWT-ish
  /\b(?:api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"]?[^'"\s]{12,}/gi,
  /-----BEGIN (?:RSA |OPENSSH |DSA |EC |PGP )?PRIVATE KEY-----/g,
];

const emailPattern = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/giu;

const strictPatterns: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g, label: '[redacted-phone]' },
  { pattern: /\b(?:\d[ -]?){13,19}\b/g, label: '[redacted-cc]' },
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, label: '[redacted-ip]' },
];

export interface RedactOptions {
  strict?: boolean;
  denyList?: string[];
}

export function includeNote(note: Note, mode: BuildMode): boolean {
  const vis = note.meta?.visibility || 'private';
  const sen = String(note.meta?.sensitivity || 'none');
  if (mode === 'private') return true;
  if (mode === 'public') return vis === 'public' && !sensitive.has(sen);
  if (mode === 'redacted') return !sensitive.has(sen);
  return true;
}

export function redactText(s: string, opts: RedactOptions = {}): string {
  if (typeof s !== 'string' || !s) return s;
  let out = s.replace(emailPattern, '[redacted-email]');
  for (const p of secretPatterns) out = out.replace(p, '[redacted-secret]');
  if (opts.strict) {
    for (const { pattern, label } of strictPatterns) out = out.replace(pattern, label);
  }
  if (opts.denyList) {
    for (const term of opts.denyList) {
      if (!term || typeof term !== 'string') continue;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'gi'), '[redacted-denylist]');
    }
  }
  return out;
}

/**
 * Walk an arbitrary value (string / array / object / primitive) and apply
 * redactText to every string. Used to scrub frontmatter (incl. tag arrays)
 * and derived artifacts (search-index, manifest) unconditionally.
 */
export function redactDeep<T>(value: T, opts: RedactOptions = {}): T {
  if (value == null) return value;
  if (typeof value === 'string') return redactText(value, opts) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, opts)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDeep(v, opts);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Per-note deny-list pulled from frontmatter `redact: [...]` plus
 * any global terms passed in.
 */
export function denyListFor(meta: MemoryMeta, global: string[] = []): string[] {
  const fromMeta = Array.isArray(meta?.redact) ? meta.redact.filter((x): x is string => typeof x === 'string') : [];
  return [...global, ...fromMeta];
}
