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

/** M/D for compact icon badges (e.g. 6/20). */
export function buildDateBadgeString() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
 * Dock/Finder badge text — must match in-app window title suffix.
 * @param {{ release?: boolean }} opts
 */
export function computeIconBadge({ release = false } = {}) {
  const gitHash = gitShortHash();
  if (release) {
    const semver = readPackageVersion();
    const short = semver.split('.').slice(0, 2).join('.');
    return `v${short}+${gitHash}`;
  }
  return `dev+${gitHash}`;
}

/**
 * Shorter badge for small PNG sizes (hash or date when full label won't fit).
 */
export function iconBadgeForIconSize(fullBadge, pixelSize) {
  if (pixelSize >= 128) return fullBadge;
  const hashMatch = fullBadge.match(/\+([a-f0-9]+)$/i);
  if (hashMatch) return hashMatch[1];
  if (fullBadge.length <= 7) return fullBadge;
  return buildDateBadgeString();
}

/**
 * @param {{ release?: boolean }} opts
 * @returns {{
 *   semver: string;
 *   gitHash: string;
 *   buildDate: string;
 *   iconBadge: string;
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
  const iconBadge = computeIconBadge({ release });
  const displayVersion = release
    ? `${semver}+${gitHash} (${buildDate})`
    : `${semver}-dev+${gitHash} (${buildDate})`;
  const windowTitle = `Aegis · ${iconBadge}`;
  const pwaName = `Aegis ${iconBadge}`;
  const bundleVersion = release ? dateBuildNumber() : gitHash;

  return {
    semver,
    gitHash,
    buildDate,
    iconBadge,
    displayVersion,
    windowTitle,
    pwaName,
    bundleVersion,
  };
}
