# Agent Memory Site

Turn a Markdown/Obsidian/Tolaria-style agent memory vault into a private, searchable, semantic HTML dashboard with retrieval-ready JSON artifacts.

## Why this exists

Markdown is still the best source format for humans and Git: easy to write, diff, review, and edit with AI. But semantic HTML can be better as the *compiled interface* for AI retrieval and browser-based agents because it provides stable structure: `<article>`, `<section>`, `<time>`, tables, definition lists, metadata, and explicit index/no-index regions.

**Principle:** Markdown is the database. Semantic HTML is the interface. JSONL chunks are the retrieval layer.

## Quick start

```bash
npm install
npm run build
npm run serve
```

Or with the CLI after building:

```bash
agent-memory init ./my-memory
agent-memory build --source ./my-memory --out ./site --mode private
agent-memory serve --out ./site
agent-memory validate --source ./my-memory
agent-memory new project "New Product" --source ./my-memory
```

## What it generates

- `index.html` dashboard
- category pages for projects, people, decisions, facts, daily logs, handoffs, procedures
- semantic note pages with backlinks
- `search-index.json`
- `manifest.json`
- `chunks.jsonl` with stable chunk IDs and provenance

## Privacy by default

Frontmatter supports:

```yaml
visibility: public|private|team
sensitivity: none|personal|credential|financial|medical
```

`--mode public` excludes private/team notes and sensitive notes by default. `validate` warns on likely API keys, tokens, credentials, oversized notes, missing frontmatter, and broken wiki links.

## How this complements Tolaria / Obsidian

Use Tolaria or Obsidian to write and maintain Markdown. Use Agent Memory Site to publish a static local dashboard and agent-readable retrieval artifacts. It is not trying to replace your note editor.

## Memory types

Recommended folders:

```text
memory/
  MEMORY.md
  projects/
  people/
  decisions/
  facts/
  daily/
  handoffs/
  procedures/
```

## Quality bar

This project optimizes for:

- safe defaults
- semantic accessible HTML
- clean Git workflows
- local-first operation
- retrieval provenance
- agent-friendly summaries
- privacy-aware public exports
