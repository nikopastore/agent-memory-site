#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { Command, Option } from 'commander';
import { parseVault } from '../ingest/markdown.js';
import { buildSite } from '../build/site.js';
import { assertSafeOutputDir } from '../build/safety.js';
import { validateNotes } from '../validate.js';
import { dumpYaml } from '../util/yaml.js';
import { readVersion } from '../util/version.js';
import { loadConfig } from '../util/config.js';
import { emit, emitFilename, validTargets, type EmitTarget } from '../emit/index.js';

const program = new Command();
const version = readVersion();

program
  .name('agent-memory')
  .description(
    'Compile your Markdown vault into a portable agent memory. One build, every agent: Claude, Codex, Cursor, MCP, llms.txt.',
  )
  .version(version);

const VALID_TYPES = new Set([
  'project',
  'person',
  'decision',
  'fact',
  'daily',
  'handoff',
  'procedure',
  'instruction',
  'standard',
  'rule',
]);

const TYPE_TO_CATEGORY: Record<string, string> = {
  project: 'projects',
  person: 'people',
  decision: 'decisions',
  fact: 'facts',
  daily: 'daily',
  handoff: 'handoffs',
  procedure: 'procedures',
  instruction: 'instructions',
  standard: 'standards',
  rule: 'rules',
};

function safeSegment(value: string, label: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)) {
    throw new Error(`Invalid ${label}: use only letters, numbers, dashes, and underscores.`);
  }
  return value;
}

function dim(s: string): string {
  if (process.stdout.isTTY && !process.env.NO_COLOR) return `\x1b[2m${s}\x1b[0m`;
  return s;
}

function green(s: string): string {
  if (process.stdout.isTTY && !process.env.NO_COLOR) return `\x1b[32m${s}\x1b[0m`;
  return s;
}

function red(s: string): string {
  if (process.stderr.isTTY && !process.env.NO_COLOR) return `\x1b[31m${s}\x1b[0m`;
  return s;
}

function printHints(lines: string[]): void {
  if (!lines.length) return;
  console.log();
  console.log(dim('Next steps:'));
  for (const line of lines) console.log(dim(`  ${line}`));
}

function copyStarterVault(dir: string): number {
  // Try to find the bundled starter vault. Search relative to this file (dist/cli/),
  // and fall back to repo path examples/sample-vault.
  const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const candidates = [
    path.resolve(here, '../../templates/starter-vault'),
    path.resolve(here, '../templates/starter-vault'),
    path.resolve(process.cwd(), 'templates/starter-vault'),
  ];
  let starterRoot: string | null = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      starterRoot = c;
      break;
    }
  }
  if (!starterRoot) return 0;
  let count = 0;
  const copyRecursive = (from: string, to: string) => {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const src = path.join(from, entry.name);
      const dst = path.join(to, entry.name);
      if (entry.isDirectory()) copyRecursive(src, dst);
      else if (entry.isFile()) {
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
          count++;
        }
      }
    }
  };
  copyRecursive(starterRoot, dir);
  return count;
}

program
  .command('init [dir]')
  .description('Create a starter memory vault')
  .option('--bare', 'Just create empty folders + MEMORY.md, no starter notes')
  .option('-f, --force', 'Overwrite MEMORY.md if it exists')
  .action((dir = 'memory', o: { bare?: boolean; force?: boolean }) => {
    fs.mkdirSync(dir, { recursive: true });
    const subs = ['projects', 'people', 'decisions', 'facts', 'daily', 'handoffs', 'procedures'];
    for (const sub of subs) fs.mkdirSync(path.join(dir, sub), { recursive: true });
    const memoryFile = path.join(dir, 'MEMORY.md');
    if (fs.existsSync(memoryFile) && !o.force) {
      console.log(`MEMORY.md already exists in ${dir} (pass --force to overwrite).`);
    } else {
      fs.writeFileSync(
        memoryFile,
        '---\ntitle: Memory Summary\nvisibility: private\nsensitivity: none\ntags: [summary]\n---\n\n# Memory Summary\n\n## Quick reference\n\nAdd notes under projects/, decisions/, people/, daily/, etc.\n',
      );
    }
    let copied = 0;
    if (!o.bare) copied = copyStarterVault(dir);
    console.log(green(`Initialized ${dir}`) + (copied ? ` (${copied} starter notes)` : ''));
    printHints([
      `agent-memory new project "Your first project" --source ${dir}`,
      `agent-memory build --source ${dir} --out site --mode private`,
      `agent-memory serve --out site`,
    ]);
  });

