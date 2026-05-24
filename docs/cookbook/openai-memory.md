# OpenAI Assistants / Memory tool

Seed an Assistant's vector store from `chunks.jsonl`.

```py
import json
from openai import OpenAI
client = OpenAI()

# Convert chunks to plain .md files in a temp dir for upload.
import os, tempfile
tmp = tempfile.mkdtemp()
with open('site/chunks.jsonl') as f:
    for line in f:
        if not line.strip(): continue
        c = json.loads(line)
        path = os.path.join(tmp, f"{c['chunk_id'].replace('/', '__').replace('#', '__')}.md")
        body = (
            f"# {c['title']}\n\n"
            f"> {' › '.join(c['heading_path'])}\n\n"
            f"<!-- doc_id: {c['doc_id']} canonical: {c['canonical_url']} hash: {c['content_hash']} -->\n\n"
            f"{c['text']}\n"
        )
        open(path, 'w').write(body)

store = client.vector_stores.create(name='agent-memory')
file_paths = [os.path.join(tmp, f) for f in os.listdir(tmp)]
client.vector_stores.file_batches.upload_and_poll(
    vector_store_id=store.id,
    files=[open(p, 'rb') for p in file_paths],
)
print(store.id)
```

Attach the store to an Assistant or call `client.responses.create(..., tools=[{ 'type': 'file_search', 'vector_store_ids': [store.id] }])`.

## Codex Memories format

If you'd rather emit OpenAI Codex's `~/.codex/memories/` JSON:

```py
notes = [
    {
        'text': c['text'],
        'last_update_date': c.get('updated', ''),
        'keywords': c.get('tags', []) + c.get('keywords', []),
    }
    for c in (json.loads(line) for line in open('site/chunks.jsonl') if line.strip())
]
open(os.path.expanduser('~/.codex/memories/agent-memory-site.json'), 'w').write(
    json.dumps({'notes': notes}, indent=2)
)
```
