# JSON Schemas

Downstream consumers can pin to these schemas and validate the artifacts they receive from `agent-memory build`.

| File | Schema |
|---|---|
| `chunks.jsonl` (one JSON object per line) | [`chunk.schema.json`](chunk.schema.json) |
| `manifest.json` | [`manifest.schema.json`](manifest.schema.json) |

The schemas are also published with the live demo site:

- <https://nikopastore.github.io/agent-memory-site/schemas/chunk.schema.json>
- <https://nikopastore.github.io/agent-memory-site/schemas/manifest.schema.json>

## Validating

Node + `ajv`:

```js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chunkSchema from 'agent-memory-site/docs/schemas/chunk.schema.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(chunkSchema);

for (const line of fs.readFileSync('site/chunks.jsonl', 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const chunk = JSON.parse(line);
  if (!validate(chunk)) console.error(chunk.chunk_id, validate.errors);
}
```

Python + `jsonschema`:

```py
import json
from jsonschema import Draft202012Validator

schema = json.load(open('docs/schemas/chunk.schema.json'))
v = Draft202012Validator(schema)

for line in open('site/chunks.jsonl'):
    if not line.strip(): continue
    chunk = json.loads(line)
    for err in v.iter_errors(chunk):
        print(chunk['chunk_id'], err.message)
```
