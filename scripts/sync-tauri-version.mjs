#!/usr/bin/env node
/**
 * Sync version + build metadata from package.json → Tauri + Cargo.
 * Run before every desktop build (dev or release).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;

function gitShortHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

function dateBuildNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}01`;
}

const build = gitShortHash();
const bundleVersion = process.env.TAURI_RELEASE === '1' ? dateBuildNumber() : build;
const windowTitle = `Aegis · v${version} (build ${build})`;

const tauriPath = join(root, 'src-tauri/tauri.conf.json');
const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'));

tauri.productName = 'Aegis';
tauri.version = version;
tauri.identifier = 'com.aegis.app';
tauri.app ??= {};
tauri.app.windows ??= [{}];
tauri.app.windows[0].title = windowTitle;
tauri.bundle ??= {};
tauri.bundle.macOS ??= {};
tauri.bundle.macOS.bundleVersion = String(bundleVersion);

writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`);

const cargoPath = join(root, 'src-tauri/Cargo.toml');
let cargo = readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^version = ".*"$/m, `version = "${version}"`);
writeFileSync(cargoPath, cargo);

console.log(`[sync-tauri-version] Aegis v${version} · build ${build} · bundleVersion ${bundleVersion}`);
