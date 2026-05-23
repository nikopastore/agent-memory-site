import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let cached: string | null = null;

/**
 * Read version from package.json so the CLI never drifts from the package.
 */
export function readVersion(): string {
  if (cached) return cached;
  try {
    // dist/util/version.js -> ../../package.json
    const here = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
      path.resolve(here, '../../package.json'),
      path.resolve(here, '../package.json'),
      path.resolve(process.cwd(), 'package.json'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        const raw = fs.readFileSync(c, 'utf8');
        const pkg = JSON.parse(raw);
        if (pkg && typeof pkg.version === 'string') {
          cached = pkg.version;
          return pkg.version;
        }
      }
    }
  } catch {
    // fall through
  }
  cached = '0.0.0';
  return cached;
}