program
  .command('build')
  .description('Compile a Markdown vault into a static dashboard + retrieval artifacts.')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .option('-o, --out <dir>', 'output directory', 'site')
  .addOption(new Option('-m, --mode <mode>', 'private | public | redacted').choices(['private', 'public', 'redacted']).default('private'))
  .option('--strict-redact', 'apply strict PII patterns (phone, CC, IPv4)')
  .option('--base-url <url>', 'site base URL for canonical/OG tags')
  .option('--dry-run', 'plan only; do not write files')
  .option('-f, --force', 'force-overwrite a non-empty output directory missing the .agent-memory-output marker')
  .option('--title <text>', 'override dashboard title')
  .action(async (o) => {
    const cfg = loadConfig(process.cwd());
    const title = o.title || cfg.title;
    const baseUrl = o.baseUrl || cfg.baseUrl;
    if (o.dryRun) {
      const notes = await parseVault(o.source);
      console.log(dim(`Would parse ${notes.length} notes from ${o.source}`));
      console.log(dim(`Would write to ${path.resolve(o.out)} in ${o.mode} mode`));
      const issues = validateNotes(notes);
      if (issues.length) console.log(dim(`${issues.length} validation issues (run \`agent-memory validate\` for details)`));
      return;
    }
    const notes = await parseVault(o.source);
    const result = buildSite(
      notes,
      o.out,
      { mode: o.mode, strictRedact: !!o.strictRedact, baseUrl, title, description: cfg.description },
      { force: !!o.force },
    );
    console.log(green(`Built ${result.notes} notes (${result.chunks} chunks) → ${result.out}`));
    printHints([
      `agent-memory serve --out ${o.out}`,
      `agent-memory emit --target agents.md --source ${o.source}`,
      `claude mcp add agent-memory "agent-memory mcp --site ${o.out}"`,
    ]);
  });

program
  .command('validate')
  .description('Warn on missing metadata, possible secrets, oversized notes, broken/private wiki links.')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .option('--json', 'emit issues as JSON')
  .option('--strict', 'exit nonzero on warn or info (default: errors only)')
  .action(async (o) => {
    const notes = await parseVault(o.source);
    const issues = validateNotes(notes);
    if (o.json) {
      console.log(JSON.stringify(issues, null, 2));
    } else {
      for (const i of issues) {
        const tag = i.severity === 'error' ? red('ERROR') : i.severity === 'warn' ? 'WARN ' : 'INFO ';
        console.log(`${tag} ${i.file} [${i.code}] ${i.message}`);
      }
      if (!issues.length) console.log(green('No validation issues.'));
    }
    const hasError = issues.some((i) => i.severity === 'error');
    const hasWarn = issues.some((i) => i.severity === 'warn');
    if (hasError || (o.strict && hasWarn)) process.exitCode = 1;
  });

