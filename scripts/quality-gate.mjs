#!/usr/bin/env node
/**
 * Quality gate — runs tsc, build:pages, smoke tests. Exits 1 on any failure.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const steps = [
  { id: 'tsc', label: 'TypeScript (tsc)', cmd: 'npx tsc' },
  { id: 'build-pages', label: 'GitHub Pages build', cmd: 'npm run build:pages' },
  { id: 'smoke', label: 'AI smoke tests', cmd: 'node scripts/run-smoke-tests.mjs', skipInCi: true },
];

let failed = false;

for (const step of steps) {
  if (step.skipInCi && process.env.CI === 'true' && process.env.OLLAMA_SMOKE_TESTS !== '1') {
    console.log(`\n[quality:gate] ⊘ ${step.label} (skipped in CI — set OLLAMA_SMOKE_TESTS=1 to run)`);
    continue;
  }
  console.log(`\n[quality:gate] ▶ ${step.label}`);
  try {
    execSync(step.cmd, { cwd: root, stdio: 'inherit' });
    console.log(`[quality:gate] ✓ ${step.label}`);
  } catch {
    console.error(`[quality:gate] ✗ ${step.label}`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error('\n[quality:gate] FAILED — fix errors above before shipping.');
  process.exit(1);
}

console.log('\n[quality:gate] All gates passed.');
