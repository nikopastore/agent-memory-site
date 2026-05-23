---
title: Use Semantic HTML for Memory Exports
type: decision
status: accepted
visibility: public
sensitivity: none
tags: [decision, html, retrieval]
date: 2026-05-15
---

# Use Semantic HTML for Memory Exports

## Decision

Keep Markdown as the source of truth and compile to semantic HTML + JSONL for retrieval. Do not invent a new note format.

## Why

- Humans and Git already handle Markdown well — diffable, reviewable, AI-editable.
- Semantic HTML (`<article>`, `<section>`, `<aside>`, `data-doc-id`) gives stable structure for browser agents.
- A JSONL retrieval layer with stable `chunk_id`s and `content_hash`es lets any RAG stack ingest the same bundle.

## Consequences

- Every agent (Claude, Codex, Cursor, MCP clients) reads the same compiled bundle, so cross-tool memory never drifts.
- We do not get the live bidirectional editing of an in-editor MCP server. Use `agent-memory watch` (when shipped) or rebuild on change instead.

## Supersedes

- Earlier idea of emitting a single mega-markdown file.
