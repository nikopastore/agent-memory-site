---
title: Weekly Agent Memory Review
type: procedure
status: active
visibility: public
sensitivity: none
tags: [procedure, ops, review]
date: 2026-02-05
---

# Weekly Agent Memory Review

Friday, 60 minutes. Two humans, one agent. The point is to keep this vault from rotting.

## Inputs

- `agent-memory stats --source ./memory` — vault size, broken-link count, tag coverage.
- `agent-memory validate --source ./memory --strict --json` — any errors, warnings, missing visibility.
- This week's `handoffs/*.md` — patterns we should promote to procedures.
- Last week's review note.

## Agenda

1. **Validate** (5 min). Run `validate --strict`. Resolve every error before standup.
2. **Backlog** (15 min). Walk handoffs from the week. Promote any pattern that hit ≥2 times into a procedure or fact.
3. **Stale notes** (10 min). Find notes `updated > 90 days ago` with `status: active`. Update or archive (`status: archived`).
4. **Broken links** (10 min). Fix wiki-links → `404` targets.
5. **Privacy audit** (10 min). Run `agent-memory publish-check --mode public`. Inspect anything new.
6. **Notes for next week** (10 min). Capture themes, deferred items.

## Output

A single note in `daily/` titled `{{ date }} — Weekly Review`, with the diff vs. last week and the queue for next week.

## Related

- [[Incident Response Handoff]]
- [[Use chunks.jsonl as the canonical RAG substrate]]
