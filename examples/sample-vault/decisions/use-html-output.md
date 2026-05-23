---
title: Use HTML Output
type: decision
status: accepted
visibility: public
sensitivity: none
tags: [decision, html, retrieval]
date: 2026-05-15
---

# Use HTML Output

## Decision

Keep Markdown as source and generate semantic HTML for retrieval.

## Why

Markdown is the best human + Git format. Semantic HTML is the best browser-agent format. JSONL is the best RAG format. We compile all three from one source.

## Consequences

- One bundle works for Claude, Codex, Cursor, MCP clients, and any RAG framework.
- We rely on per-build privacy filtering — no editor plugin, no live runtime.
