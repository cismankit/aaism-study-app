/**
 * Shared build metadata: package.json semver + git short hash + build date.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function gitShortHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

export function buildDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** App Store / CFBundleVersion-style incrementing build number (YYYYMMDD01). */
export function dateBuildNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}01`;
}

export function readPackageVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  return pkg.version;
}

/**
 * @param {{ release?: boolean }} opts
 * @returns {{
 *   semver: string;
 *   gitHash: string;
 *   buildDate: string;
 *   displayVersion: string;
 *   windowTitle: string;
 *   pwaName: string;
 *   bundleVersion: string;
 * }}
 */
export function computeVersionInfo({ release = false } = {}) {
  const semver = readPackageVersion();
  const gitHash = gitShortHash();
  const buildDate = buildDateString();
  const displayVersion = release
    ? `${semver}+${gitHash} (${buildDate})`
    : `${semver}-dev+${gitHash} (${buildDate})`;
  const windowTitle = `Aegis · v${displayVersion}`;
  const pwaName = `Aegis v${displayVersion}`;
  const bundleVersion = release ? dateBuildNumber() : gitHash;

  return {
    semver,
    gitHash,
    buildDate,
    displayVersion,
    windowTitle,
    pwaName,
    bundleVersion,
  };
}
