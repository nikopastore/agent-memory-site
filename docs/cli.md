# CLI Reference

Agent Memory Site exposes the `agent-memory` command after the TypeScript project is built or the package is installed globally.

## Commands

### `agent-memory init [dir]`

Create a starter vault with recommended folders and a `MEMORY.md` summary.

```bash
agent-memory init ./memory
```

### `agent-memory new <type> <title>`

Create a note with safe default frontmatter.

```bash
agent-memory new project "Launch Plan" --source ./memory
agent-memory new decision "Use semantic HTML exports" --source ./memory
```

### `agent-memory validate`

Parse the vault and print warnings for missing metadata, likely credentials, oversized notes, and broken wiki links.

```bash
agent-memory validate --source ./memory
```

### `agent-memory build`

Build static HTML and retrieval artifacts.

```bash
agent-memory build --source ./memory --out ./site --mode private
```

Modes:

- `private`: include all parsed notes.
- `public`: exclude private/team notes and sensitive notes.
- `redacted`: include notes and apply best-effort redaction.

### `agent-memory serve`

Serve a generated site locally.

```bash
agent-memory serve --out ./site --port 4321
```