program
  .command('stats')
  .description('Print counts and health metrics for a vault.')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .action(async (o) => {
    const notes = await parseVault(o.source);
    const byCat = new Map<string, number>();
    let bytes = 0;
    let withTags = 0;
    let broken = 0;
    const ids = new Set(notes.map((n) => n.id));
    for (const n of notes) {
      byCat.set(n.category, (byCat.get(n.category) || 0) + 1);
      bytes += Buffer.byteLength(n.body, 'utf8');
      if (Array.isArray(n.meta?.tags) && (n.meta!.tags as unknown as string[]).length) withTags++;
      for (const l of n.links) if (!ids.has(l)) broken++;
    }
    console.log(`Notes: ${notes.length}`);
    console.log(`Bytes: ${bytes}`);
    console.log(`Tagged: ${withTags} (${notes.length ? Math.round((withTags / notes.length) * 100) : 0}%)`);
    console.log(`Broken wiki links: ${broken}`);
    console.log('Categories:');
    for (const [cat, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
  });

program
  .command('emit')
  .description('Fan out memory into agent-context files (AGENTS.md, CLAUDE.md, .cursorrules, copilot, llms.txt).')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .option('-o, --out <dir>', 'output directory (writes files at canonical paths under this dir)', '.')
  .option('-t, --target <target...>', `one or more of: ${validTargets().join(', ')} (or "all")`)
  .action(async (o) => {
    const notes = await parseVault(o.source);
    const cfg = loadConfig(process.cwd());
    let targets: EmitTarget[];
    if (!o.target || o.target.includes('all')) {
      targets = validTargets();
    } else {
      const valid = new Set(validTargets());
      for (const t of o.target) {
        if (!valid.has(t)) throw new Error(`Unknown emit target: ${t}. Valid: ${validTargets().join(', ')}`);
      }
      targets = o.target as EmitTarget[];
    }
    for (const t of targets) {
      const result = emit(t, { notes, title: cfg.title, description: cfg.description }, o.out);
      console.log(green(`Wrote ${result.target}`) + ` → ${result.outPath} (${result.bytes} bytes)`);
    }
    printHints([`emit also writes inside \`agent-memory build\` output as AGENTS.md + llms.txt automatically`]);
  });

export function resolveStaticPath(rootDir: string, requestUrl = '/index.html') {
  const root = path.resolve(rootDir);
  const rawPath = requestUrl.split('?')[0].split('#')[0] || '/index.html';
  const pathname = rawPath === '/' ? '/index.html' : rawPath;
  const decoded = decodeURIComponent(pathname);
  const file = path.resolve(root, `.${decoded}`);
  const isInside = file === root || file.startsWith(root + path.sep);
  return { root, file, isInside };
}

function contentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.jsonl': 'application/x-ndjson; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
    }[ext] || 'application/octet-stream'
  );
}

program
  .command('serve')
  .description('Serve a built site on http://127.0.0.1:<port>')
  .option('-o, --out <dir>', 'directory to serve', 'site')
  .option('-p, --port <port>', 'port', '4321')
  .option('--no-open', 'do not open the browser automatically')
  .action(async (o) => {
    const root = path.resolve(o.out);
    if (!fs.existsSync(root)) {
      console.error(red(`Output directory not found: ${root}`));
      console.error(dim(`Run \`agent-memory build --source <vault> --out ${o.out}\` first.`));
      process.exitCode = 1;
      return;
    }
    const server = http.createServer((req, res) => {
      try {
        const { file, isInside } = resolveStaticPath(root, req.url || '/index.html');
        if (!isInside) {
          res.statusCode = 403;
          return res.end('Forbidden');
        }
        // Try the resolved path; if it's a directory, fall back to index.html inside it.
        const stat = fs.existsSync(file) ? fs.statSync(file) : null;
        let target = file;
        if (stat && stat.isDirectory()) {
          target = path.join(file, 'index.html');
        }
        fs.readFile(target, (err, data) => {
          if (err) {
            // Serve our generated 404 if present, otherwise plain text.
            const notFound = path.join(root, '404.html');
            if (fs.existsSync(notFound)) {
              res.statusCode = 404;
              res.setHeader('content-type', 'text/html; charset=utf-8');
              return res.end(fs.readFileSync(notFound));
            }
            res.statusCode = 404;
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            return res.end(`Not found: ${req.url}`);
          }
          res.setHeader('content-type', contentType(target));
          res.setHeader('cache-control', 'no-cache');
          res.end(data);
        });
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end(`Bad request: ${(err as Error).message}`);
      }
    });
    server.listen(Number(o.port), '127.0.0.1', async () => {
      const url = `http://127.0.0.1:${o.port}`;
      console.log(green(`Serving ${root} on ${url}`));
      if (o.open !== false && !process.env.CI && !process.env.AGENT_MEMORY_NO_OPEN) {
        try {
          const open = (await import('open')).default;
          await open(url);
        } catch {
          // ignore — opening the browser is best-effort
        }
      }
    });
  });

