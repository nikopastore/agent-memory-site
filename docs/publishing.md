# Publishing Safely

Agent Memory Site can generate public-friendly output, but memory vaults are often sensitive. Treat publishing as a release process.

## Recommended workflow

```bash
agent-memory validate --source ./memory
agent-memory build --source ./memory --out ./site --mode public
```

Then review:

- `site/**/*.html`
- `site/search-index.json`
- `site/manifest.json`
- `site/chunks.jsonl`

## Secret scanning

Run an external scanner against source and output before publication:

```bash
gitleaks detect --source ./memory
gitleaks detect --source ./site
```

or:

```bash
trufflehog filesystem ./memory
trufflehog filesystem ./site
```

## Launch checklist

- [ ] Source notes have correct `visibility` and `sensitivity`.
- [ ] `agent-memory validate` has no unexpected warnings.
- [ ] Generated HTML/JSON/JSONL reviewed manually.
- [ ] External secret scanner run.
- [ ] Public demo does not include private people, credentials, or personal history.
- [ ] Repo has LICENSE, SECURITY, CONTRIBUTING, CI, and examples.

## SEO checklist for public generated sites

Future versions should generate configurable social metadata, `sitemap.xml`, and `robots.txt`. Until then, publish with a wrapper site or README that includes the core keywords: AI agent memory, Obsidian, Markdown, semantic HTML, RAG, retrieval, JSONL, local-first.
