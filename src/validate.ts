import type { Note } from './types.js';
import { slugify } from './ingest/markdown.js';

const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[^'"\s]{12,}/i,
  /-----BEGIN (?:RSA |OPENSSH |DSA |EC |PGP )?PRIVATE KEY-----/,
];

export type Severity = 'error' | 'warn' | 'info';

export interface ValidationIssue {
  severity: Severity;
  file: string;
  message: string;
  code: string;
}

export function hasPossibleSecret(text: string): boolean {
  return secretPatterns.some((pattern) => pattern.test(text));
}

export function validateNotes(notes: Note[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = new Map(notes.map((n) => [n.id, n]));
  const bySlug = new Map(notes.map((n) => [n.slug, n]));
  const byTitleSlug = new Map(notes.map((n) => [slugify(n.title), n]));
  function findTarget(link: string): Note | undefined {
    return byId.get(link) || bySlug.get(link) || byTitleSlug.get(link);
  }
  for (const n of notes) {
    if (!n.meta?.title) issues.push({ severity: 'warn', file: n.relPath, code: 'missing-title', message: 'missing title frontmatter' });
    if (!n.meta?.visibility) issues.push({ severity: 'info', file: n.relPath, code: 'missing-visibility', message: 'missing visibility; defaults private' });
    if (hasPossibleSecret(n.body)) issues.push({ severity: 'error', file: n.relPath, code: 'possible-secret', message: 'possible secret/token in note body' });
    if (n.body.length > 20000) issues.push({ severity: 'warn', file: n.relPath, code: 'oversized', message: 'oversized note; consider splitting' });
    for (const l of n.links) {
      if (!findTarget(l)) issues.push({ severity: 'warn', file: n.relPath, code: 'broken-link', message: `broken wiki link [[${l}]]` });
    }
    // Public-mode safety: if a public note wiki-links to a non-public target.
    if (n.meta?.visibility === 'public') {
      for (const l of n.links) {
        const target = findTarget(l);
        if (target && target.meta?.visibility && target.meta.visibility !== 'public') {
          issues.push({ severity: 'error', file: n.relPath, code: 'public-links-private', message: `public note links to ${target.meta.visibility} note "${target.title}"` });
        }
      }
    }
  }
  return issues;
}

/** Back-compat: legacy string-array form. */
export function validateNotesLegacy(notes: Note[]): string[] {
  return validateNotes(notes).map((i) => `${i.file}: ${i.message}`);
}
