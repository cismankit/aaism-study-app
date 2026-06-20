/**
 * CLI runner for AI smoke tests (uses same logic as src/services/aiSmokeTest.ts).
 * Run: node scripts/run-smoke-tests.mjs
 */

const SMOKE_TEST_TIMEOUT_MS = 15_000;
const SMOKE_TEST_LLM_TIMEOUT_MS = 90_000;
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

async function ollamaChat(messages, jsonMode = false) {
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
    options: { temperature: jsonMode ? 0.3 : 0.7, num_predict: jsonMode ? 1500 : 384 },
  };
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(SMOKE_TEST_LLM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  const content = data.message?.content || '';
  if (!content) throw new Error('Empty Ollama response');
  return content;
}

async function runTests() {
  const results = [];
  const startAll = Date.now();

  async function run(id, label, fn) {
    const t0 = Date.now();
    try {
      const message = await withTimeout(fn(), SMOKE_TEST_LLM_TIMEOUT_MS, label);
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
        { role: 'system', content: 'Return JSON: {summary, findings[], nextSteps[], commands[], mitreMapping[]}' },
        { role: 'user', content: 'Analyze: failed SSH logins from 203.0.113.50' },
      ],
      true,
    );
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? content);
    if (!parsed.summary) throw new Error('No Hermes summary');
    return `Hermes summary: ${String(parsed.summary).slice(0, 100)}`;
  });

  await run('mission-orchestrator', 'Mission Orchestrator', async () => {
    const content = await ollamaChat([
      { role: 'system', content: 'You are Hermes SOC analyst. One sentence only.' },
      { role: 'user', content: 'Smoke test: one AAISM study priority for Domain 1.' },
    ]);
    if (content.length < 5) throw new Error('Empty mission handoff');
    if (/Fallback analysis complete/i.test(content)) throw new Error('Silent fallback detected');
    return content.slice(0, 120);
  });

  await run('agent-discovery', 'Agent Discovery (JSON)', async () => {
    const content = await withTimeout(
      ollamaChat(
      [
        { role: 'system', content: 'Return only valid JSON arrays.' },
        {
          role: 'user',
          content:
            'Generate 1 AAISM exam question JSON array with domain, question, options (4), correctAnswer, explanation.',
        },
      ],
      true,
    ),
      150_000,
      'Agent Discovery (JSON)',
    );
    const parsed = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] ?? content);
    if (!Array.isArray(parsed) || !parsed[0]?.question) throw new Error('Could not parse discovery JSON');
    return 'Discover agent JSON mode parsed 1 valid question';
  });

  const allPassed = results.every(r => r.passed);
  const cors = await checkCorsDiagnostics();
  console.log(JSON.stringify({ allPassed, provider: 'ollama', model: MODEL, totalMs: Date.now() - startAll, corsDiagnostics: cors, results }, null, 2));
  process.exit(allPassed ? 0 : 1);
}

runTests();
