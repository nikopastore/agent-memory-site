# Letta / MemGPT

Load a built vault into a Letta agent as archival memory.

```py
import json
from letta_client import Letta

client = Letta(token='YOUR_LETTA_TOKEN')
agent = client.agents.create(name='memory-agent')

with open('site/chunks.jsonl') as f:
    for line in f:
        if not line.strip(): continue
        c = json.loads(line)
        client.agents.passages.create(
            agent_id=agent.id,
            text=c['text'],
            # Letta accepts arbitrary metadata; keep provenance.
            metadata_={
                'chunk_id': c['chunk_id'],
                'doc_id': c['doc_id'],
                'title': c['title'],
                'canonical_url': c['canonical_url'],
                'content_hash': c['content_hash'],
            },
        )
```

## When to use this vs. MCP

- **MCP server (`agent-memory mcp`)**: live, on-demand retrieval. The agent's prompt stays small; tool calls do the lookup.
- **Letta archival memory**: the chunks live *inside* Letta's memory system. Letta's own recall heuristics decide when to surface them.

Both can coexist — Letta for episodic + procedural memory, MCP for the canonical knowledge base.

See `.af` (AgentFile) export support — on the 0.4.x roadmap.
