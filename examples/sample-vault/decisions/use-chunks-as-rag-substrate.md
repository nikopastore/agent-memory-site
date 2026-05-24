---
title: Use chunks.jsonl as the canonical RAG substrate
type: decision
status: accepted
visibility: public
sensitivity: none
tags: [decision, rag, architecture]
date: 2026-02-19
---

# Use chunks.jsonl as the canonical RAG substrate

## Decision

Every retrieval-augmented surface in the company (support agent, internal helpdesk, the docs chatbot) reads from the same `chunks.jsonl` produced by `agent-memory build`. We do not run separate per-app embedding pipelines.

## Why

- **One source of truth.** A change to a procedure note propagates to every agent in one rebuild.
- **Reproducible.** `content_hash` and stable `chunk_id` let us cache embeddings safely and diff "what did the agent see today vs last week".
- **Auditable.** Provenance metadata (`source_path`, `canonical_url`, `visibility`) survives end-to-end, so we can answer "where did the agent get that answer from?" in one query.
- **Privacy-aware.** Build modes (private/public/redacted) compose with our [[Separate Private and Public Memory]] decision — we can hand the same pipeline a public-mode call for the customer-facing chatbot and a private-mode call for the internal helpdesk.

## Consequences

- We hard-depend on `agent-memory-site`. We mitigate by pinning the version and keeping a local fork-ready copy.
- Embedding is currently external (per-agent). The roadmap to fold embeddings into the build is in [[Data Pipeline Refactor]].

## Supersedes

- A draft proposal for per-app LlamaIndex pipelines (Q1 2026) — rejected for the same-source-of-truth reason.

## Related

- [[Separate Private and Public Memory]]
- [[Customer Support Agent v2]]
