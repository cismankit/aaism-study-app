#!/usr/bin/env node
/**
 * Rasterize public/logo.svg → Tauri icon set + PWA apple-touch-icon.
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoSvg = join(root, 'public/logo.svg');
const tmpPng = join(root, 'scripts/.icon-master.png');

function renderPng(size, outPath) {
  const svg = readFileSync(logoSvg, 'utf8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  writeFileSync(outPath, resvg.render().asPng());
}

function main() {
  renderPng(1024, tmpPng);
  renderPng(180, join(root, 'public/apple-touch-icon.png'));
  console.log('[generate-icons] apple-touch-icon.png → 180×180');

  execSync(`npx tauri icon "${tmpPng}" -o "${join(root, 'src-tauri/icons')}"`, {
    cwd: root,
    stdio: 'inherit',
  });

  if (existsSync(tmpPng)) unlinkSync(tmpPng);
  console.log('[generate-icons] Tauri icons → src-tauri/icons/');
}

main();
