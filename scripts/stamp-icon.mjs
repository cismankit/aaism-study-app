#!/usr/bin/env node
/**
 * Dev-build icons: subtle amber corner badge + git hash (window title keeps full `dev+hash`).
 * Output → src-tauri/icons-dev/ (release icons in icons/ stay clean).
 */
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { computeVersionInfo, iconStampLabel } from './lib/version-info.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src-tauri/icons');
const outDir = join(root, 'src-tauri/icons-dev');
const { iconBadge: fullBadge } = computeVersionInfo({ release: false });

const STAMP_FILES = ['32x32.png', '64x64.png', '128x128.png', '128x128@2x.png', 'icon.png'];

const REF_SIZE = 512;
const BADGE_FILL = 'rgba(71, 65, 55, 0.78)';
const BADGE_DOT_FILL = 'rgba(217, 119, 6, 0.88)';
const BADGE_TEXT = 'rgba(255, 255, 255, 0.96)';

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function badgeFontSize(size) {
  if (size <= 32) return 0;
  const scaled = Math.round((size * 7) / REF_SIZE);
  if (size <= 64) return Math.max(scaled, 5);
  return Math.max(scaled, 6);
}

function buildBadgeSvg(size, stamp) {
  const margin = Math.max(Math.round(size * 0.05), 1);

  if (stamp.mode === 'dot') {
    const r = Math.max(Math.round(size * 0.085), 2);
    const d = r * 2;
    const x = size - d - margin;
    const y = size - d - margin;
    return {
      svg: `<svg width="${d}" height="${d}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${r}" cy="${r}" r="${r}" fill="${BADGE_DOT_FILL}"/>
      </svg>`,
      width: d,
      height: d,
      x,
      y,
    };
  }

  const label = escapeXml(stamp.label ?? '');
  const fontSize = badgeFontSize(size);
  const padX = Math.max(Math.round(fontSize * 0.38), 2);
  const badgeH = Math.max(Math.round(fontSize * 1.32), size <= 64 ? 7 : 8);
  const charW = fontSize * 0.56;
  let badgeW = Math.round(label.length * charW + padX * 2);

  const maxW = Math.round(size * 0.22);
  const maxH = Math.round(size * 0.14);
  badgeW = Math.min(badgeW, maxW);
  const badgeHClamped = Math.min(badgeH, maxH);
  const rx = Math.round(badgeHClamped * 0.42);
  const x = Math.max(0, size - badgeW - margin);
  const y = Math.max(0, size - badgeHClamped - margin);

  const svg = `<svg width="${badgeW}" height="${badgeHClamped}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${badgeW}" height="${badgeHClamped}" rx="${rx}" fill="${BADGE_FILL}"/>
      <text x="${badgeW / 2}" y="${badgeHClamped * 0.7}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${BADGE_TEXT}">${label}</text>
    </svg>`;

  return { svg, width: badgeW, height: badgeHClamped, x, y };
}

async function stampPng(inputPath, outputPath, size) {
  const stamp = iconStampLabel(fullBadge, size);
  const { svg, x, y } = buildBadgeSvg(size, stamp);
  const badge = await sharp(Buffer.from(svg)).png().toBuffer();

  await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: badge, left: x, top: y }])
    .png()
    .toFile(outputPath);
}

function stampLabelForLog(size) {
  const stamp = iconStampLabel(fullBadge, size);
  if (stamp.mode === 'dot') return '(dot)';
  return stamp.label ?? '';
}

async function buildIcns() {
  if (process.platform !== 'darwin') {
    console.warn('[stamp-icon] Skipping .icns (iconutil requires macOS); PNG stamps still applied.');
    return;
  }

  const iconset = join(outDir, 'AegisDev.iconset');
  rmSync(iconset, { recursive: true, force: true });
  mkdirSync(iconset, { recursive: true });

  const baseIcon = join(srcDir, 'icon.png');
  const mappings = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png'],
  ];

  for (const [dim, name] of mappings) {
    await stampPng(baseIcon, join(iconset, name), dim);
  }

  execSync(`iconutil -c icns "${iconset}" -o "${join(outDir, 'icon.icns')}"`);
  rmSync(iconset, { recursive: true, force: true });
}

async function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const baseIcon = join(srcDir, 'icon.png');
  await stampPng(baseIcon, join(outDir, 'icon.png'), 1024);

  for (const file of STAMP_FILES) {
    if (file === 'icon.png') continue;
    const input = join(srcDir, file);
    if (!existsSync(input)) continue;
    const meta = await sharp(input).metadata();
    const size = meta.width ?? 128;
    await stampPng(input, join(outDir, file), size);
  }

  await buildIcns();

  const ico = join(srcDir, 'icon.ico');
  if (existsSync(ico)) {
    const { copyFileSync } = await import('node:fs');
    copyFileSync(ico, join(outDir, 'icon.ico'));
  }

  const sizes = [1024, 512, 256, 128, 64, 32, 16];
  const labels = sizes.map((s) => `${s}px→${stampLabelForLog(s)}`).join(', ');
  console.log(`[stamp-icon] Dev icons → icons-dev/ (title badge: ${fullBadge}; stamp: ${labels})`);
}

main().catch((err) => {
  console.error('[stamp-icon]', err);
  process.exit(1);
});
