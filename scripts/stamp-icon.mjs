#!/usr/bin/env node
/**
 * Dev-build icons: amber corner badge + git hash (matches APP_ICON_BADGE).
 * Output → src-tauri/icons-dev/ (release icons in icons/ stay clean).
 */
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { computeVersionInfo, iconBadgeForIconSize } from './lib/version-info.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src-tauri/icons');
const outDir = join(root, 'src-tauri/icons-dev');
const { iconBadge: fullBadge } = computeVersionInfo({ release: false });

const STAMP_FILES = ['32x32.png', '64x64.png', '128x128.png', '128x128@2x.png', 'icon.png'];

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function stampPng(inputPath, outputPath, size) {
  const margin = Math.max(Math.round(size * 0.04), 1);
  let label = escapeXml(iconBadgeForIconSize(fullBadge, size));
  let fontSize = Math.max(Math.round(size * 0.11), 6);
  let padX = Math.round(fontSize * 0.4);
  let badgeH = Math.max(Math.round(fontSize * 1.3), 8);
  let charW = fontSize * 0.55;
  let badgeW = Math.round(label.length * charW + padX * 2);
  const maxW = size - margin * 2;
  const maxH = Math.max(Math.round(size * 0.38), 8);
  if (badgeW > maxW) {
    label = escapeXml(iconBadgeForIconSize(fullBadge, Math.min(size, 64)));
    fontSize = Math.max(Math.round(size * 0.1), 5);
    padX = Math.round(fontSize * 0.35);
    badgeH = Math.min(Math.max(Math.round(fontSize * 1.25), 7), maxH);
    charW = fontSize * 0.55;
    badgeW = Math.min(Math.round(label.length * charW + padX * 2), maxW);
  }
  badgeH = Math.min(badgeH, maxH);
  badgeW = Math.min(badgeW, maxW);
  const rx = Math.round(badgeH * 0.28);
  const x = Math.max(0, size - badgeW - margin);
  const y = Math.max(0, size - badgeH - margin);

  const svg = `
    <svg width="${badgeW}" height="${badgeH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="${rx}" fill="#f59e0b"/>
      <text x="${badgeW / 2}" y="${badgeH * 0.68}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#111827">${label}</text>
    </svg>`;

  const badge = await sharp(Buffer.from(svg)).png().toBuffer();

  await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: badge, left: x, top: y }])
    .png()
    .toFile(outputPath);
}

async function buildIcns(stamped1024) {
  if (process.platform !== 'darwin') {
    console.warn('[stamp-icon] Skipping .icns (iconutil requires macOS); PNG stamps still applied.');
    return;
  }

  const iconset = join(outDir, 'AegisDev.iconset');
  rmSync(iconset, { recursive: true, force: true });
  mkdirSync(iconset, { recursive: true });

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
    await sharp(stamped1024).resize(dim, dim).png().toFile(join(iconset, name));
  }

  execSync(`iconutil -c icns "${iconset}" -o "${join(outDir, 'icon.icns')}"`);
  rmSync(iconset, { recursive: true, force: true });
}

async function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const baseIcon = join(srcDir, 'icon.png');
  const stampedMaster = join(outDir, 'icon.png');
  await stampPng(baseIcon, stampedMaster, 1024);

  for (const file of STAMP_FILES) {
    if (file === 'icon.png') continue;
    const input = join(srcDir, file);
    if (!existsSync(input)) continue;
    const meta = await sharp(input).metadata();
    const size = meta.width ?? 128;
    await stampPng(input, join(outDir, file), size);
  }

  await buildIcns(stampedMaster);

  const ico = join(srcDir, 'icon.ico');
  if (existsSync(ico)) {
    const { copyFileSync } = await import('node:fs');
    copyFileSync(ico, join(outDir, 'icon.ico'));
  }

  console.log(`[stamp-icon] Dev icons → icons-dev/ (badge: ${fullBadge})`);
}

main().catch((err) => {
  console.error('[stamp-icon]', err);
  process.exit(1);
});
