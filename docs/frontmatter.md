# Frontmatter

Frontmatter controls note identity, filtering, and retrieval metadata.

## Recommended fields

```yaml
---
title: Launch Plan
type: project
status: active
visibility: private
sensitivity: none
tags: [launch, ai-agent]
date: 2026-05-17
---
```

## Visibility

- `public`: safe to include in public exports if sensitivity is also safe.
- `private`: personal/local-only note.
- `team`: useful for collaborators but excluded from public exports.

## Sensitivity

- `none`: normal note.
- `personal`: personal information.
- `credential`: credentials, tokens, or access material. Avoid storing these.
- `financial`: financial or payment information.
- `medical`: medical or health information.

## Public export rule

`--mode public` includes only notes that are effectively public and non-sensitive.

## Retrieval guidance

Use stable titles and one clear topic per note. Prefer concise headings because heading paths become chunk metadata.
