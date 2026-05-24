# Mem0

Push compiled chunks into Mem0 as long-term agent memory.

```py
import json
from mem0 import Memory

m = Memory()  # uses MEM0_API_KEY env var

with open('site/chunks.jsonl') as f:
    for line in f:
        if not line.strip(): continue
        c = json.loads(line)
        m.add(
            messages=c['text'],
            user_id='nikopastore',
            agent_id='agent-memory-site',
            metadata={
                'chunk_id': c['chunk_id'],
                'doc_id': c['doc_id'],
                'title': c['title'],
                'tags': c.get('tags', []),
                'canonical_url': c['canonical_url'],
                'visibility': c.get('visibility', 'private'),
                'content_hash': c['content_hash'],
            },
        )
```

## Incremental re-sync

After the next `agent-memory build`, compare each chunk's `content_hash` against the one you stored. Mem0 has `m.update(memory_id, ...)` for changed chunks. Cache the mapping `chunk_id → memory_id` once.

## Filter at query time

```py
results = m.search(
    query='customer support agent eval results',
    user_id='nikopastore',
    filters={'visibility': 'public'},
)
```
