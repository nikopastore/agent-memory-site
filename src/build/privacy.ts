import type { BuildMode, Note } from '../types.js';
const sensitive=new Set(['credential','financial','medical','personal']);
const possibleSecretPattern=/\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,})\b|\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*['\"]?[^'\"\s]{12,}|-----BEGIN (?:RSA |OPENSSH |DSA |EC |PGP )?PRIVATE KEY-----/gi;
export function includeNote(note:Note, mode:BuildMode){const vis=note.meta.visibility||'private';const sen=note.meta.sensitivity||'none';if(mode==='private')return true;if(mode==='public')return vis==='public' && !sensitive.has(String(sen));if(mode==='redacted')return !sensitive.has(String(sen));return true}
export function redactText(s:string){return s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[redacted-email]').replace(possibleSecretPattern,'[redacted-secret]')}
