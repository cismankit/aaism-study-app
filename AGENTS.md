# Agent instructions

Operator reference for AI agents and maintainers working in this repo.

## Quality gate (required before ship)

**Never claim shipped without `quality:gate` pass locally.**

Before reporting a feature as complete, deployed, or ready for users, run:

```bash
npm run quality:gate
```

The gate runs, in order (`scripts/quality-gate.mjs`):

1. **TypeScript** — `npx tsc`
2. **GitHub Pages build** — `npm run build:pages` (`GITHUB_PAGES=true`, base path `/aaism-study-app/`)
3. **AI smoke tests** — `node scripts/run-smoke-tests.mjs` (requires local Ollama with `gemma4:latest`)

CI runs the same gate in `.github/workflows/deploy-pages.yml` — nothing deploys to GitHub Pages unless it passes. Smoke tests are **skipped in CI** unless `OLLAMA_SMOKE_TESTS=1` is set.

For live Ollama smoke tests locally (or in CI):

```bash
OLLAMA_SMOKE_TESTS=1 npm run quality:gate
```

## Mission landing (home route)

The app home route **`/`** renders `StudyMission` → `MissionLanding` — the daily Learn loop (Mission → Practice/Ops → Exam), not a generic dashboard.

- `/mission` redirects to `/`.
- Active mission flow: `MissionLanding` → `MissionDashboard` via `orchestrateStudyMission()` in `missionOrchestrator.ts`.
- Command Center lives at `/command`; sidebar labels the home tab **Mission**.

Do not replace `/` with Command Center or another page without an explicit product decision.

## Git remotes & GitHub Pages

Two remotes are configured:

| Remote | Repo | Role |
|--------|------|------|
| `origin` | `abhishekyadav2000/aaism-study-app` | Primary dev remote |
| `pages-origin` | `cismankit/aaism-study-app` | GitHub Pages deploy target |

Live site: **https://cismankit.github.io/aaism-study-app/** (base path `/aaism-study-app/`).

Push Pages deploys to `pages-origin` on `main` when CI passes. Tauri/desktop builds use base `/`; only `build:pages` sets `GITHUB_PAGES=true`.

## Dev icon badge & git hash

Dev desktop builds stamp icons with the current **git short hash** so Dock/Launchpad builds are identifiable.

| Item | Detail |
|------|--------|
| Window title | `Aegis · dev+<hash>` (from `scripts/lib/version-info.mjs`) |
| Icon badge | Hash suffix only — amber dot at ≤32px, last 3–7 chars at larger sizes |
| Script | `npm run stamp:icons` → `src-tauri/icons-dev/` |
| Release icons | Clean shield in `src-tauri/icons/` (no stamp) |

Dev build pipeline: `npm run tauri:build:dev` (runs `stamp:icons` + `tauri.dev.conf.json`). Release: `npm run tauri:build:release`.

## Ollama in Tauri (native HTTP)

Ollama calls go through `ollamaFetch()` in `src/services/ollamaAppService.ts`:

- **Browser / Vite dev** — standard `fetch()` to `http://localhost:11434` (CSP allows localhost in `index.html`).
- **Tauri desktop** — `@tauri-apps/plugin-http` (reqwest) bypasses WebView CORS. Ollama returns **403** for `Origin: http://tauri.localhost`; native HTTP avoids that.

Tauri HTTP scope (`src-tauri/capabilities/default.json`): `http://localhost:*` and `http://127.0.0.1:*` only. URL validation still enforced via `isAllowedOllamaUrl()` in `securityPolicy.ts`.

`canUseOllamaApi()` returns true in Tauri or when the page is served from localhost / `tauri.localhost`.

## Key scripts

| Script | Purpose |
|--------|---------|
| `npm run quality:gate` | Required pre-ship gate |
| `npm run build:pages` | GitHub Pages artifact (`dist/`) |
| `npm run generate:icons` | Rasterize `public/logo.svg` → Tauri + PWA icons |
| `npm run stamp:icons` | Dev-stamped icons with git hash |
| `npm run tauri:dev` | Desktop dev window |
| `npm run tauri:build:dev` | Dev `.app` with stamped icon → `dist-mac/` |
| `npm run tauri:build:release` | Release `.app` with clean icon → `dist-mac/` |

See [TAURI.md](TAURI.md) for desktop install policy and [SECURITY.md](SECURITY.md) for URL validation and CSP details.
