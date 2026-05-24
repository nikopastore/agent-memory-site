---
title: Customer Support Agent v2
type: project
status: active
visibility: public
sensitivity: none
tags: [project, agent, support, rag]
date: 2026-04-12
updated: 2026-05-22
---

# Customer Support Agent v2

## Goal

Replace v1 (rule-based zendesk macros) with a retrieval-grounded LLM that handles tier-1 inbound and escalates cleanly via the [[Incident Response Handoff]] procedure.

## Status

- [x] Index public knowledge base via this vault → `chunks.jsonl` (see [[Use chunks.jsonl as the canonical RAG substrate]])
- [x] Wire up Claude with `agent-memory mcp --site ./site` for live read access
- [x] Eval suite: 200 historical tickets, target 70% auto-resolve
- [ ] Add tone-of-voice constraint per [[Customer voice guidelines]]
- [ ] Ship behind feature flag `support_agent_v2`

## Eval results (last run)

| Cohort | Tickets | Auto-resolve | CSAT |
|---|---|---|---|
| Onboarding | 80 | 78% | 4.6 |
| Billing | 60 | 64% | 4.4 |
| Bugs | 60 | 41% | 4.1 |

## Risks

- Public knowledge base is incomplete in the billing area; see [[Data Pipeline Refactor]] for the fix.
- Privacy: customers' email addresses arrive in transcripts. We use `--mode redacted` for all chunks we re-index from transcripts (see [[Separate Private and Public Memory]]).

## Related

- [[Weekly Agent Memory Review]]
- [[Use chunks.jsonl as the canonical RAG substrate]]
- [[Frontend Agent Handoff — 2026-05]]
