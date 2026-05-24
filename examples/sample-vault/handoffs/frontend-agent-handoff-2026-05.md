---
title: Frontend Agent Handoff — 2026-05
type: handoff
status: complete
visibility: public
sensitivity: none
tags: [handoff, frontend]
date: 2026-05-14
related: [customer-support-agent, data-pipeline-refactor]
---

# Frontend Agent Handoff — 2026-05

> Pattern handoff (not a customer ticket handoff). Shows what cross-session continuity looks like in this vault.

## Where we left off

Frontend agent finished migrating the customer-support-v2 chat widget from `/legacy-chat` → `/chat-v2`. New widget uses MCP to call `search_memory` on each turn rather than embedding chunks in the prompt.

## Verified working

- [x] MCP server wired: `claude mcp add agent-memory "npx -y agent-memory-site mcp --site ./site"`
- [x] `search_memory` returns ≤ 8 chunks under 200ms
- [x] Eval suite green on the 200-ticket cohort
- [x] CSP on the embed page allows only `mcp://` for the agent connection

## Open

- [ ] Tail-latency p99 is 480ms — investigate cold-start of the MCP server when the chat widget hasn't been visited in 10+ min
- [ ] Tone-of-voice eval — see [[Customer voice guidelines]] when it lands

## Next session — start here

1. Read [[Customer Support Agent v2]] for goal + status.
2. Run `agent-memory stats --source memory` and skim broken links.
3. Open the cold-start investigation under `projects/`.

## Related

- [[Customer Support Agent v2]]
- [[Data Pipeline Refactor]]
- [[Incident Response Handoff]]
