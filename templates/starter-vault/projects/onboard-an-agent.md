---
title: Onboard an Agent
type: project
status: active
visibility: public
sensitivity: none
tags: [project, onboarding, starter]
date: 2026-05-22
---

# Onboard an Agent

## Goal

Give a fresh agent enough context to be useful in 90 seconds — without leaking anything private.

## Current status

- [x] Compile vault → static site
- [x] Auto-emit `AGENTS.md`, `llms.txt`, `agent-card.json`
- [ ] Add a 60-second screencast to the README
- [ ] Write a "what counts as memory" doc

## Next actions

1. Run `agent-memory build --source memory --out site --mode private`.
2. Wire MCP: `claude mcp add agent-memory "agent-memory mcp --site ./site"`.
3. Ask the agent to summarize the memory in three bullets — verify it cites `doc_id`s.

## Related

- [[Use Semantic HTML for Memory Exports]]
- [[How to publish memory safely]]
