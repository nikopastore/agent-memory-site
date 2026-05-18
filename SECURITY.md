# Security Policy

Agent Memory Site works with personal and agent memory notes. Treat all source vaults and generated outputs as potentially sensitive.

## Supported versions

Security fixes target the latest version on `main` until the project begins publishing versioned releases.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that exposes private data or bypasses privacy controls. Email the maintainer or open a private security advisory on GitHub when available.

Include:

- affected version/commit
- reproduction steps
- expected vs actual behavior
- whether generated HTML/JSON/JSONL can leak sensitive data

## Privacy model

`visibility` and `sensitivity` frontmatter help control generated output:

```yaml
visibility: public|private|team
sensitivity: none|personal|credential|financial|medical
```

- `private` mode includes all parsed notes.
- `public` mode excludes private/team notes and sensitive notes.
- `redacted` mode applies best-effort redaction to common emails and token patterns.

## Important limitations

- Redaction is best-effort, not a guarantee.
- Validation warnings are not a substitute for manual review.
- Generated `search-index.json`, `manifest.json`, and `chunks.jsonl` can contain sensitive text if source notes are misclassified.
- Do not store real credentials, private keys, API keys, or recovery codes in memory notes.

## Safe publishing checklist

Before publishing generated output:

1. Run `agent-memory validate --source ./memory`.
2. Build with `--mode public` for public websites.
3. Inspect generated HTML, JSON, and JSONL files.
4. Run a secret scanner such as Gitleaks or TruffleHog against source and output.
5. Publish only after a manual review.
