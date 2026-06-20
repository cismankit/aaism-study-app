#!/usr/bin/env node
/**
 * Sync version + build metadata from package.json → Tauri + Cargo.
 * Run before every desktop build (dev or release).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeVersionInfo } from './lib/version-info.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const release = process.env.TAURI_RELEASE === '1';
const info = computeVersionInfo({ release });

// Keep appMeta.generated.ts in sync for Tauri frontend bundle
import { execSync } from 'node:child_process';
execSync('node scripts/sync-version.mjs', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, TAURI_RELEASE: release ? '1' : '0' },
});

const tauriPath = join(root, 'src-tauri/tauri.conf.json');
const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'));

tauri.productName = 'Aegis';
tauri.version = info.semver;
tauri.identifier = 'com.aegis.app';
tauri.app ??= {};
tauri.app.windows ??= [{}];
tauri.app.windows[0].title = info.windowTitle;
tauri.bundle ??= {};
tauri.bundle.macOS ??= {};
tauri.bundle.macOS.bundleVersion = String(info.bundleVersion);

writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`);

const cargoPath = join(root, 'src-tauri/Cargo.toml');
let cargo = readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^version = ".*"$/m, `version = "${info.semver}"`);
writeFileSync(cargoPath, cargo);

console.log(
  `[sync-tauri-version] ${info.displayVersion} · bundleVersion ${info.bundleVersion}`,
);