program
  .command('new <type> <title>')
  .description('Scaffold a new note. Type maps to category (project→projects/, person→people/, etc.).')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .option('--visibility <v>', 'visibility (public|private|team)', 'private')
  .option('--sensitivity <s>', 'sensitivity (none|personal|credential|financial|medical)', 'none')
  .action((type: string, title: string, o) => {
    const safeType = safeSegment(type, 'type');
    if (!VALID_TYPES.has(safeType)) {
      console.error(red(`Unknown type: ${safeType}. Known: ${[...VALID_TYPES].join(', ')}.`));
      console.error(dim('Continuing anyway — directory will be the literal pluralized form.'));
    }
    if (typeof title !== 'string' || !title.trim()) {
      throw new Error('Title is required.');
    }
    if (/[\x00-\x1F]/.test(title)) {
      throw new Error('Title may not contain control characters.');
    }
    const category = TYPE_TO_CATEGORY[safeType] || (safeType.endsWith('s') ? safeType : safeType + 's');
    const dir = path.join(o.source, category);
    fs.mkdirSync(dir, { recursive: true });
    const slug =
      title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'note';
    const frontmatter = dumpYaml({
      title,
      type: safeType,
      status: 'active',
      visibility: o.visibility,
      sensitivity: o.sensitivity,
      tags: [safeType],
      date: new Date().toISOString().slice(0, 10),
    });
    // Sanitize the H1 — escape angle brackets so users can't accidentally introduce raw HTML.
    const safeHeading = title.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
    const body = `---\n${frontmatter}---\n\n# ${safeHeading}\n\n## Summary\n\n## Notes\n`;
    const target = path.join(dir, slug + '.md');
    if (fs.existsSync(target)) {
      throw new Error(`File already exists: ${target}`);
    }
    fs.writeFileSync(target, body);
    console.log(green(`Created ${target}`));
    printHints([`agent-memory validate --source ${o.source}`, `agent-memory build --source ${o.source} --out site`]);
  });

program
  .command('mcp')
  .description('Run as an MCP (Model Context Protocol) server over stdio, exposing a built site as agent-callable tools.')
  .requiredOption('--site <dir>', 'directory containing a previous `agent-memory build` output')
  .action(async (o) => {
    // Lazy import so default CLI startup stays fast.
    const { runMcpServer } = await import('../mcp/server.js');
    await runMcpServer({ siteDir: o.site, name: 'agent-memory-site', version });
  });

program
  .command('publish-check')
  .description('Pre-publish gate. Runs validate, refuses if a public note links to a private one, scans output for residual secrets.')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .option('-o, --out <dir>', 'built site directory', 'site')
  .action(async (o) => {
    const notes = await parseVault(o.source);
    const issues = validateNotes(notes);
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length) {
      for (const e of errors) console.error(red('ERROR') + ` ${e.file} [${e.code}] ${e.message}`);
      process.exitCode = 1;
      return;
    }
    if (fs.existsSync(o.out)) {
      const checkFiles = ['chunks.jsonl', 'search-index.json', 'manifest.json'];
      const { hasPossibleSecret } = await import('../validate.js');
      let leak = false;
      for (const f of checkFiles) {
        const p = path.join(o.out, f);
        if (!fs.existsSync(p)) continue;
        const text = fs.readFileSync(p, 'utf8');
        if (hasPossibleSecret(text)) {
          console.error(red('LEAK') + ` ${f} contains likely secret material — refuse to publish.`);
          leak = true;
        }
      }
      if (leak) {
        process.exitCode = 1;
        return;
      }
    }
    console.log(green('Publish check passed.'));
  });

// Cross-platform main-module detection. Required for Windows where
// process.argv[1] is `C:\...\index.js` and import.meta.url is `file:///C:/...`.
const isMain = (() => {
  try {
    if (!process.argv[1]) return false;
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isMain) {
  program.parseAsync().catch((err) => {
    console.error(red(`Error: ${err?.message || err}`));
    process.exit(1);
  });
}

export { program };
