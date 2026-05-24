# Cursor (MCP)

Add to `.cursor/mcp.json` at the root of your project (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "npx",
      "args": ["-y", "agent-memory-site", "mcp", "--site", "./site"]
    }
  }
}
```

Restart Cursor. The four tools (`search_memory`, `get_note`, `list_recent`, `list_categories`) become available to Cursor's chat agent.

## Combine with Cursor rules

Run once:

```bash
npx agent-memory-site emit --target cursorrules --source ./memory --out .
```

This writes a `.cursorrules` file with your vault's instruction notes (anything with `type: instruction | procedure | standard | rule`). Cursor will inline that on every conversation.

So the agent gets your context *twice*:
- **Instructions** inline via `.cursorrules` (no tool call needed).
- **Search** on demand via the MCP server.

The MCP server reads the same `chunks.jsonl` everything else reads. One vault, one build, both surfaces.
