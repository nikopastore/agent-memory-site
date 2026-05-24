---
title: Separate Private and Public Memory
type: decision
status: accepted
visibility: public
sensitivity: none
tags: [decision, privacy, security]
date: 2026-01-22
---

# Separate Private and Public Memory

## Decision

Every note in this vault declares `visibility` and `sensitivity` in frontmatter. We do not rely on directory layout, file naming, or copy-paste discipline.

```yaml
visibility: public | private | team
sensitivity: none | personal | credential | financial | medical
```

`--mode public` ships only `visibility: public` notes with `sensitivity: none`. `--mode redacted` ships more, but scrubs emails / API-key shapes / JWTs / phone numbers via [[Redaction patterns]]. `--mode private` is the internal default.

## Why this and not directories

- Notes move. Frontmatter survives moves; directories don't.
- Wiki-links cross categories naturally. A `decisions/` note linking to a `people/` note shouldn't break because someone reorganized.
- The compiler resolves wiki-links AFTER privacy filtering, so a public note linking to a private note collapses to `[redacted-link]` — the target's title never leaks.

## Enforcement

- `agent-memory publish-check` runs in CI before any public deploy and refuses if a public note links to a private one.
- `agent-memory validate --strict` runs in pre-commit.

## Related

- [[Use chunks.jsonl as the canonical RAG substrate]]
- [[Customer Support Agent v2]]
