#!/usr/bin/env node
/**
 * Dev-build icons: amber corner badge + version stamp on release icons.
 * Output → src-tauri/icons-dev/ (release icons in icons/ stay clean).
 */
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src-tauri/icons');
const outDir = join(root, 'src-tauri/icons-dev');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const label = `v${version.split('.').slice(0, 2).join('.')}`;

const STAMP_FILES = ['32x32.png', '64x64.png', '128x128.png', '128x128@2x.png', 'icon.png'];

async function stampPng(inputPath, outputPath, size) {
  const badgeW = Math.max(Math.round(size * 0.38), 24);
  const badgeH = Math.max(Math.round(size * 0.16), 12);
  const fontSize = Math.max(Math.round(badgeH * 0.62), 8);
  const rx = Math.round(badgeH * 0.28);
  const x = size - badgeW - Math.round(size * 0.04);
  const y = size - badgeH - Math.round(size * 0.04);

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

  // Windows icon: copy release (dev badge optional on .ico — skip for MVP)
  const ico = join(srcDir, 'icon.ico');
  if (existsSync(ico)) {
    const { copyFileSync } = await import('node:fs');
    copyFileSync(ico, join(outDir, 'icon.ico'));
  }

  console.log(`[stamp-icon] Dev icons → icons-dev/ (${label} amber badge)`);
}

main().catch((err) => {
  console.error('[stamp-icon]', err);
  process.exit(1);
});
