# Agent instructions

## Quality gate (required before ship)

**Never claim shipped without `quality:gate` pass locally.**

Before reporting a feature as complete, deployed, or ready for users, run:

```bash
npm run quality:gate
```

This runs TypeScript checks, a GitHub Pages build, and the quality gate script (`scripts/quality-gate.mjs`). CI runs the same gate — nothing deploys to GitHub Pages unless it passes.

For live Ollama smoke tests locally (optional in CI):

```bash
OLLAMA_SMOKE_TESTS=1 npm run quality:gate
```
