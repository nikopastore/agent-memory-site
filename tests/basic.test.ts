import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractWikiLinks, parseVault, resolveWikiTokens, slugify, tokenizeWikiLinks } from '../src/ingest/markdown.js';
import { assertSafeOutputDir } from '../src/build/safety.js';
import { buildSite } from '../src/build/site.js';
import { includeNote, redactText, redactDeep } from '../src/build/privacy.js';
import { hasPossibleSecret, validateNotes } from '../src/validate.js';
import { resolveStaticPath } from '../src/cli/index.js';
import { chunkNote } from '../src/build/chunks.js';
import { dumpYaml } from '../src/util/yaml.js';

describe('basics', () => {
  it('slugifies', () => {
    expect(slugify('Use HTML Output')).toBe('use-html-output');
  });

  it('extracts wiki links with various suffixes', () => {
    expect(extractWikiLinks('See [[Use HTML Output]]')).toEqual(['Use HTML Output']);
    expect(extractWikiLinks('See [[Use HTML Output#decision]]')).toEqual(['Use HTML Output']);
    expect(extractWikiLinks('See [[Use HTML Output^block-1]]')).toEqual(['Use HTML Output']);
    expect(extractWikiLinks('See [[Use HTML Output|the choice]]')).toEqual(['Use HTML Output']);
    expect(extractWikiLinks('See [[Use HTML Output#decision|the choice]]')).toEqual(['Use HTML Output']);
  });

  it('excludes private notes in public mode', () => {
    expect(includeNote({ meta: { visibility: 'private', sensitivity: 'none' } } as any, 'public')).toBe(false);
    expect(includeNote({ meta: { visibility: 'public', sensitivity: 'none' } } as any, 'public')).toBe(true);
    expect(includeNote({ meta: { visibility: 'public', sensitivity: 'credential' } } as any, 'public')).toBe(false);
  });

  it('detects and redacts common secrets', () => {
    const sampleSecret = `${'github_pat'}_${'a'.repeat(24)}`;
    expect(hasPossibleSecret(`token = ${sampleSecret}`)).toBe(true);
    expect(redactText(`email ${'test'}@${'example.com'} token = ${sampleSecret}`)).toBe(
      'email [redacted-email] [redacted-secret]',
    );
  });

  it('redacts unicode emails too', () => {
    const raw = 'contact péstore@example.com about it';
    expect(redactText(raw)).toContain('[redacted-email]');
  });

  it('strict redact catches phones / IPs / CC-shaped digits', () => {
    expect(redactText('call +1 555-867-5309', { strict: true })).toContain('[redacted-phone]');
    expect(redactText('server 10.0.0.1 is up', { strict: true })).toContain('[redacted-ip]');
    expect(redactText('card 4242 4242 4242 4242', { strict: true })).toContain('[redacted-cc]');
  });

  it('per-note deny-list redacts arbitrary terms', () => {
    expect(redactText('Project Atlas is the codename.', { denyList: ['Atlas'] })).toContain('[redacted-denylist]');
  });

  it('redactDeep handles arrays and nested objects', () => {
    const result = redactDeep({
      tags: ['contact:foo@bar.com', 'normal-tag'],
      nested: { email: 'a@b.co', other: 'fine' },
    });
    expect(JSON.stringify(result)).not.toContain('foo@bar.com');
    expect(JSON.stringify(result)).not.toContain('a@b.co');
  });

  it('resolves normal static paths inside the output root (cross-platform)', () => {
    const result = resolveStaticPath('examples/sample-site', '/index.html');
    expect(result.isInside).toBe(true);
    expect(result.file.endsWith(path.join('examples', 'sample-site', 'index.html'))).toBe(true);
  });

  it('blocks path traversal attempts', () => {
    const result = resolveStaticPath('examples/sample-site', '/../package.json');
    expect(result.isInside).toBe(false);
  });

  it('escapes raw HTML before rendering markdown', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-xss-'));
    fs.writeFileSync(
      path.join(dir, 'evil.md'),
      '---\ntitle: Evil\n---\n\n# Hi\n<script>alert(1)</script>\n<img src=x onerror=alert(2)>',
    );
    const notes = await parseVault(dir);
    expect(notes[0].html).not.toContain('<script>');
    expect(notes[0].html).not.toContain('<img');
    expect(notes[0].html).toContain('&lt;script&gt;');
    expect(notes[0].html).toContain('&lt;img');
  });

  it('blocks javascript: URLs in markdown links (XSS)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-jsurl-'));
    fs.writeFileSync(
      path.join(dir, 'jsurl.md'),
      '---\ntitle: JS URL\n---\n\n[Click](javascript:alert(1))\n![](javascript:alert(2))',
    );
    const notes = await parseVault(dir);
    expect(notes[0].html).not.toMatch(/href="javascript:/);
    expect(notes[0].html).toContain('#blocked');
    expect(notes[0].html).toMatch(/blocked-image|#blocked/);
  });

  it('redacts JSON and JSONL artifacts in redacted mode', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-redact-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-redact-out-'));
    fs.writeFileSync(
      path.join(source, 'note.md'),
      '---\ntitle: Secret\nvisibility: public\nsensitivity: none\n---\n\n# Secret\nemail test@example.com\ntoken = github_pat_aaaaaaaaaaaaaaaaaaaaaaaa',
    );
    const notes = await parseVault(source);
    buildSite(notes, out, 'redacted', { force: true });
    const search = fs.readFileSync(path.join(out, 'search-index.json'), 'utf8');
    const chunks = fs.readFileSync(path.join(out, 'chunks.jsonl'), 'utf8');
    expect(search).not.toContain('test@example.com');
    expect(chunks).not.toContain('github_pat_');
    expect(search).toContain('[redacted-email]');
    expect(chunks).toContain('[redacted-secret]');
  });

  it('search-index is redacted even in private mode (defense in depth)', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-deep-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-deep-out-'));
    fs.writeFileSync(
      path.join(source, 'note.md'),
      '---\ntitle: With Email\nvisibility: public\nsensitivity: none\n---\n\nContact alice@example.com.',
    );
    const notes = await parseVault(source);
    buildSite(notes, out, 'private', { force: true });
    const search = fs.readFileSync(path.join(out, 'search-index.json'), 'utf8');
    expect(search).not.toContain('alice@example.com');
    expect(search).toContain('[redacted-email]');
  });

  it('CRITICAL: public mode does not leak private note titles via wiki-links', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-wiki-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-wiki-out-'));
    fs.mkdirSync(path.join(source, 'projects'), { recursive: true });
    fs.writeFileSync(
      path.join(source, 'projects', 'secret.md'),
      '---\ntitle: "Operation Salted Caramel"\nvisibility: private\nsensitivity: none\n---\n\nThis is secret.',
    );
    fs.writeFileSync(
      path.join(source, 'projects', 'public.md'),
      '---\ntitle: Public Plan\nvisibility: public\nsensitivity: none\n---\n\nSee [[Operation Salted Caramel]].',
    );
    const notes = await parseVault(source);
    buildSite(notes, out, 'public', { force: true });
    const all = ['chunks.jsonl', 'search-index.json', 'manifest.json', 'llms.txt'].flatMap((f) => {
      const p = path.join(out, f);
      return fs.existsSync(p) ? [fs.readFileSync(p, 'utf8')] : [];
    });
    const allHtml = fs
      .readdirSync(path.join(out, 'notes'))
      .map((f) => fs.readFileSync(path.join(out, 'notes', f), 'utf8'));
    const combined = [...all, ...allHtml].join('\n');
    expect(combined).not.toContain('Operation Salted Caramel');
    expect(combined).toMatch(/redacted-link/);
  });

  it('public note wiki-link to private note is flagged by validate', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-valid-src-'));
    fs.mkdirSync(path.join(source, 'projects'), { recursive: true });
    fs.writeFileSync(
      path.join(source, 'projects', 'secret.md'),
      '---\ntitle: Atlas\nvisibility: private\n---\n\nSecret.',
    );
    fs.writeFileSync(
      path.join(source, 'projects', 'open.md'),
      '---\ntitle: Open\nvisibility: public\n---\n\nSee [[Atlas]].',
    );
    const notes = await parseVault(source);
    const issues = validateNotes(notes);
    const hit = issues.find((i) => i.code === 'public-links-private');
    expect(hit).toBeTruthy();
    expect(hit?.severity).toBe('error');
  });

  it('refuses dangerous output directories (cwd, parent of cwd)', () => {
    expect(() => assertSafeOutputDir(process.cwd())).toThrow();
    expect(() => assertSafeOutputDir(path.dirname(process.cwd()))).toThrow();
    // Filesystem root
    const root = path.parse(process.cwd()).root;
    expect(() => assertSafeOutputDir(root)).toThrow();
  });

  it('refuses a non-empty output directory without the marker file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-marker-'));
    fs.writeFileSync(path.join(dir, 'someone-elses.txt'), 'precious');
    expect(() => assertSafeOutputDir(dir)).toThrow(/marker/);
    // With --force, allowed
    expect(() => assertSafeOutputDir(dir, { force: true })).not.toThrow();
  });

  it('detects HOME / USERPROFILE on Windows', () => {
    const original = process.env.HOME;
    const originalUP = process.env.USERPROFILE;
    try {
      // Simulate Windows: HOME unset, USERPROFILE set to a tmp dir.
      delete process.env.HOME;
      const fake = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-userprofile-'));
      process.env.USERPROFILE = fake;
      // The exact USERPROFILE path itself must be refused (would wipe Documents/Desktop/etc).
      expect(() => assertSafeOutputDir(fake)).toThrow();
    } finally {
      if (original !== undefined) process.env.HOME = original;
      else delete process.env.HOME;
      if (originalUP !== undefined) process.env.USERPROFILE = originalUP;
      else delete process.env.USERPROFILE;
    }
  });

  it('YAML serialization defeats injection via title', () => {
    const yaml = dumpYaml({ title: 'Innocuous"\nvisibility: public\npwned: yes', visibility: 'private' });
    expect(yaml).toContain('visibility: private');
    // The injection text must remain string-escaped, not parse as a YAML key
    expect(yaml).not.toMatch(/^pwned: yes/m);
  });

  it('chunker handles single-#, deep nesting, and produces stable ids', () => {
    const note = {
      id: 'p/test',
      sourcePath: '/tmp/p/test.md',
      relPath: 'p/test.md',
      slug: 'p-test',
      category: 'p',
      title: 'Test',
      body: '# Top\n\nIntro text.\n\n## A\n\nA content.\n\n### A1\n\nA1 content.\n\n## B\n\nB content.',
      html: '',
      text: '',
      meta: {},
      links: [],
      backlinks: [],
      content_hash: 'h',
    } as any;
    const chunks = chunkNote(note);
    // No duplicated heading paths like [title, title]
    expect(chunks.every((c) => new Set(c.heading_path).size === c.heading_path.length)).toBe(true);
    // h3 chunk includes deeper heading path
    const a1 = chunks.find((c) => c.heading_path.includes('A1'));
    expect(a1?.heading_path).toEqual(['Test', 'Top', 'A', 'A1']);
    // Stable chunk_id: no `i+1` index prefix
    expect(chunks.map((c) => c.chunk_id).every((id) => /#[a-z0-9-]+$/.test(id))).toBe(true);
    // content_hash exists
    expect(chunks.every((c) => typeof c.content_hash === 'string' && c.content_hash.length > 0)).toBe(true);
  });

  it('chunker strips heading lines and code fences from text', () => {
    const note = {
      id: 'p/code',
      sourcePath: '/tmp/p/code.md',
      relPath: 'p/code.md',
      slug: 'p-code',
      category: 'p',
      title: 'Code',
      body: '## Foo\n\nReal text here.\n\n```bash\nrm -rf /\n```\n\nMore text.',
      html: '',
      text: '',
      meta: {},
      links: [],
      backlinks: [],
      content_hash: 'h',
    } as any;
    const c = chunkNote(note)[0];
    expect(c.text).not.toContain('Foo');
    expect(c.text).not.toContain('rm -rf');
    expect(c.text).toContain('Real text');
    expect(c.text).toContain('More text');
  });

  it('parseVault uses forward-slash relPath even on Windows', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-paths-'));
    fs.mkdirSync(path.join(source, 'projects'), { recursive: true });
    fs.writeFileSync(path.join(source, 'projects', 'foo.md'), '---\ntitle: Foo\n---\n\nBody.');
    const notes = await parseVault(source);
    expect(notes[0].relPath).toBe('projects/foo.md');
    expect(notes[0].relPath).not.toContain('\\');
  });

  it('parseVault disambiguates slug collisions instead of overwriting', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-slugs-'));
    fs.mkdirSync(path.join(source, 'a'), { recursive: true });
    fs.mkdirSync(path.join(source, 'b'), { recursive: true });
    // Different content but same slug after normalization (different categories).
    fs.writeFileSync(path.join(source, 'a', 'shared.md'), '---\ntitle: A\n---\n\nFirst.');
    fs.writeFileSync(path.join(source, 'b', 'shared.md'), '---\ntitle: B\n---\n\nSecond.');
    const notes = await parseVault(source);
    const slugs = new Set(notes.map((n) => n.slug));
    expect(slugs.size).toBe(notes.length);
  });

  it('parseVault throws a helpful error on malformed YAML frontmatter', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-badyaml-'));
    fs.writeFileSync(path.join(source, 'bad.md'), '---\ntitle: "broken\n---\n\nBody.');
    await expect(parseVault(source)).rejects.toThrow(/frontmatter in bad\.md/);
  });

  it('build writes the marker file and a 404', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-marker-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-marker-out-'));
    fs.writeFileSync(path.join(source, 'n.md'), '---\ntitle: N\nvisibility: public\n---\n\nbody');
    const notes = await parseVault(source);
    buildSite(notes, out, 'private', { force: true });
    expect(fs.existsSync(path.join(out, '.agent-memory-output'))).toBe(true);
    expect(fs.existsSync(path.join(out, '404.html'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'llms.txt'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'llms-full.txt'))).toBe(true);
    expect(fs.existsSync(path.join(out, '.well-known', 'agent-card.json'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'favicon.svg'))).toBe(true);
  });

  it('build sets a strict CSP on generated pages', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-csp-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-csp-out-'));
    fs.writeFileSync(path.join(source, 'a.md'), '---\ntitle: A\nvisibility: public\n---\n\nbody');
    const notes = await parseVault(source);
    buildSite(notes, out, 'private', { force: true });
    const index = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    expect(index).toMatch(/Content-Security-Policy.+default-src 'none'/);
    expect(index).not.toContain("script-src 'unsafe-inline'");
  });

  it('build manifest drops source paths in public mode', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-mani-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-mani-out-'));
    fs.mkdirSync(path.join(source, 'projects'), { recursive: true });
    fs.writeFileSync(
      path.join(source, 'projects', 'codename-x.md'),
      '---\ntitle: X\nvisibility: public\n---\n\nbody',
    );
    const notes = await parseVault(source);
    buildSite(notes, out, 'public', { force: true });
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
    expect(manifest.notes[0].source).toBeUndefined();
  });

  it('tokenize+resolve roundtrip preserves visible links and redacts hidden ones', async () => {
    const tokens = tokenizeWikiLinks('See [[Foo]] and [[Bar]].');
    const allowed = new Map([['foo', 'notes/foo.html']]);
    const html = resolveWikiTokens(tokens, allowed);
    expect(html).toContain('notes/foo.html');
    expect(html).toContain('redacted-link');
  });
});
