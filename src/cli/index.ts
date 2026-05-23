#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { Command } from 'commander';
import { parseVault } from '../ingest/markdown.js';
import { buildSite } from '../build/site.js';
import { validateNotes } from '../validate.js';

const program = new Command();

program
  .name('agent-memory')
  .description('Generate semantic HTML and retrieval chunks from Markdown agent memory vaults')
  .version('0.1.0');

function safeSegment(value: string, label: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)) {
    throw new Error(`Invalid ${label}: use only letters, numbers, dashes, and underscores.`);
  }
  return value;
}

program.command('init [dir]').action((dir = 'memory') => {
  fs.mkdirSync(dir, { recursive: true });
  for (const sub of ['projects', 'people', 'decisions', 'facts', 'daily', 'handoffs', 'procedures']) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }
  fs.writeFileSync(
    path.join(dir, 'MEMORY.md'),
    '---\ntitle: Memory Summary\nvisibility: private\nsensitivity: none\ntags: [summary]\n---\n\n# Memory Summary\n\n## Quick reference\n',
  );
  console.log(`Initialized ${dir}`);
});

program
  .command('build')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .option('-o, --out <dir>', 'output', 'dist')
  .option('-m, --mode <mode>', 'private|public|redacted', 'private')
  .action(async (o) => {
    if (!['private', 'public', 'redacted'].includes(o.mode)) {
      throw new Error(`Invalid mode: ${o.mode}. Expected private, public, or redacted.`);
    }
    const notes = await parseVault(o.source);
    buildSite(notes, o.out, o.mode);
    console.log(`Built ${notes.length} notes to ${o.out}`);
  });

program
  .command('validate')
  .option('-s, --source <dir>', 'source vault', 'memory')
  .action(async (o) => {
    const notes = await parseVault(o.source);
    const warnings = validateNotes(notes);
    warnings.forEach((w) => console.log('WARN', w));
    if (warnings.length) process.exitCode = 1;
    else console.log('No validation warnings.');
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

function contentType(file: string) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.jsonl': 'application/x-ndjson; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    }[ext] || 'application/octet-stream'
  );
}

program
  .command('serve')
  .option('-o, --out <dir>', 'output', 'dist')
  .option('-p, --port <port>', 'port', '4321')
  .action((o) => {
    const root = path.resolve(o.out);
    const server = http.createServer((req, res) => {
      try {
        const { file, isInside } = resolveStaticPath(root, req.url || '/index.html');
        if (!isInside) {
          res.statusCode = 403;
          return res.end('Forbidden');
        }
        fs.readFile(file, (err, data) => {
          if (err) {
            res.statusCode = 404;
            res.end('Not found');
          } else {
            res.setHeader('content-type', contentType(file));
            res.end(data);
          }
        });
      } catch {
        res.statusCode = 400;
        res.end('Bad request');
      }
    });
    server.listen(Number(o.port), '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${o.port}`));
  });

program
  .command('new <type> <title>')
  .option('-s, --source <dir>', 'source', 'memory')
  .action((type, title, o) => {
    const safeType = safeSegment(type, 'type');
    const dir = path.join(o.source, safeType.endsWith('s') ? safeType : safeType + 's');
    fs.mkdirSync(dir, { recursive: true });
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const body = `---\ntitle: "${title}"\ntype: ${safeType}\nstatus: active\nvisibility: private\nsensitivity: none\ntags: [${safeType}]\ndate: ${new Date().toISOString().slice(0, 10)}\n---\n\n# ${title}\n\n## Summary\n\n## Notes\n`;
    fs.writeFileSync(path.join(dir, slug + '.md'), body);
    console.log(`Created ${path.join(dir, slug + '.md')}`);
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}
