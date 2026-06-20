# Aegis — Mac Desktop App (Tauri)

Run **Aegis** as a native macOS `.app` (single product identity for App Store). Built with [Tauri v2](https://v2.tauri.app/) wrapping the Vite + React frontend.

## Canonical identity

| Field | Value |
|-------|--------|
| **Product name** | `Aegis` |
| **Bundle ID** | `com.aegis.app` |
| **Version** | Synced from root `package.json` via `npm run sync:tauri` |
| **Build / CFBundleVersion** | Git short hash (dev) or `YYYYMMDD01` (release) |

Delete legacy **`AAISM Intelligence.app`** from `/Applications` — it used bundle ID `com.aaism.intelligence` and is not the canonical app. See [docs/APP_STORE.md](docs/APP_STORE.md).

## Prerequisites (macOS)

1. **Node.js** 18+ and npm
2. **Rust** — [rustup](https://rustup.rs/)
3. **Xcode Command Line Tools** — `xcode-select --install`

## Development

```bash
npm install
npm run tauri:dev
```

Native window loads Vite at `http://localhost:5173`. Window title shows `Aegis · v1.0.0 (build <git-hash>)`.

## Production builds

| Script | Icons | Use |
|--------|-------|-----|
| `npm run tauri:build:dev` | Amber **v1.0** badge on icon (`icons-dev/`) | Local / TestFlight-style iterations |
| `npm run tauri:build:release` | Clean shield (`icons/`) | App Store / notarized release |
| `npm run tauri:build` | Same as **dev** (default) | Day-to-day desktop builds |

Both scripts sync version, build, and copy **`dist-mac/Aegis.app`** (and `.dmg` when present).

Output from Tauri directly:

- **`.app`:** `src-tauri/target/release/bundle/macos/Aegis.app`
- **`.dmg`:** `src-tauri/target/release/bundle/dmg/`

```bash
open dist-mac/Aegis.app
```

Unsigned builds: first launch → **right-click → Open** (Gatekeeper).

## Install policy (avoid Launchpad duplicates)

1. **Remove** old copies: `AAISM Intelligence.app`, extra `Aegis.app` from past builds.
2. **Replace in place:** drag `dist-mac/Aegis.app` → `/Applications` and choose **Replace** — do not keep multiple copies.
3. Dev builds show an **amber version badge** on the Dock/Launchpad icon; release builds do not.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run sync:tauri` | Sync version + build metadata to `tauri.conf.json` / `Cargo.toml` |
| `npm run stamp:icons` | Generate dev-stamped icons in `src-tauri/icons-dev/` |
| `npm run tauri:dev` | Dev window + hot reload |
| `npm run tauri:build:dev` | Dev `.app` with stamped icon → `dist-mac/` |
| `npm run tauri:build:release` | Release `.app` with clean icon → `dist-mac/` |
| `npm run build:pages` | GitHub Pages deploy (unchanged) |

## Notes

- **Base path:** Tauri uses `/`; GitHub Pages uses `/aaism-study-app/`.
- **Ollama:** `http://localhost:11434` works from the desktop app.
- **Code signing / App Store:** See [docs/APP_STORE.md](docs/APP_STORE.md).
- **iPhone:** PWA via Safari → Add to Home Screen (manifest name: `Aegis v<version>`).
