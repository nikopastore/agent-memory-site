import { describe, expect, it } from 'vitest';
import { extractWikiLinks, slugify } from '../src/ingest/markdown.js';
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
});
