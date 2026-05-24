---
title: Vault frontmatter standard
type: fact
status: active
visibility: public
sensitivity: none
tags: [fact, schema, standard]
date: 2026-01-15
---

# Vault frontmatter standard

The minimum a note must have:

```yaml
---
title: "<human-readable>"
type: project | decision | procedure | fact | person | handoff | daily | instruction
status: active | done | archived | superseded
visibility: public | private | team
sensitivity: none | personal | credential | financial | medical
tags: [<tag>, ...]
date: YYYY-MM-DD       # creation
updated: YYYY-MM-DD    # optional; falls back to file mtime
---
```

## Optional, used by tooling

| Field | Used for |
|---|---|
| `related: [slugs]` | Soft links surfaced in the dashboard |
| `redact: ['literal', ...]` | Per-note deny-list |
| `keywords: [...]` | Stronger search match weight |
| `supersedes: [slugs]` | This note replaces N others; agent should prefer THIS one |
| `superseded_by: slug` | Don't use this note; use the one in `superseded_by` |
| `created_at: ISO8601` | Override file birthtime |

## Why this matters

The build emits all of these as chunk-level metadata. A downstream retrieval pipeline can filter by visibility, prefer non-superseded chunks, and de-prioritize archived content automatically.

## Related

- [[Use chunks.jsonl as the canonical RAG substrate]]
- [[Separate Private and Public Memory]]
