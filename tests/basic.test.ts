import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractWikiLinks, parseVault, slugify } from '../src/ingest/markdown.js';
import { assertSafeOutputDir, buildSite } from '../src/build/site.js';
import { includeNote, redactText } from '../src/build/privacy.js';
import { hasPossibleSecret } from '../src/validate.js';
import { resolveStaticPath } from '../src/cli/index.js';

describe('basics', () => {
  it('slugifies', () => {
    expect(slugify('Use HTML Output')).toBe('use-html-output');
  });

  it('extracts wiki links', () => {
    expect(extractWikiLinks('See [[Use HTML Output]]')).toEqual(['Use HTML Output']);
  });

  it('excludes private notes in public mode', () => {
    expect(includeNote({ meta: { visibility: 'private', sensitivity: 'none' } } as any, 'public')).toBe(false);
  });

  it('detects and redacts common secrets', () => {
    const sampleSecret = `${'github_pat'}_${'a'.repeat(24)}`;
    expect(hasPossibleSecret(`token = ${sampleSecret}`)).toBe(true);
    expect(redactText(`email ${'test'}@${'example.com'} token = ${sampleSecret}`)).toBe(
      'email [redacted-email] [redacted-secret]',
    );
  });

  it('resolves normal static paths inside the output root', () => {
    const result = resolveStaticPath('examples/sample-site', '/index.html');
    expect(result.isInside).toBe(true);
    expect(result.file.endsWith('examples/sample-site/index.html')).toBe(true);
  });

  it('blocks path traversal attempts', () => {
    const result = resolveStaticPath('examples/sample-site', '/../package.json');
    expect(result.isInside).toBe(false);
  });

  it('escapes raw HTML before rendering markdown', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-xss-'));
    fs.writeFileSync(path.join(dir, 'evil.md'), '---\ntitle: Evil\n---\n\n# Hi\n<script>alert(1)</script>\n<img src=x onerror=alert(2)>');
    const notes = await parseVault(dir);
    // raw script tag / unescaped event handler should NOT appear
    expect(notes[0].html).not.toContain('<script>');
    expect(notes[0].html).not.toContain('<img');
    // angle brackets escaped to entities = safe text rendering
    expect(notes[0].html).toContain('&lt;script&gt;');
    expect(notes[0].html).toContain('&lt;img');
  });

  it('redacts JSON and JSONL artifacts in redacted mode', async () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-redact-src-'));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-memory-redact-out-'));
    fs.writeFileSync(path.join(source, 'note.md'), '---\ntitle: Secret\nvisibility: public\nsensitivity: none\n---\n\n# Secret\nemail test@example.com\ntoken = github_pat_aaaaaaaaaaaaaaaaaaaaaaaa');
    const notes = await parseVault(source);
    buildSite(notes, out, 'redacted');
    const search = fs.readFileSync(path.join(out, 'search-index.json'), 'utf8');
    const chunks = fs.readFileSync(path.join(out, 'chunks.jsonl'), 'utf8');
    expect(search).not.toContain('test@example.com');
    expect(chunks).not.toContain('github_pat_');
    expect(search).toContain('[redacted-email]');
    expect(chunks).toContain('[redacted-secret]');
  });

  it('refuses dangerous output directories', () => {
    expect(() => assertSafeOutputDir(process.cwd())).toThrow(/unsafe output directory|parent directory/);
    expect(() => assertSafeOutputDir(path.dirname(process.cwd()))).toThrow(/parent directory/);
  });
});
