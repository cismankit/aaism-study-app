# AAISM Intelligence — Mac Desktop App (Tauri)

Run AAISM as a native macOS `.app` instead of in the browser. Built with [Tauri v2](https://v2.tauri.app/) wrapping the existing Vite + React frontend.

## Prerequisites (macOS)

1. **Node.js** 18+ and npm
2. **Rust** — install via [rustup](https://rustup.rs/):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"   # add to ~/.zshrc for new shells
   ```
3. **Xcode Command Line Tools** — `xcode-select --install` (verify with `xcode-select -p`)

First `npm run tauri:build` downloads Rust crates and may take several minutes.

## Development

```bash
npm install
npm run tauri:dev
```

Opens a native window (1400×900) loading the Vite dev server at `http://localhost:5173`.

## Production build

```bash
npm run tauri:build
```

Output:

- **`.app` bundle:** `src-tauri/target/release/bundle/macos/AAISM Intelligence.app`
- **`.dmg` installer:** `src-tauri/target/release/bundle/dmg/`

Launch the `.app` from Finder, or:

```bash
open "src-tauri/target/release/bundle/macos/AAISM Intelligence.app"
```

Unsigned builds: first launch requires **right-click → Open** (macOS Gatekeeper).

## Notes

- **Base path:** Tauri builds use `/` (not `/aaism-study-app/`). GitHub Pages builds are unchanged (`npm run build:pages`).
- **Ollama:** Local AI via `http://localhost:11434` works from the desktop app the same as in the browser.
- **Code signing:** Unsigned builds run locally after right-click → Open. For distribution, configure Apple Developer signing in Xcode or `tauri.conf.json` bundle settings.
- **iPhone:** Use the PWA (Add to Home Screen in Safari) — no native iOS app without App Store / TestFlight distribution.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run tauri:dev` | Dev window + hot reload |
| `npm run tauri:build` | Release `.app` / `.dmg` |
| `npm run build:pages` | GitHub Pages deploy build (unchanged) |
