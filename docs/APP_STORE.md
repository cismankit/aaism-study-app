# Aegis — Mac App Store readiness

Single canonical Mac product: **Aegis** · bundle ID **`com.aegis.app`**.

Legacy **`AAISM Intelligence.app`** (`com.aaism.intelligence`) must be removed from `/Applications` and Launchpad before installing the current build.

## Why you see duplicate Launchpad icons

| Icon label | Origin | Action |
|------------|--------|--------|
| **AAISM Intelligence…** | Old Tauri `productName` / bundle ID | **Delete** from Applications |
| **Aegis** (×2) | Multiple `.app` copies dragged to Applications over time | Keep **one**; delete extras |
| **Aegis** (amber badge) | Current dev build (`npm run tauri:build:dev`) | Canonical local install |
| **Aegis** (clean shield) | Release build (`npm run tauri:build:release`) | App Store / notarized builds |

Install only from **`dist-mac/Aegis.app`** (local) or the Mac App Store (future). Replace in place — do not accumulate copies.

## Apple Developer checklist

- [ ] Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/yr)
- [ ] Register App ID **`com.aegis.app`** (explicit, macOS)
- [ ] Create Mac App Store provisioning profile + Mac App Distribution certificate
- [ ] Enable App Sandbox + required entitlements in Tauri (`src-tauri/` — see Tauri App Store guide)
- [ ] Configure code signing in `tauri.conf.json` → `bundle.macOS.signingIdentity`
- [ ] Set monotonic **`bundleVersion`** for each upload (release script uses `YYYYMMDD01`; App Store Connect may require sequential integers)
- [ ] Privacy manifest / usage descriptions if adding network, files, or Apple APIs
- [ ] App Store Connect listing: name **Aegis**, category Education, screenshots from 1400×900 window
- [ ] Notarize non–App Store builds separately if distributing outside the store (`xcrun notarytool`)

## Single bundle ID policy

| Environment | Bundle ID | Icon |
|-------------|-----------|------|
| Production / App Store | `com.aegis.app` | Clean shield (`src-tauri/icons/`) |
| Local dev | `com.aegis.app` | Stamped amber badge (`src-tauri/icons-dev/`) |

Never ship a second bundle ID for the same product. AAISM remains a **certification track inside Aegis**, not a separate Mac app name.

## Code signing + notarization (distribution outside App Store)

1. Install signing certificate ("Developer ID Application") in Keychain.
2. Set in `tauri.conf.json`:
   ```json
   "bundle": {
     "macOS": {
       "signingIdentity": "Developer ID Application: Your Name (TEAMID)"
     }
   }
   ```
3. Build: `npm run tauri:build:release`
4. Notarize the `.dmg` or `.app` with `xcrun notarytool submit` + staple.
5. Distribute **`dist-mac/Aegis.app`** or the notarized `.dmg` only.

## Version & build metadata

- **Marketing version** (`CFBundleShortVersionString`): root `package.json` `version` — synced by `scripts/sync-tauri-version.mjs`
- **Build number** (`CFBundleVersion`): git short hash (dev) or date stamp (release)
- **Window title:** `Aegis · v1.0.0 (build abc1234)` — visible even when icons match
- **In-app:** Settings → About shows Version · Build · Bundle ID + link to Applications folder

## Next steps toward App Store submission

1. **Clean machine state** — delete `AAISM Intelligence.app` and duplicate `Aegis.app` from `/Applications`; install one `dist-mac/Aegis.app` built with `tauri:build:release`.
2. **Configure signing** — Apple Developer certificates, App ID `com.aegis.app`, sandbox entitlements in Tauri; run release build and validate with `codesign --verify --deep --strict`.
3. **Upload to App Store Connect** — archive via `tauri build` with Mac App Store profile, increment `bundle.macOS.bundleVersion` each submission, submit for review with Education category metadata.

See also [TAURI.md](../TAURI.md) for local build commands.
