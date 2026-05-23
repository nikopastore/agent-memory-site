---
title: Memory Summary
visibility: public
sensitivity: none
tags: [summary, starter]
---

# Memory Summary

> This is the top-level overview of your memory vault. Every agent that connects (Claude, Codex, Cursor, MCP clients) reads this first.

## What lives here

- **projects/** — active work with goals and next actions
- **decisions/** — choices you've made and the reasoning
- **facts/** — durable facts an agent should never re-derive
- **people/** — collaborators, contacts, and context about them
- **daily/** — daily logs and standups
- **handoffs/** — session-to-session continuity notes
- **procedures/** — repeatable workflows (build, deploy, on-call, etc.)

## How agents should use it

- Search before guessing. Use the MCP `search_memory` tool with the relevant doc type.
- Cite the `doc_id` of every memory you rely on.
- When something durable is learned, propose a new note under the most specific category.

See [[Onboard an Agent]] and [[Use Semantic HTML for Memory Exports]].
