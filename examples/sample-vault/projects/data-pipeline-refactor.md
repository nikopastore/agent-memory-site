---
title: Data Pipeline Refactor
type: project
status: active
visibility: public
sensitivity: none
tags: [project, data, pipeline]
date: 2026-03-08
updated: 2026-05-20
---

# Data Pipeline Refactor

## Goal

Cut billing-area ticket-to-knowledge time from 14 days → 24 hours so the [[Customer Support Agent v2]] has fresh context when CSAT-impacting issues land.

## Current state

Old pipeline:

```
Salesforce → nightly export → CSV in S3 → manual cleanup → wiki copy/paste
```

New pipeline:

```
Salesforce ──webhook──> ingestion service ──parse──> Markdown notes
                                                        │
                                                        ▼
                                            agent-memory-site build
                                                        │
                                                        ▼
                                          chunks.jsonl + MCP server
```

## Status

- [x] Webhook receiver shipped (`apps/ingest/`)
- [x] Markdown emitter normalizes Salesforce fields to our [[Vault frontmatter standard]]
- [ ] Backfill historical 18 months of billing tickets
- [ ] Validate redaction quality on PII-heavy notes (see [[Separate Private and Public Memory]])

## Why static compile instead of live DB

See the [[Use chunks.jsonl as the canonical RAG substrate]] decision. Short version: every agent reads the same bundle; reproducible across CI, prod, and local dev.

## Related

- [[Customer Support Agent v2]]
- [[Weekly Agent Memory Review]]
