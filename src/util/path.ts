import path from 'node:path';

/**
 * Normalize a path to forward-slash form so generated JSON/JSONL artifacts
 * are byte-identical across Windows and POSIX builds.
 */
export function normalizePath(p: string): string {
  return p.split(path.sep).join('/');
}
