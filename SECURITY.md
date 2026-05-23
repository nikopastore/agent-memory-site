# Security Policy

Agent Memory Site works with personal and agent memory notes. Treat all source vaults and generated outputs as potentially sensitive.

## Supported versions

Security fixes target the latest released version on npm and the latest commit on `main`.

## Reporting a vulnerability

**Please do not file a public issue for vulnerabilities that bypass privacy controls or expose private data.**

Preferred channels:

1. Open a private security advisory at <https://github.com/nikopastore/agent-memory-site/security/advisories/new>.
2. Email the maintainer at **nikopastore@gmail.com** with the subject line `agent-memory-site security`.

Include:

- affected version/commit
- reproduction steps
- expected vs actual behavior
- whether generated HTML / JSON / JSONL can leak sensitive data

You can expect an initial response within 5 business days. Critical issues will be fixed and disclosed on a coordinated schedule.

## Threat model

Agent Memory Site is a local-first compiler:

- **Input:** a directory of Markdown notes the user controls.
- **Output:** static HTML + JSON / JSONL written to a local directory.
- **Network surface:** none, except the optional local `serve` command bound to `127.0.0.1`.

In scope:

- HTML / JSON injection through note content (including AI-agent-authored notes).
- Path traversal in the source vault, output directory, or local `serve` command.
- Privacy bypass: any path by which a note marked `visibility: private|team` (or its title, source path, backlinks, or referenced wiki links) can appear in a `--mode public` or `--mode redacted` build artifact.
- npm supply-chain risks: build / install / publish flow.

Out of scope:

- Defending against an attacker who already has write access to the source vault. The user is the trust root for vault contents.
- "Best-effort" redaction is intended as defense-in-depth, NOT a guarantee. See _Important limitations_ below.

## Privacy model

`visibility` and `sensitivity` frontmatter control generated output:

```yaml
visibility: public | private | team
sensitivity: none | personal | credential | financial | medical
```

- `private` mode includes all parsed notes.
- `public` mode excludes private/team notes and sensitive notes.
- `redacted` mode applies best-effort redaction to emails, common API-key shapes, JWT-shaped tokens, and (with `--strict-redact`) phone numbers / credit cards / IPv4s.

The build also enforces:

- Wiki-link resolution happens **after** privacy filtering. Wiki-links to notes excluded from the build collapse to `[redacted-link]` — they do not leak the target's title into the output.
- The search index ships only redacted text and titles regardless of mode (defense in depth).
- The manifest does not ship source file paths in `public` or `redacted` modes.
- Every generated page sets a strict `Content-Security-Policy` meta tag (`default-src 'none'`, no inline JS, allowlisted same-origin scripts only).
- Markdown link URLs are restricted to `https?:`, `mailto:`, `tel:`, `#`, and relative paths. `javascript:` and `data:` (non-image) URLs are rewritten to `#blocked` with `data-blocked` attribution.

## Important limitations

- Redaction is best-effort, not a guarantee. New token formats appear regularly; built-in patterns will lag.
- Validation warnings are not a substitute for manual review.
- Generated `search-index.json`, `manifest.json`, and `chunks.jsonl` can still contain sensitive text if source notes are misclassified.
- Do not store real credentials, private keys, API keys, or recovery codes in memory notes.

## Safe publishing checklist

Before publishing generated output:

1. Run `agent-memory validate --source ./memory`.
2. Run `agent-memory publish-check --source ./memory --out ./site` (fails if a public note links to a private one, or if a known secret pattern slipped into the output).
3. Build with `--mode public` for public websites; consider `--strict-redact` if your notes ever contain phone numbers or IPs.
4. Inspect generated HTML, JSON, and JSONL files.
5. Run an external secret scanner against source and output (Gitleaks or TruffleHog).
6. Publish only after a manual review.
