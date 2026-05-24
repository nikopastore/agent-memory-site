---
title: Redaction patterns
type: fact
status: active
visibility: public
sensitivity: none
tags: [fact, privacy, redaction]
date: 2026-01-30
---

# Redaction patterns

What `--mode redacted` catches today:

| Class | Pattern | Replacement |
|---|---|---|
| Email | RFC-ish + unicode | `[redacted-email]` |
| OpenAI keys | `sk-…` | `[redacted-secret]` |
| GitHub tokens | `gh[pousr]_…`, `github_pat_…` | `[redacted-secret]` |
| AWS access keys | `AKIA…` | `[redacted-secret]` |
| Slack tokens | `xox[baprs]-…` | `[redacted-secret]` |
| JWTs | header.payload.sig | `[redacted-secret]` |
| Generic key/value | `api_key = …`, `bearer …` | `[redacted-secret]` |
| Private keys | `-----BEGIN … PRIVATE KEY-----` | `[redacted-secret]` |

## With `--strict-redact`

| Phone | US-shaped 10+ digit | `[redacted-phone]` |
| Credit-card-ish | 13–19 digits | `[redacted-cc]` |
| IPv4 | `\d.\d.\d.\d` | `[redacted-ip]` |

## Per-note deny-list

Add literal strings to a note's frontmatter:

```yaml
redact: ['Operation Salted Caramel', 'staging.internal']
```

Anything matching is replaced with `[redacted-denylist]` in every output artifact for that note.

## What we DON'T catch automatically

- Free-text names, addresses, DOBs
- Customer codenames (use deny-list)
- Proprietary numeric IDs (use deny-list)

Trust the gate, verify the output. See [[Separate Private and Public Memory]].
