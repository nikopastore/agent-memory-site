---
title: How to publish memory safely
type: procedure
status: active
visibility: public
sensitivity: none
tags: [procedure, privacy]
date: 2026-05-22
---

# How to publish memory safely

## Pre-flight

```
agent-memory validate --source memory
agent-memory build --source memory --out site --mode public
agent-memory publish-check --source memory --out site
```

## What `publish-check` enforces

- No public note links to a private note (would leak the title).
- No known secret pattern survived into the output.
- Validation errors must be resolved before publishing.

## When in doubt

Flip the note's `visibility` to `private` and re-run. The build refuses to leak titles via wiki-link, and `chunks.jsonl` / `search-index.json` will not include the body.
