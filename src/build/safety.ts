import fs from 'node:fs';
import path from 'node:path';

const MARKER = '.agent-memory-output';

function homeDirs(): string[] {
  const candidates = [
    process.env.HOME,
    process.env.USERPROFILE,
    process.env.HOMEDRIVE && process.env.HOMEPATH ? process.env.HOMEDRIVE + process.env.HOMEPATH : undefined,
  ];
  return candidates.filter((x): x is string => typeof x === 'string' && x.length > 0).map((h) => path.resolve(h));
}

function isInside(child: string, parent: string): boolean {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Refuse to use an output directory that would destroy user data.
 *
 * Specifically refuse paths that:
 *   - equal or contain the filesystem root, cwd, $HOME, %USERPROFILE%, or %HOMEDRIVE%%HOMEPATH%
 *   - are equal to or contain the currently-running tool's dist/ (detected via cli/index.js presence)
 *   - exist and are non-empty but lack the `.agent-memory-output` marker
 *     (i.e. we only blow away directories we ourselves created)
 */
export function assertSafeOutputDir(out: string, opts: { force?: boolean } = {}): string {
  const resolved = path.resolve(out);
  const cwd = path.resolve(process.cwd());
  const root = path.parse(resolved).root;
  const homes = homeDirs();

  // 1. Equality check against any sensitive directory.
  const sensitive = [root, cwd, ...homes];
  for (const p of sensitive) {
    if (resolved === p) {
      throw new Error(`Refusing to use output directory equal to ${p}: ${resolved}`);
    }
  }
  // 2. Containment check: refuse if the output dir CONTAINS a sensitive dir.
  for (const p of sensitive) {
    if (isInside(p, resolved) && resolved !== p) {
      throw new Error(`Refusing to use output directory that contains ${p}: ${resolved}`);
    }
  }
  // 3. Refuse to use cwd itself (already caught above) or any ancestor of cwd.
  if (isInside(cwd, resolved) && resolved !== cwd) {
    throw new Error(`Refusing to delete an ancestor of the current project: ${resolved}`);
  }

  // 4. Refuse to wipe the currently-installed package dist/ (the tool eating itself).
  const indexJs = path.join(resolved, 'cli', 'index.js');
  if (fs.existsSync(indexJs)) {
    throw new Error(
      `Refusing to use output directory that looks like an installed package dist (${resolved}). ` +
        `Pass --out <fresh-dir> e.g. --out ./site.`,
    );
  }

  // 5. Marker-file gate: if the dir exists and is non-empty, require our marker.
  if (fs.existsSync(resolved)) {
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(resolved);
    } catch (err) {
      throw new Error(`Failed to read output directory ${resolved}: ${(err as Error).message}`);
    }
    if (entries.length > 0 && !opts.force) {
      const hasMarker = entries.includes(MARKER);
      if (!hasMarker) {
        throw new Error(
          `Refusing to overwrite non-empty directory without .agent-memory-output marker: ${resolved}. ` +
            `Pass --force to override (this will delete the contents).`,
        );
      }
    }
  }

  return resolved;
}

export function writeMarker(out: string, info: Record<string, unknown> = {}): void {
  const payload = JSON.stringify({ generator: 'agent-memory-site', created_at: new Date().toISOString(), ...info }, null, 2);
  fs.writeFileSync(path.join(out, MARKER), payload);
}

export const OUTPUT_MARKER = MARKER;
