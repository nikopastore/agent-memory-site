---
title: Memory Summary
visibility: public
sensitivity: none
tags: [summary]
---

# Memory Summary

> This vault is the durable memory for a small team of AI agents that ship a SaaS product. Humans and agents both read and write here.

It's compiled into the public demo at <https://nikopastore.github.io/agent-memory-site/> so you can see exactly what a real "agent operating system" looks like as a published bundle.

## What lives here

- **projects/** — active work with goals, status, next actions
- **decisions/** — durable decisions and the reasoning behind them
- **procedures/** — repeatable workflows (incident response, deploys, weekly review)
- **facts/** — things an agent should never re-derive (versioned constants, defaults)
- **people/** — collaborators and context about them (one is intentionally private)
- **handoffs/** — session-to-session continuity notes

## Three things every agent should know first

1. We use the [[Customer Support Agent v2]] for tier-1 inbound and escalate to humans through the [[Incident Response Handoff]] procedure.
2. The current data pipeline rewrite is tracked in [[Data Pipeline Refactor]] — `chunks.jsonl` from this vault feeds it directly.
3. Privacy posture is decided in [[Separate Private and Public Memory]] — never re-derive that boundary in a session.

See [[Weekly Agent Memory Review]] for how we keep this vault tidy.
