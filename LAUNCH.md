# Launch notes (private — not shipped to npm)

> Drafts for the public launch of `agent-memory-site`. Not committed to npm tarball (see `package.json` `files`).

## Show HN — title options

Pick one. Each is ≤ 80 chars (HN headline limit varies but stay safe).

1. **Show HN: agent-memory-site – compile your Markdown vault into MCP-served memory**
2. **Show HN: One vault → every agent. Markdown in, MCP/JSONL/llms.txt out**
3. **Show HN: agent-memory-site – the Pandoc of agent memory**

→ Recommend **#1** — most descriptive, mentions MCP which is the unique angle.

## Show HN — body

```
agent-memory-site is a local-first TypeScript CLI that compiles a Markdown
vault (Obsidian-style or hand-rolled) into:

  • a browsable HTML dashboard with real client-side search
  • RAG-ready chunks.jsonl with stable content hashes and provenance
  • a built-in MCP stdio server so Claude / Codex / Cursor / any MCP
    client can attach in one line:

        claude mcp add agent-memory "npx -y agent-memory-site mcp --site ./site"

  • AGENTS.md, CLAUDE.md, .cursorrules, copilot-instructions.md,
    llms.txt, llms-full.txt, /.well-known/agent-card.json
    — all generated from the same parse pass

The angle: AI agents are accumulating durable memory, but it's trapped
in messy Markdown / Obsidian vaults that are hard to inspect, audit,
share, or feed back into retrieval. Most existing tools handle the
*write side* (Obsidian, Logseq) or the *runtime side* (Letta, Mem0,
MCPVault), but the *compile step* between them — the bit that lets you
ship one bundle to every agent — was missing.

Privacy is first-class: per-note visibility/sensitivity frontmatter,
three build modes (private/public/redacted), wiki-link resolution that
happens AFTER privacy filtering so private note titles can't leak via
[[link]] references in public notes, strict CSP + URL-scheme allowlist
on every page, marker-file gate before any rm -rf.

Live demo (built from a fictional AI-ops vault):
https://nikopastore.github.io/agent-memory-site/

npm: https://www.npmjs.com/package/agent-memory-site
Repo: https://github.com/nikopastore/agent-memory-site

MIT. Built in TypeScript on Node 20+. CI matrix is ubuntu/windows/macos
× Node 20/22 plus a smoke job that plants a private note and asserts
the public build doesn't leak it. ~250 LOC of core plus tests.

Happy to talk about: chunking strategy, the wiki-link sentinel trick
for privacy-aware rewriting, how the MCP server stays under 200ms on
search, why the schema is intentionally minimal.
```

## Twitter / X thread

**Tweet 1 (the hook):**
```
Built a thing so every AI agent I use shares the same memory.

  npx agent-memory-site init ./memory
  npx agent-memory-site build
  claude mcp add agent-memory "npx -y agent-memory-site mcp --site ./site"

Now Claude knows my notes. Same bundle works for Codex, Cursor, any MCP client. 🧵
```

**Tweet 2 (the problem):**
```
AI agents are starting to accumulate real durable memory.

But most of it is trapped in messy Markdown vaults that are:
- hard to inspect
- hard to audit
- hard to share safely
- hard to feed back into retrieval

You end up writing AGENTS.md AND CLAUDE.md AND .cursorrules. Three formats, one brain.
```

**Tweet 3 (the fix):**
```
agent-memory-site is the compile step between your vault and your agents.

Markdown stays the source of truth. One build, every surface:
- HTML dashboard with real search
- chunks.jsonl for RAG
- MCP server for live retrieval
- AGENTS.md/CLAUDE.md/.cursorrules/llms.txt fan-out
```

**Tweet 4 (the demo + screenshot):**
```
Live demo built from a fictional AI-ops vault (support-agent + data-pipeline + handoffs + decisions + procedures):

https://nikopastore.github.io/agent-memory-site/

[Attach: assets/screenshot-dashboard.png]
```

**Tweet 5 (the privacy angle):**
```
Privacy is the differentiator vs Quartz / Obsidian Publish.

Per-note `visibility: public | private | team` + three build modes (private/public/redacted).

Wiki-links to private notes collapse to [redacted-link] — the target's title NEVER leaks. CI plants a private note + asserts it stays hidden.
```

**Tweet 6 (the CTA):**
```
Local-first. MIT. No telemetry. Node 20+.

Try it:  npm install -g agent-memory-site
Code:    https://github.com/nikopastore/agent-memory-site
Docs:    https://nikopastore.github.io/agent-memory-site/

If you build with AI agents and want them to actually remember things between sessions, this might be useful.
```

