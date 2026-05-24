# Codex CLI (MCP)

```bash
codex mcp add agent-memory --command "npx" --args "-y agent-memory-site mcp --site ./site"
```

Codex inlines whatever your vault has under `MEMORY.md` plus `AGENTS.md` automatically (run `agent-memory emit --target agents.md` once to keep it fresh), AND can call `search_memory` mid-conversation for deeper retrieval.

## Memory file fan-out

If you'd rather skip the MCP server and just give Codex an opinionated context dump on launch:

```bash
npx agent-memory-site emit --target agents.md --source ./memory --out .
```

That writes `AGENTS.md` at the project root. Codex picks it up automatically on next launch.
