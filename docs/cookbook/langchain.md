# LangChain

Use `chunks.jsonl` directly as a retriever — no embeddings required for keyword retrieval, or wire an embedding pass over the `text` field.

## Keyword retriever (instant, no embeddings)

```py
import json
from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever

docs = []
with open('site/chunks.jsonl') as f:
    for line in f:
        if not line.strip(): continue
        c = json.loads(line)
        docs.append(Document(
            page_content=c['text'],
            metadata={
                'chunk_id': c['chunk_id'],
                'doc_id': c['doc_id'],
                'title': c['title'],
                'tags': c.get('tags', []),
                'canonical_url': c['canonical_url'],
                'updated': c.get('updated'),
                'content_hash': c['content_hash'],
            },
        ))

retriever = BM25Retriever.from_documents(docs, k=8)
```

## Semantic retriever (Chroma + OpenAI embeddings)

```py
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# Use content_hash as the persistent vector id — re-runs are free for unchanged chunks.
ids = [c['chunk_id'] for c in chunks]
store = Chroma.from_documents(docs, OpenAIEmbeddings(), ids=ids, persist_directory='.chroma')
```

## Why this is nice

- Every chunk carries `canonical_url`, so citations in the LLM's response link straight to the rendered HTML page.
- `content_hash` is stable across rebuilds — your embedding cache survives unrelated note edits.
- `visibility` + `sensitivity` are present, so you can hard-filter before retrieval (e.g. only `visibility=public` for a public chatbot).
