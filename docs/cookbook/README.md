# Cookbook

Wiring recipes for the common agent + RAG stacks. Each recipe is short (≤ 50 lines), uses one build (`agent-memory build --source ./memory --out ./site`), and ships verbatim into a fresh project.

| Recipe | When to use it |
|---|---|
| [Claude Code (MCP)](claude-code.md) | You use Claude Code daily and want it to share memory with the rest of your tools. |
| [Cursor (MCP)](cursor.md) | Same, but for Cursor. |
| [Codex CLI (MCP)](codex.md) | Same, but for OpenAI Codex CLI. |
| [LangChain](langchain.md) | You're building a custom agent / chain and want chunks-as-retriever. |
| [LlamaIndex](llamaindex.md) | Same, LlamaIndex flavor. |
| [Mem0](mem0.md) | Push compiled chunks into Mem0 as long-term memory. |
| [Letta / MemGPT](letta.md) | Import vault into a Letta agent as an archival memory block. |
| [OpenAI Memory tool](openai-memory.md) | Seed an OpenAI Assistant's memory with vault chunks. |
| [GitHub Action](github-action.md) | Build and deploy your vault on every push, with provenance. |

All recipes assume your vault is at `./memory/` and you have run:

```bash
npx agent-memory-site build --source ./memory --out ./site --mode public
```
