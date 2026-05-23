# Changelog

All notable changes to **agent-memory-site** are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [0.2.0] - 2026-05-23

### Added — strategic

- **`agent-memory mcp` — built-in Model Context Protocol server** over any built site. Any MCP client (Claude Desktop, Claude Code, Codex CLI, Cursor) can attach with `claude mcp add agent-memory "agent-memory mcp --site ./site"` and get `search_memory`, `get_note`, `list_recent`, `list_categories` tools.
- **`agent-memory emit`** — fan out the vault into agent-context files: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `.windsurfrules`, `.aider.conf.yml`, `llms.txt`, `llms-full.txt`. Solves the "I'm writing the same context three times" tax.
- **Auto-generated agent surface at build time**: every `agent-memory build` now writes `llms.txt`, `llms-full.txt`, `AGENTS.md`, `/.well-known/agent-card.json`, plus a strict Content-Security-Policy on every page.
- **`agent-memory publish-check`** — pre-publish gate that refuses if a public note wiki-links to a private note, or if a known secret pattern survived into output artifacts.
- **`agent-memory stats`** — counts, tag coverage, broken-link count.
- **`agent-memory new` `--visibility` and `--sensitivity` flags.**
- **Real client-side search** — fuzzy match over `search-index.json` with highlighted snippets, embedded directly into the dashboard.
- **Copy-as-markdown / copy-as-prompt buttons** on every note section.
- **Schema upgrades to `Chunk`**: `content_hash`, `created_at`, chunk-level `visibility` / `sensitivity`, `supersedes`, `superseded_by`, optional `keywords`.

### Security fixes

- **CRITICAL — Wiki-link rewriting no longer leaks titles of private notes.** Wiki-link resolution happens *after* the privacy filter; unresolved links collapse to `[redacted-link]` rather than emitting the target's title.
- **CRITICAL — `assertSafeOutputDir` hardened.** Now detects `USERPROFILE` / `HOMEDRIVE+HOMEPATH` on Windows in addition to `HOME`. Refuses any output directory that *contains* a sensitive directory, equals one, or looks like an installed package `dist/`. Requires a `.agent-memory-output` marker file before deleting non-empty directories (override with `--force`).
- **HIGH — Markdown URL allowlist + strict CSP.** Custom marked renderer restricts link URLs to `https?:`, `mailto:`, `tel:`, `#`, and relative paths. `javascript:` and arbitrary `data:` URLs become `#blocked`. Every generated page sets `default-src 'none'; script-src 'self'`.
- **HIGH — YAML injection in `agent-memory new` fixed.** Frontmatter is now produced by `js-yaml.dump`, not string concatenation. Quotes / newlines / control characters in titles can no longer flip `visibility` or inject arbitrary keys.
- **HIGH — `note.title` and `meta.tags` are now redacted in `--mode redacted`.** Previously a note titled `"API key sk-proj-..."` leaked the secret in every artifact.
- **MEDIUM — `chunks.jsonl` HTML field uses the full 5-character escape.**
- **MEDIUM — `search-index.json` text/title/tags are redacted regardless of build mode** (defense in depth).
- **MEDIUM — `manifest.json` no longer ships source file paths in `public` / `redacted` modes** — filenames are often codenames.
- **MEDIUM — Expanded redaction patterns** (JWT-ish, bearer tokens). New `--strict-redact` flag for phones / IPv4 / credit-card-shaped digits. Per-note `redact: [...]` frontmatter deny-list.
- **LOW — `marked` upgraded from v12 to v15** (ReDoS + parser fixes).
- Added `.github/dependabot.yml` for `npm` + `github-actions`.

### Bug fixes (correctness)

- **CRITICAL — CLI is no longer a silent no-op on Windows.** Main-module detection uses `pathToFileURL` instead of string comparison.
- **CRITICAL — `npm run serve` and `npm run dev` scripts fixed.** No longer pass `--source` to the `serve` subcommand.
- **CRITICAL — GitHub Pages workflow now uses `--mode public` (via new `build:demo` script).** Previously published `--mode private` builds, which would leak any private note slipped into `examples/sample-vault`.
- Chunking expanded from `##|###` only → `#`–`######` with hierarchical heading paths and a `MAX_CHARS` force-split.
- Chunk text no longer contains the heading twice; code fences and inline code are stripped.
- Chunk IDs are stable across reorders (`<note-id>#<heading-slug>` instead of `<note-id>#<index>-<slug>`).
- Wiki-link extraction now strips `#heading` and `^block` suffixes — backlinks no longer silently miss.
- Slug collisions now disambiguate via short content hash instead of silently overwriting.
- `agent-memory new person` now writes to `people/` (not `persons/`), matching `init` and the README.
- `agent-memory serve` handles `EISDIR` (auto-tries `index.html`) and serves the generated `404.html`.
- `agent-memory serve` checks that the output directory exists and prints "did you run `agent-memory build` first?" if not.
- `parseVault` reads files concurrently with `Promise.all`.
- Generated `chunks.jsonl` / `manifest.json` use forward-slash paths regardless of platform.
- Frontmatter parse errors now include the file path.

### UX & polish

- CLI version is read from `package.json` at runtime.
- `agent-memory init` now copies a real starter vault (5 example notes); `--bare` for the old empty behavior.
- Every command prints a dim "Next steps" hint block.
- `agent-memory serve` auto-opens the browser (skip with `--no-open` or `CI=1`).
- `agent-memory validate` splits results into `error` / `warn` / `info`; exit code only nonzero on errors (use `--strict` for the old behavior). `--json` for machine output.
- New "Public links to private" check.
- Dashboard now has favicon, light + dark themes, OG / Twitter cards, `<meta name="description">`, canonical URLs, ARIA labels, real search input, "Machine-readable" `<details>` block.
- Generated `404.html` written to the output root.
- New CI matrix: ubuntu-latest, windows-latest, macos-latest × Node 20 / 22, plus a smoke job that builds a fresh vault end-to-end.
- New `.github/dependabot.yml`.
- Prettier config (`.prettierrc.json`) added; `npm run format` and `npm run format:check`.

### Docs

- README rewritten around the agent-memory + MCP angle.
- SECURITY.md threat model expanded; maintainer contact email added.
- New comparison table vs. Quartz / Obsidian Publish / Mintlify / MCPVault.
- `agent-memory.config.json` now actually used by the build.

## [0.1.0] - 2026-05-17

Initial scaffold.
