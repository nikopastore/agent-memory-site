---
title: Onboard an Agent
type: project
status: active
visibility: public
sensitivity: none
tags: [project, onboarding]
date: 2026-05-22
---

# Onboard an Agent

## Goal

Give a fresh agent enough context to be useful in 90 seconds — Claude or otherwise — without leaking anything private.

## Recipe

1. `agent-memory build --source memory --out site --mode private`
2. `claude mcp add agent-memory "agent-memory mcp --site ./site"`
3. Ask: _"Summarize my active projects in three bullets, citing doc_id for each."_

The agent should return citations like `projects/launch-project` and `projects/onboard-an-agent`. If it cites nothing, the bundle isn't reaching it.
