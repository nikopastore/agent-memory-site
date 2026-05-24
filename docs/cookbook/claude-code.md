# Claude Code (MCP)

One command:

```bash
claude mcp add agent-memory "npx -y agent-memory-site mcp --site ./site"
```

That's it. After a Claude Code restart, the agent gets four tools:

| Tool | What it does |
|---|---|
| `search_memory(query, type?, tag?, limit?)` | Full-text + tag/type filter over `chunks.jsonl`. Ranked. |
| `get_note(id)` | Fetch a note by slug. Returns its chunks concatenated. |
| `list_recent(limit?, type?)` | Most recently updated notes. |
| `list_categories()` | Note counts per category. |

## Where to wire it

If you want it scoped to a single project, run the `claude mcp add` from inside that project — Claude Code stores MCP scoping per directory.

## Live editing loop

```bash
# terminal 1 — edit and rebuild on save
npx agent-memory-site build --source ./memory --out ./site --mode private --force
# (a real `agent-memory watch` is on the 0.3.x roadmap; until then, rebuild after edits)

# terminal 2 — restart the MCP server if you want fresh chunks immediately
# (otherwise the next Claude Code session picks them up)
```

## Verify

In Claude Code, ask: _"Use search_memory to list our active projects and cite each doc_id."_

If the response doesn't cite anything from your vault, the MCP server isn't connected. Run `claude mcp list` to confirm `agent-memory` shows `✓ Connected`.
