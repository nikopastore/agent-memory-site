---
title: Launch Project
type: project
status: active
visibility: public
sensitivity: none
tags: [project, launch]
date: 2026-05-22
---

# Launch Project

## Goal

Ship `agent-memory-site` 0.2 with a built-in MCP server so any agent can attach to a compiled vault.

## Current status

- [x] Privacy modes (`private` / `public` / `redacted`)
- [x] Wiki-link resolution that respects the privacy filter
- [x] Auto-generated `llms.txt`, `llms-full.txt`, `AGENTS.md`, `agent-card.json`
- [x] `agent-memory mcp` server
- [x] `agent-memory emit --target ...` fan-out
- [ ] Cookbook for LangChain / LlamaIndex / Mem0
- [ ] Starter packs gallery (job-hunt, paper-trading, research-assistant)

## Related

- [[Use HTML Output]]
- [[Onboard an Agent]]
- [[Internal Codename Atlas]]
  <!-- ^ that wiki-link is intentional. It targets a `visibility: private` note. In `--mode public` builds, it collapses to `[redacted-link]` — the target's title never appears in any output artifact. -->

