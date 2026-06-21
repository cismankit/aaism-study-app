#!/usr/bin/env node
/**
 * Orchestrate Tauri desktop builds: sync version, optional dev icon stamp, build, copy to dist-mac/.
 *
 * DMG notes:
 * - CI=true → Tauri passes --skip-jenkins to bundle_dmg.sh (no Finder AppleScript; reliable in agents/CI).
 * - hdiutil requires full macOS permissions (not Cursor seatbelt sandbox).
 * - If bundle_dmg.sh fails but Aegis.app exists, we create a plain UDZO .dmg via hdiutil fallback.
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
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

const env = {
  ...process.env,
  CI: 'true',
  CARGO_TARGET_DIR: join(root, 'src-tauri/target'),
};
if (mode === 'release') env.TAURI_RELEASE = '1';

const bundleMac = join(root, 'src-tauri/target/release/bundle/macos');
const dmgDir = join(root, 'src-tauri/target/release/bundle/dmg');

/** Remove rw.*.dmg leftovers from interrupted bundle_dmg.sh runs. */
function cleanStaleDmgTemps() {
  if (!existsSync(bundleMac)) return;
  for (const f of readdirSync(bundleMac)) {
    if (f.startsWith('rw.') && f.endsWith('.dmg')) {
      rmSync(join(bundleMac, f), { force: true });
    }
  }
}

/** First finished .dmg in Tauri output dirs (not read-write temps). */
function findBundledDmg() {
  for (const dir of [dmgDir, bundleMac]) {
    if (!existsSync(dir)) continue;
    const name = readdirSync(dir).find((f) => f.endsWith('.dmg') && !f.startsWith('rw.'));
    if (name) return { path: join(dir, name), name };
  }
  return null;
}

/** Plain UDZO disk image when bundle_dmg.sh fails (same payload, no Finder layout). */
function createDmgFallback(appPath) {
  const tauri = JSON.parse(readFileSync(join(root, 'src-tauri/tauri.conf.json'), 'utf8'));
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64';
  const dmgName = `Aegis_${tauri.version}_${arch}.dmg`;
  mkdirSync(dmgDir, { recursive: true });
  const dmgOut = join(dmgDir, dmgName);
  rmSync(dmgOut, { force: true });
  execSync(
    `hdiutil create -volname "Aegis" -srcfolder "${appPath}" -ov -format UDZO "${dmgOut}"`,
    { stdio: 'inherit' },
  );
  return { path: dmgOut, name: dmgName };
}

cleanStaleDmgTemps();

let bundlerFailed = false;
try {
  execSync(`npx tauri build ${configFlag}`, { cwd: root, stdio: 'inherit', env });
} catch {
  bundlerFailed = true;
  console.warn('[prepare-tauri-build] tauri build exited non-zero (often bundle_dmg.sh / hdiutil)');
}

const appSrc = join(bundleMac, 'Aegis.app');
if (!existsSync(appSrc)) {
  console.error('[prepare-tauri-build] Expected Aegis.app at', appSrc);
  process.exit(1);
}

let dmg = findBundledDmg();
if (!dmg) {
  console.log('[prepare-tauri-build] No .dmg from bundler — running hdiutil fallback…');
  try {
    dmg = createDmgFallback(appSrc);
    console.log(`[prepare-tauri-build] Fallback DMG → ${dmg.path}`);
  } catch {
    console.error(
      '[prepare-tauri-build] DMG creation failed. hdiutil needs full macOS access (not Cursor sandbox).',
    );
    console.error('[prepare-tauri-build] Aegis.app was built; copy dist-mac/Aegis.app manually if needed.');
    if (bundlerFailed) process.exit(1);
  }
} else if (bundlerFailed) {
  console.log('[prepare-tauri-build] Recovered .dmg after bundler error');
}

cleanStaleDmgTemps();

const distMac = join(root, 'dist-mac');
mkdirSync(distMac, { recursive: true });

for (const legacy of ['AAISM Intelligence.app', 'AAISM Intelligence_1.0.0_aarch64.dmg']) {
  rmSync(join(distMac, legacy), { recursive: true, force: true });
}

rmSync(join(distMac, 'Aegis.app'), { recursive: true, force: true });
cpSync(appSrc, join(distMac, 'Aegis.app'), { recursive: true });

if (dmg) {
  cpSync(dmg.path, join(distMac, dmg.name), { force: true });
  console.log(`[prepare-tauri-build] Copied ${dmg.name} → dist-mac/`);
}

console.log(`[prepare-tauri-build] ${mode} build shipped → dist-mac/Aegis.app`);
