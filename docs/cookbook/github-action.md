# GitHub Action — build + deploy your vault

Drop this into `.github/workflows/agent-memory.yml` in any repo that has a `./memory/` directory.

```yaml
name: Publish agent memory

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Build memory site
        run: |
          npx -y agent-memory-site validate --source ./memory --strict
          npx -y agent-memory-site build --source ./memory --out ./site --mode public --base-url ${{ format('https://{0}.github.io/{1}', github.repository_owner, github.event.repository.name) }}
          npx -y agent-memory-site publish-check --source ./memory --out ./site
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./site }

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## What this gets you

- Every push to `main` rebuilds your memory site and publishes it to `https://<user>.github.io/<repo>/`.
- `validate --strict` fails the build on any error (missing visibility doesn't count — it's `info`).
- `publish-check` refuses to deploy if a public note wiki-links to a private one, or if any output artifact contains a known secret pattern.

## Memory-only repos

If your vault lives in its own repo (recommended for separation from app code), point the workflow at `.` instead of `./memory`:

```yaml
        run: |
          npx -y agent-memory-site build --source . --out ./site --mode public
```

A starter template repo is on the roadmap: `nikopastore/agent-memory-template`.
