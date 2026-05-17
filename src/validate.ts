import type { Note } from './types.js';

const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"]?[^'\"\s]{12,}/i,
  /-----BEGIN (?:RSA |OPENSSH |DSA |EC |PGP )?PRIVATE KEY-----/,
];

export function hasPossibleSecret(text:string){return secretPatterns.some(pattern=>pattern.test(text))}

export function validateNotes(notes:Note[]){const warnings:string[]=[];const ids=new Set(notes.map(n=>n.id));for(const n of notes){if(!n.meta.title)warnings.push(`${n.relPath}: missing title frontmatter`);if(!n.meta.visibility)warnings.push(`${n.relPath}: missing visibility; defaults private`);if(hasPossibleSecret(n.body))warnings.push(`${n.relPath}: possible secret/token`);if(n.body.length>20000)warnings.push(`${n.relPath}: oversized note; consider splitting`);for(const l of n.links)if(!ids.has(l))warnings.push(`${n.relPath}: broken wiki link ${l}`)}return warnings}
