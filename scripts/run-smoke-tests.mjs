/**
 * CLI runner for AI smoke tests (uses same logic as src/services/aiSmokeTest.ts).
 * Run: node scripts/run-smoke-tests.mjs
 */

const SMOKE_TEST_TIMEOUT_MS = 15_000;
const SMOKE_TEST_LLM_TIMEOUT_MS = 120_000;
const SMOKE_TEST_HEAVY_TIMEOUT_MS = 150_000;
const BASE_URL = 'http://localhost:11434';
const MODEL = 'gemma4:latest';

async function checkCorsDiagnostics() {
  const origins = [
    { label: 'vite-dev', origin: 'http://localhost:5173' },
    { label: 'tauri-webview', origin: 'http://tauri.localhost' },
  ];
  const results = [];
  for (const { label, origin } of origins) {
    const res = await fetch(`${BASE_URL}/api/tags`, { headers: { Origin: origin } });
    results.push({ label, origin, status: res.status, ok: res.ok });
  }
  return results;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

function extractOllamaContent(message, jsonMode = false) {
  let content = String(message?.content ?? '').trim();
  if (content) return content;
  const thinking = String(message?.thinking ?? '').trim();
  if (!thinking) return '';
  if (jsonMode) {
    const jsonMatch = thinking.match(/\{[\s\S]*\}/) ?? thinking.match(/\[[\s\S]*\]/);
    return (jsonMatch?.[0] ?? thinking).trim();
  }
  return thinking;
}

async function ollamaChat(messages, jsonMode = false, { retries = 1 } = {}) {
  const body = {
    model: MODEL,
    messages: jsonMode
      ? messages.map((m, i) =>
          i === 0 && m.role === 'system'
            ? { ...m, content: `${m.content}\n\nYou MUST respond with valid JSON only.` }
            : m,
        )
      : messages,
    stream: false,
    format: jsonMode ? 'json' : undefined,
    options: { temperature: jsonMode ? 0.3 : 0.7, num_predict: jsonMode ? 2048 : 1024 },
  };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SMOKE_TEST_HEAVY_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json();
      const content = extractOllamaContent(data.message, jsonMode);
      if (!content) throw new Error('Empty Ollama response');
      return content;
    } catch (e) {
      lastError = e;
      if (attempt < retries) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function runTests() {
  const results = [];
  const startAll = Date.now();

  async function run(id, label, fn, timeoutMs = SMOKE_TEST_LLM_TIMEOUT_MS) {
    const t0 = Date.now();
    try {
      const message = await withTimeout(fn(), timeoutMs, label);
      results.push({ id, label, passed: true, durationMs: Date.now() - t0, message });
    } catch (e) {
      results.push({
        id,
        label,
        passed: false,
        durationMs: Date.now() - t0,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  await run('chat', 'Chat (Ollama)', async () => {
    const tags = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!tags.ok) throw new Error('Ollama not running');
    const content = await ollamaChat([{ role: 'user', content: 'Reply with exactly the word OK.' }]);
    return `chat() returned ${content.trim().slice(0, 80)}`;
  });

  await run('ops-copilot', 'Ops Copilot (Hermes)', async () => {
    const content = await ollamaChat(
      [
        {
          role: 'system',
          content:
            'You are Hermes SOC analyst. Return JSON only: {"summary":"one-line analysis of the alert"}',
        },
        { role: 'user', content: 'Analyze: failed SSH logins from 203.0.113.50' },
      ],
      true,
    );
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? content);
    if (!parsed.summary) throw new Error('No Hermes summary');
    return `Hermes summary: ${String(parsed.summary).slice(0, 100)}`;
  });

  await run(
    'mission-orchestrator',
    'Mission Orchestrator',
    async () => {
      const content = await ollamaChat([
        { role: 'system', content: 'You are Hermes SOC analyst. One sentence only.' },
        { role: 'user', content: 'Smoke test: one AAISM study priority for Domain 1.' },
      ]);
      if (content.length < 5) throw new Error('Empty mission handoff');
      if (/Fallback analysis complete/i.test(content)) throw new Error('Silent fallback detected');
      return content.slice(0, 120);
    },
    SMOKE_TEST_HEAVY_TIMEOUT_MS,
  );

  await run(
    'agent-discovery',
    'Agent Discovery (JSON)',
    async () => {
      const content = await ollamaChat(
        [
          { role: 'system', content: 'Return only a JSON array with one object.' },
          {
            role: 'user',
            content:
              'One AAISM question: [{domain,question,options:[4 strings],correctAnswer,explanation}]',
          },
        ],
        true,
      );
      const parsed = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] ?? content);
      if (!Array.isArray(parsed) || !parsed[0]?.question) throw new Error('Could not parse discovery JSON');
      return 'Discover agent JSON mode parsed 1 valid question';
    },
    SMOKE_TEST_HEAVY_TIMEOUT_MS,
  );

  const passCount = results.filter(r => r.passed).length;
  const passRate = passCount / results.length;
  const gatePassed = passRate >= 0.8;
  const allPassed = passCount === results.length;
  const cors = await checkCorsDiagnostics();
  console.log(
    JSON.stringify(
      {
        allPassed,
        gatePassed,
        passRate,
        passCount,
        totalTests: results.length,
        provider: 'ollama',
        model: MODEL,
        totalMs: Date.now() - startAll,
        corsDiagnostics: cors,
        results,
      },
      null,
      2,
    ),
  );
  process.exit(gatePassed ? 0 : 1);
}

runTests();
