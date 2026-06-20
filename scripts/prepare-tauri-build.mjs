#!/usr/bin/env node
/**
 * Orchestrate Tauri desktop builds: sync version, optional dev icon stamp, build, copy to dist-mac/.
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'release' ? 'release' : 'dev';

execSync('node scripts/sync-tauri-version.mjs', { cwd: root, stdio: 'inherit' });

if (mode === 'dev') {
  execSync('node scripts/stamp-icon.mjs', { cwd: root, stdio: 'inherit' });
}

const configFlag =
  mode === 'dev'
    ? '--config src-tauri/tauri.dev.conf.json'
    : '--config src-tauri/tauri.release.conf.json';

const env = { ...process.env };
if (mode === 'release') env.TAURI_RELEASE = '1';

execSync(`npx tauri build ${configFlag}`, { cwd: root, stdio: 'inherit', env });

const bundleMac = join(root, 'src-tauri/target/release/bundle/macos');
const distMac = join(root, 'dist-mac');
mkdirSync(distMac, { recursive: true });

// Remove legacy duplicate bundles from dist-mac
for (const legacy of ['AAISM Intelligence.app', 'AAISM Intelligence_1.0.0_aarch64.dmg']) {
  rmSync(join(distMac, legacy), { recursive: true, force: true });
}

const appSrc = join(bundleMac, 'Aegis.app');
if (!existsSync(appSrc)) {
  console.error('[prepare-tauri-build] Expected Aegis.app at', appSrc);
  process.exit(1);
}

rmSync(join(distMac, 'Aegis.app'), { recursive: true, force: true });
cpSync(appSrc, join(distMac, 'Aegis.app'), { recursive: true });

const dmgDir = join(root, 'src-tauri/target/release/bundle/dmg');
if (existsSync(dmgDir)) {
  const dmg = readdirSync(dmgDir).find((f) => f.endsWith('.dmg'));
  if (dmg) {
    cpSync(join(dmgDir, dmg), join(distMac, dmg), { force: true });
    console.log(`[prepare-tauri-build] Copied ${dmg} → dist-mac/`);
  }
}

console.log(`[prepare-tauri-build] ${mode} build shipped → dist-mac/Aegis.app`);
