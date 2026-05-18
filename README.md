# Agent Memory Site

**Turn Markdown/Obsidian AI-agent memory vaults into private semantic dashboards, searchable indexes, and retrieval-ready JSONL chunks.**

> Markdown is the database. Semantic HTML is the interface. JSONL is the retrieval layer.

[![CI](https://github.com/nikopastore/agent-memory-site/actions/workflows/ci.yml/badge.svg)](https://github.com/nikopastore/agent-memory-site/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)

Agent Memory Site is a local-first CLI for people building with Claude, Codex, AI agents, Obsidian, Tolaria, and Markdown knowledge bases. It compiles your human-editable memory notes into a browser dashboard plus machine-readable artifacts that agents and RAG pipelines can retrieve with provenance.

## Why it exists

Markdown is still the best source format for humans and Git: easy to write, diff, review, and edit with AI. But semantic HTML is a better compiled interface for browser agents and retrieval because it gives stable structure: `<article>`, `<section>`, metadata, backlinks, and explicit index/no-index regions.

Agent Memory Site helps you:

- Browse a memory vault without opening Obsidian.
- Generate a static dashboard for private or team use.
- Export `search-index.json`, `manifest.json`, and `chunks.jsonl` for retrieval.
- Keep public exports safer with visibility/sensitivity frontmatter and validation.
- Preserve source paths, note IDs, categories, tags, backlinks, and chunk provenance.

## Quick start

```bash
git clone https://github.com/nikopastore/agent-memory-site.git
cd agent-memory-site
npm install
npm run build
npm run serve
```

Open <http://localhost:4321>.

Or use the CLI after building:

```bash
npm run build
node dist/cli/index.js init ./my-memory
node dist/cli/index.js new project "Launch Plan" --source ./my-memory
node dist/cli/index.js validate --source ./my-memory
node dist/cli/index.js build --source ./my-memory --out ./site --mode private
node dist/cli/index.js serve --out ./site
```

When published to npm, the intended usage is:

```bash
npm install -g agent-memory-site
agent-memory init ./my-memory
agent-memory build --source ./my-memory --out ./site --mode private
agent-memory serve --out ./site
```

## Demo

A polished screenshot/GIF should be added before a broad public launch. The recommended launch demo is:

```text
agent-memory init ./memory
agent-memory new decision "Use semantic HTML for memory exports"
agent-memory build --source ./memory --out ./site --mode private
agent-memory serve --out ./site
```

Demo assets to add:

- `assets/screenshot-dashboard.png`
- `assets/screenshot-note.png`
- `assets/demo.gif` showing init → build → dashboard → chunks

## What it generates

- `index.html` dashboard
- category pages for projects, people, decisions, facts, daily logs, handoffs, and procedures
- semantic note pages with backlinks
- `search-index.json` for keyword/metadata lookup
- `manifest.json` with generated note inventory
- `chunks.jsonl` with stable chunk IDs and provenance

Example generated chunk:

```json
{
  "chunk_id": "projects/launch-plan#launch-plan",
  "doc_id": "projects/launch-plan",
  "title": "Launch Plan",
  "heading_path": ["Launch Plan"],
  "text": "...",
  "html": "<section>...</section>",
  "source_path": "projects/launch-plan.md"
}
```

## CLI reference

```bash
agent-memory init [dir]
```

Create a starter memory vault.

```bash
agent-memory new <type> <title> --source ./memory
```

Create a new note under a typed folder such as `projects`, `decisions`, `facts`, `people`, `handoffs`, or `procedures`.

```bash
agent-memory validate --source ./memory
```

Warn on missing metadata, likely secrets, oversized notes, and broken wiki links.

```bash
agent-memory build --source ./memory --out ./site --mode private
```

Build a static dashboard and retrieval artifacts.

Modes:

- `private`: include all parsed notes.
- `public`: exclude `visibility: private|team` and sensitive notes.
- `redacted`: include notes but redact common emails/tokens/secrets best-effort.

```bash
agent-memory serve --out ./site --port 4321
```

Serve generated static files locally.

## Recommended vault structure

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

Recommended frontmatter:

```yaml
---
title: Launch Plan
type: project
status: active
visibility: private
sensitivity: none
tags: [launch, ai-agent]
date: 2026-05-17
---
```

## Privacy by default

Frontmatter supports:

```yaml
visibility: public|private|team
sensitivity: none|personal|credential|financial|medical
```

`--mode public` excludes private/team notes and sensitive notes by default. `validate` warns on likely API keys, tokens, credentials, oversized notes, missing frontmatter, and broken wiki links.

**Important:** redaction and validation are best-effort. Do not store real secrets in memory notes. Before publishing a generated site, inspect `site/`, `search-index.json`, `manifest.json`, and `chunks.jsonl` manually and run a secret scanner such as Gitleaks or TruffleHog.

See [docs/privacy.md](docs/privacy.md) and [docs/publishing.md](docs/publishing.md).

## How this complements Tolaria / Obsidian

Use Tolaria or Obsidian to write and maintain Markdown. Use Agent Memory Site to publish a static local dashboard and agent-readable retrieval artifacts. It is not trying to replace your note editor.

## SEO and public launch checklist

Before making a repo/site public:

- [ ] Add real dashboard and note screenshots.
- [ ] Add a short GIF demo above the fold.
- [ ] Confirm `npm run ci` passes.
- [ ] Run `agent-memory validate --source ./memory`.
- [ ] Review generated HTML, JSON, and JSONL outputs.
- [ ] Run an external secret scanner on source and generated output.
- [ ] Add GitHub topics: `ai-agent`, `agent-memory`, `obsidian`, `markdown`, `rag`, `semantic-html`, `knowledge-base`, `local-first`, `static-site-generator`, `llm`, `claude`, `codex`, `developer-tools`, `typescript`.
- [ ] Enable GitHub Discussions if you can support community questions.
- [ ] Publish a demo page and add it as the GitHub website URL.

## Roadmap

- richer public demo and screenshots
- hosted GitHub Pages example
- sitemap/robots/Open Graph generation
- stronger schema validation for frontmatter
- `publish-check` command with stricter privacy checks
- import/export adapters for common agent memory layouts
- embedding-ready chunk metadata and cookbook examples

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), run `npm run ci`, and open a focused PR.

## Security

For vulnerability reports and privacy guidance, see [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