## LinkedIn post (longer-form)

```
I built agent-memory-site because AI agents are starting to accumulate
real operational memory — but most of that memory is hard to inspect,
search, share, or audit.

The tool turns a Markdown/Obsidian-style agent memory vault into a
private dashboard, public knowledge base, retrieval-ready JSONL chunks,
and a built-in MCP server. One build, every agent.

Why this matters:

→ AI infrastructure thinking — memory systems are becoming the next
  bottleneck. Static-compile bundles let teams ship reproducible
  context to every agent at once.

→ Data engineering instincts — this is essentially an ETL pipeline
  for unstructured human writing. Ingest Markdown, normalize
  frontmatter, extract backlinks, validate privacy, emit semantic HTML
  + JSONL.

→ Security awareness — went through a full audit and hardened against
  stored XSS, path traversal, unsafe filesystem deletion, and the
  hardest one: wiki-link references to private notes leaking the
  target's title in public builds.

→ Open-source product mindset — npm package, GitHub Pages demo,
  JSON-Schema'd outputs, CI across ubuntu/windows/macos × Node 20/22,
  and a privacy-gate smoke test that plants a private note and asserts
  the public build doesn't leak it.

It's a small project, but it touches the things I care about: AI
infrastructure, data pipelines, privacy, developer tooling, and making
agent systems more observable.

https://github.com/nikopastore/agent-memory-site
```

## Cross-posts

- [ ] r/ClaudeAI — angle: MCP server in one command
- [ ] r/LocalLLaMA — angle: local-first RAG substrate
- [ ] r/ObsidianMD — angle: agent-era Obsidian Publish alternative
- [ ] r/ChatGPTPro — angle: Codex/Cursor context fan-out
- [ ] [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) PR
- [ ] Anthropic Discord, #showcase
- [ ] [Agentic AI Foundation](https://agentic.foundation/) tools list
- [ ] HN front-page submission Tue/Wed morning ET (highest baseline traffic)

## Project resume bullets (for Niko's CV)

- **Built `agent-memory-site`**, an open-source TypeScript CLI ([npm](https://www.npmjs.com/package/agent-memory-site)) that compiles Markdown/Obsidian AI-agent memory vaults into semantic HTML, retrieval-ready JSONL chunks, a built-in MCP stdio server, and the full agent-context file fan-out (AGENTS.md, CLAUDE.md, .cursorrules, llms.txt, agent-card.json).
- **Designed a local-first content pipeline** that ingests Markdown vaults, parses YAML frontmatter, normalizes backlinks, validates privacy risk, and emits semantic HTML + JSONL retrieval artifacts with stable content hashes for downstream embedding caches.
- **Hardened the package against** stored XSS (custom marked URL-scheme allowlist + strict CSP), path traversal, unsafe filesystem deletion (HOME/USERPROFILE-aware marker-gated rm), and the hardest one — wiki-link references to private notes leaking the target's title in public builds. Added regression tests including a CI smoke job that plants a private note and asserts no leak.
- **Published to npm with provenance** (GitHub Actions OIDC), automated CI matrix across ubuntu/windows/macos × Node 20/22, automated GitHub Pages deploy of the demo site, and a published JSON Schema for the chunk and manifest formats.

## Interview answer to "Why did you build this?"

```
I was experimenting with persistent AI-agent workflows and noticed that
agent memory becomes a data-management problem fast. Markdown is the
best format for humans and AI to co-write — easy to diff, easy to
review — but it's hard to audit, hard to share safely, hard to feed
into retrieval.

So I built it like a small data pipeline: parse Markdown with
YAML frontmatter, extract metadata and backlinks, validate privacy
risk, generate semantic HTML for human reading, produce search
indexes for keyword retrieval, and emit JSONL chunks for RAG pipelines
with stable content hashes so the downstream embedding cache survives
unrelated edits.

The hardest part was the privacy gate. Wiki-link rewriting was
happening BEFORE the privacy filter, which meant a public note could
contain [[Private Project Name]] and the title would leak through to
chunks.jsonl even though the target file was filtered out. I refactored
it to tokenize wiki-links to opaque sentinels at parse time, then
resolve them at emit time using only the visible-allowed set. CI now
plants a private note and asserts the public build doesn't leak it.

The MCP server was the unlock — it turned 'I have a vault' into 'my
agent can query it' from three days of glue code to one shell command.
```
