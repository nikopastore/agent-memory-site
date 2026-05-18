# Contributing

Thanks for helping improve Agent Memory Site.

## Local setup

```bash
git clone https://github.com/nikopastore/agent-memory-site.git
cd agent-memory-site
npm install
npm run ci
```

## Development commands

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
npm run serve
```

## Project structure

```text
src/cli/        CLI commands
src/ingest/     Markdown/frontmatter parsing
src/build/      HTML, index, manifest, and chunk generation
src/validate.ts Privacy and quality warnings
docs/           User-facing documentation
templates/      Starter note templates
examples/       Sample vault and generated sample site
tests/          Vitest tests
```

## Pull request expectations

- Keep PRs focused and easy to review.
- Add or update tests for behavior changes.
- Update docs/README when changing CLI behavior or generated artifacts.
- Run `npm run ci` before opening a PR.
- Do not commit real personal memory, credentials, private vaults, or generated output from a sensitive vault.

## Good first contribution ideas

- Improve example vault notes.
- Add screenshots/GIF docs.
- Expand privacy checks and tests.
- Add schema validation for frontmatter.
- Improve generated HTML accessibility.
