# LlamaIndex

```py
import json
from llama_index.core import Document, VectorStoreIndex

docs = []
with open('site/chunks.jsonl') as f:
    for line in f:
        if not line.strip(): continue
        c = json.loads(line)
        docs.append(Document(
            text=c['text'],
            doc_id=c['chunk_id'],
            metadata={
                'title': c['title'],
                'doc_id': c['doc_id'],
                'tags': c.get('tags', []),
                'canonical_url': c['canonical_url'],
                'visibility': c.get('visibility', 'private'),
                'content_hash': c['content_hash'],
            },
            excluded_embed_metadata_keys=['canonical_url', 'content_hash'],  # don't embed plumbing
        ))

index = VectorStoreIndex.from_documents(docs)
query_engine = index.as_query_engine(similarity_top_k=8)
```

Filter retrieval to a single category or visibility class with `MetadataFilter`:

```py
from llama_index.core.vector_stores.types import MetadataFilter, MetadataFilters

filters = MetadataFilters(filters=[MetadataFilter(key='visibility', value='public')])
qe = index.as_query_engine(filters=filters)
```
