---
title: How to publish memory safely
type: procedure
status: active
visibility: public
sensitivity: none
tags: [procedure, privacy, publish]
date: 2026-05-22
---

# How to publish memory safely

## Pre-flight

1. `agent-memory validate --source memory`
2. `agent-memory build --source memory --out site --mode public`
3. `agent-memory publish-check --source memory --out site`

## What `publish-check` enforces

- No public note links to a private note (would leak the title).
- No known secret pattern survived into the output `chunks.jsonl` / `search-index.json` / `manifest.json`.
- No "missing visibility" notes (which default to private — fine privately, dangerous when you flip a flag).

## Recovery

If `publish-check` fails:

- Mark the offending note `visibility: private` or `team`.
- Use a deny-list at the top of the note frontmatter:
  ```yaml
  redact: ['Project Codename', 'staging.internal']
  ```
- Re-run the build with `--strict-redact` if your notes contain phones, IPs, or credit-card-like sequences.

## Related

- [[Use Semantic HTML for Memory Exports]]
