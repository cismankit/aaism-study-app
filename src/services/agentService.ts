import { chat, loadAIConfig, AAISM_CONTEXT, type AIConfig, type Message } from './aiService';
import { getAllQuestions, type ExamQuestion, ALL_DOMAINS } from '../data/examContent';
import { QUESTION_PATTERNS, TRAP_PATTERNS, TOPIC_HEAT_MAP } from '../data/communityIntelligence';
import {
  type QuestionLead,
  type DiscoveryStrategy,
  type CoverageGap,
  type AgentRun,
  startRun,
  updateRun,
  addLogEntry,
  addLeads,
  getApprovedQuestions,
  loadPipelineState,
} from './agentStore';

// ============ COVERAGE ANALYSIS ============

export function analyzeCoverage(): {
  gaps: CoverageGap[];
  topicCounts: Record<string, number>;
  domainCounts: Record<number, number>;
  difficultyCounts: Record<string, number>;
  totalQuestions: number;
} {
  const existing = [...getAllQuestions(), ...getApprovedQuestions()];

  const topicCounts: Record<string, number> = {};
  const domainCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const difficultyCounts: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const topicByDomainDifficulty: Record<string, { count: number; domain: number; difficulty: string }> = {};

  for (const q of existing) {
    const topic = q.topic || 'General';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;

    const key = `${q.domain}:${topic}:${q.difficulty}`;
    if (!topicByDomainDifficulty[key]) {
      topicByDomainDifficulty[key] = { count: 0, domain: q.domain, difficulty: q.difficulty };
    }
    topicByDomainDifficulty[key].count++;
  }

  const allTopics = new Set<string>();
  ALL_DOMAINS.forEach(d => {
    d.chapters.forEach(ch => {
      ch.topics.forEach(t => allTopics.add(t.title));
    });
  });

  const gaps: CoverageGap[] = [];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

  for (const topic of allTopics) {
    for (const domain of [1, 2, 3, 4]) {
      for (const diff of difficulties) {
        const key = `${domain}:${topic}:${diff}`;
        const entry = topicByDomainDifficulty[key];
        const count = entry?.count || 0;

        if (count < 3) {
          gaps.push({
            domain,
            topic,
            currentCount: count,
            difficulty: diff,
            priority: count === 0 ? 'high' : count === 1 ? 'medium' : 'low',
          });
        }
      }
    }
  }

  gaps.sort((a, b) => {
    const prio = { high: 0, medium: 1, low: 2 };
    return prio[a.priority] - prio[b.priority];
  });

  return { gaps, topicCounts, domainCounts, difficultyCounts, totalQuestions: existing.length };
}

// ============ TEXT SIMILARITY (for dedup) ============

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');
  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  words.forEach(w => bigrams.add(w));
  return bigrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return (intersection.size / union.size) * 100;
}

function findMaxSimilarity(question: string, existingQuestions: ExamQuestion[]): number {
  const tokens = tokenize(question);
  let maxSim = 0;
  for (const eq of existingQuestions) {
    const sim = jaccardSimilarity(tokens, tokenize(eq.question));
    if (sim > maxSim) maxSim = sim;
  }
  return Math.round(maxSim);
}

// ============ AI DISCOVERY PROMPTS ============

function buildDiscoveryPrompt(strategy: DiscoveryStrategy, gaps: CoverageGap[], existingSample: ExamQuestion[]): string {
  const domainNames: Record<number, string> = {
    1: 'AI Governance & Program Management',
    2: 'AI Risk Management',
    3: 'AI Technologies & Controls',
    4: 'AI Operations & Monitoring',
  };

  const sampleQs = existingSample.slice(0, 3).map(q =>
    `Q: ${q.question}\n   Options: ${q.options.join(' | ')}\n   Answer: ${q.options[q.correctAnswer]}\n   Explanation: ${q.explanation}\n   Difficulty: ${q.difficulty} | Topic: ${q.topic}`
  ).join('\n\n');

  let strategyInstructions = '';
  let targetGaps = '';

  switch (strategy.type) {
    case 'gap_fill':
      targetGaps = gaps
        .filter(g => !strategy.targetDomain || g.domain === strategy.targetDomain)
        .slice(0, 8)
        .map(g => `- Domain ${g.domain} (${domainNames[g.domain]}): "${g.topic}" [${g.difficulty}] — only ${g.currentCount} question(s)`)
        .join('\n');
      strategyInstructions = `STRATEGY: Gap Fill — Generate questions to fill coverage gaps in the question bank.
Focus on these underrepresented areas:
${targetGaps}`;
      break;

    case 'topic_deep_dive':
      strategyInstructions = `STRATEGY: Topic Deep Dive — Generate advanced, nuanced questions about "${strategy.targetTopic || 'AI Governance'}" in Domain ${strategy.targetDomain || 1} (${domainNames[strategy.targetDomain || 1]}).
Focus on edge cases, real-world scenarios, and questions that test deep understanding rather than surface knowledge.`;
      break;

    case 'difficulty_balance':
      strategyInstructions = `STRATEGY: Difficulty Balance — Generate ${strategy.targetDifficulty || 'hard'}-level questions across all domains.
These should be calibrated to be genuinely ${strategy.targetDifficulty || 'hard'} — not just longer, but requiring synthesis of multiple concepts.`;
      break;

    case 'cross_domain':
      strategyInstructions = `STRATEGY: Cross-Domain — Generate questions that span multiple AAISM domains.
These should test how concepts from different domains interact (e.g., governance implications of a technical control, risk assessment for a deployment strategy).`;
      break;

    case 'scenario_based':
      strategyInstructions = `STRATEGY: Scenario-Based — Generate realistic workplace scenario questions.
Each question should present a realistic situation an AI Security Manager would face, then ask what the BEST/FIRST/MOST IMPORTANT action is.
Use the ISACA exam style: "An organization discovers..." or "A company's AI system..." patterns.`;
      break;

    case 'full_sweep':
      targetGaps = gaps.slice(0, 12).map(g =>
        `- D${g.domain}: "${g.topic}" [${g.difficulty}] (${g.currentCount} existing)`
      ).join('\n');
      strategyInstructions = `STRATEGY: Full Sweep — Generate a diverse set of questions covering multiple domains, topics, and difficulty levels.
Prioritize these gaps:\n${targetGaps}`;
      break;

    case 'community_pattern': {
      const patternList = QUESTION_PATTERNS.slice(0, 5).map(p =>
        `- "${p.keyword}" pattern: ${p.description}\n  Strategy: ${p.strategy}\n  Example stem: "${p.example.stem}"`
      ).join('\n\n');
      strategyInstructions = `STRATEGY: Community Pattern Match — Generate questions using the exact question patterns reported by ISACA exam communities (Reddit, LinkedIn, YouTube, Quora).

## Community-Sourced Question Patterns:
${patternList}

REQUIREMENTS:
- Each question MUST use one of these patterns (BEST, MOST, FIRST, PRIMARY, NOT)
- Distribute evenly across the patterns
- Include realistic distractors that match known community-reported traps
- Questions should feel like they came from a real ISACA exam`;
      break;
    }

    case 'trap_buster': {
      const trapList = TRAP_PATTERNS.slice(0, 6).map(t =>
        `- "${t.name}": ${t.description}\n  Example: ${t.example}\n  Why students fail: ${t.whyStudentsFail}`
      ).join('\n\n');
      strategyInstructions = `STRATEGY: Trap Buster — Generate questions that specifically target known exam traps. Students who practice these will be prepared for the most common pitfalls.

## Known Exam Traps to Target:
${trapList}

REQUIREMENTS:
- Each question should contain a plausible trap answer that matches one of the patterns above
- The correct answer should teach students to avoid the trap
- Explanations must explicitly call out which trap pattern the wrong answers exploit
- Mix across all 4 domains`;
      break;
    }

    case 'forum_hot_topics': {
      const hotTopics = TOPIC_HEAT_MAP.filter(t => t.heat >= 70).slice(0, 10).map(t =>
        `- "${t.topic}" (D${t.domain}, heat: ${t.heat}/100, trend: ${t.trend}): ${t.communityNotes}`
      ).join('\n');
      strategyInstructions = `STRATEGY: Forum Hot Topics — Generate questions on the topics most frequently reported as appearing on the AAISM exam by online communities.

## Community-Reported Hot Topics (ranked by exam frequency):
${hotTopics}

REQUIREMENTS:
- Focus exclusively on these high-frequency topics
- Prioritize topics with "rising" trends
- Use ISACA question patterns (BEST, MOST, FIRST, PRIMARY)
- Questions should test deep understanding, not surface knowledge
- Include scenario-based questions where applicable`;
      break;
    }
  }

  return `You are an ISACA AAISM exam question author. Your goal is to generate practice questions that closely match the style, difficulty, and content of real ISACA certification exams.

${strategyInstructions}

## ISACA Question Patterns to Follow:
- Use "MOST", "BEST", "FIRST", "PRIMARY" qualifiers
- Test conceptual understanding, not memorization
- Include plausible distractors that test common misconceptions
- Explanations should clarify why the correct answer is best AND why other options are wrong
- Questions should be answerable in ~90 seconds (exam pace)

## Example questions from the existing bank (match this style):
${sampleQs}

## Requirements:
Generate exactly ${strategy.questionCount} questions as a JSON array. Each question MUST have:
- "domain": number (1-4)
- "question": string (the question text)
- "options": string[] (exactly 4 options, prefixed with A), B), C), D))
- "correctAnswer": number (0-3 index)
- "explanation": string (detailed explanation)
- "difficulty": "easy" | "medium" | "hard"
- "topic": string (specific topic name)
- "confidence": number (0-100, your confidence this matches real ISACA exam quality)
- "reasoning": string (brief note on why this question is valuable for AAISM prep)

IMPORTANT: Return ONLY a valid JSON array. No markdown, no code fences, no extra text.`;
}

// ============ ROBUST JSON PARSER ============

type ParsedQuestion = ExamQuestion & { confidence: number; reasoning: string };

function sanitizeJsonString(raw: string): string {
  let s = raw.trim();
  // Strip markdown code fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  // Strip leading prose before first [ or {
  const firstBracket = Math.min(
    s.indexOf('[') === -1 ? Infinity : s.indexOf('['),
    s.indexOf('{') === -1 ? Infinity : s.indexOf('{'),
  );
  if (firstBracket !== Infinity && firstBracket > 0) {
    s = s.slice(firstBracket);
  }
  // Strip trailing prose after last ] or }
  const lastClose = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  if (lastClose !== -1) {
    s = s.slice(0, lastClose + 1);
  }
  // Fix trailing commas before ] or }
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Fix single quotes to double quotes (common small-model issue)
  // Only do this if there are no double quotes at all (avoid breaking valid JSON)
  if (!s.includes('"') && s.includes("'")) {
    s = s.replace(/'/g, '"');
  }
  return s;
}

function tryParseJson(raw: string): unknown[] {
  const cleaned = sanitizeJsonString(raw);

  // Attempt 1: Direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch { /* continue */ }

  // Attempt 2: Extract JSON array with greedy regex
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Attempt 2b: Fix truncated array — add missing ]
      try {
        const fixed = arrayMatch[0].replace(/,\s*$/, '') + ']';
        const parsed = JSON.parse(fixed);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* continue */ }
    }
  }

  // Attempt 3: Find individual JSON objects { ... } and collect them
  const objects: unknown[] = [];
  const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let match;
  while ((match = objRegex.exec(cleaned)) !== null) {
    try {
      objects.push(JSON.parse(match[0]));
    } catch { /* skip malformed */ }
  }
  if (objects.length > 0) return objects;

  // Attempt 4: Try line-by-line JSON objects (JSONL)
  const lines = raw.split('\n').filter(l => l.trim().startsWith('{'));
  for (const line of lines) {
    try {
      objects.push(JSON.parse(line.trim()));
    } catch { /* skip */ }
  }
  return objects;
}

function normalizeQuestion(q: Record<string, unknown>): ParsedQuestion | null {
  if (!q || typeof q !== 'object') return null;

  const question = String(q.question || q.Question || q.q || '').trim();
  if (!question || question.length < 10) return null;

  // Normalize options — handle arrays, lettered keys, numbered keys
  let options: string[] = [];
  if (Array.isArray(q.options)) {
    options = q.options.map((o: unknown) => String(o));
  } else if (Array.isArray(q.Options)) {
    options = (q.Options as unknown[]).map((o: unknown) => String(o));
  } else if (Array.isArray(q.answers)) {
    options = (q.answers as unknown[]).map((o: unknown) => String(o));
  } else {
    // Try to build from A/B/C/D keys
    const a = q.A || q.a || q.option_a || q.optionA;
    const b = q.B || q.b || q.option_b || q.optionB;
    const c = q.C || q.c || q.option_c || q.optionC;
    const d = q.D || q.d || q.option_d || q.optionD;
    if (a && b && c && d) {
      options = [`A) ${a}`, `B) ${b}`, `C) ${c}`, `D) ${d}`];
    }
  }
  if (options.length < 4) return null;
  options = options.slice(0, 4);

  // Normalize correctAnswer — handle number, letter, string
  let correctAnswer = -1;
  const ca = q.correctAnswer ?? q.correct_answer ?? q.answer ?? q.correctOption ?? q.correct;
  if (typeof ca === 'number') {
    correctAnswer = ca;
  } else if (typeof ca === 'string') {
    const letter = ca.trim().toUpperCase().charAt(0);
    const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    if (letter in letterMap) {
      correctAnswer = letterMap[letter];
    } else if (!isNaN(Number(ca))) {
      correctAnswer = Number(ca);
    }
  }
  if (correctAnswer < 0 || correctAnswer > 3) correctAnswer = 0;

  const explanation = String(q.explanation || q.Explanation || q.rationale || q.reason || 'See correct answer above.').trim();

  const rawDiff = String(q.difficulty || q.Difficulty || q.level || 'medium').toLowerCase();
  const difficulty = (['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium') as 'easy' | 'medium' | 'hard';

  const topic = String(q.topic || q.Topic || q.category || q.subject || 'General').trim();
  const domain = Math.min(4, Math.max(1, Number(q.domain || q.Domain) || 1));

  return {
    id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    domain,
    question,
    options,
    correctAnswer,
    explanation,
    difficulty,
    topic,
    confidence: Math.min(100, Math.max(0, Number(q.confidence || q.Confidence) || 70)),
    reasoning: String(q.reasoning || q.Reasoning || q.rationale || 'AI-generated ISACA-style question'),
  };
}

function parseDiscoveredQuestions(response: string): ParsedQuestion[] {
  const rawObjects = tryParseJson(response);
  const results: ParsedQuestion[] = [];
  for (const obj of rawObjects) {
    const q = normalizeQuestion(obj as Record<string, unknown>);
    if (q) results.push(q);
  }
  return results;
}

// ============ SIMPLIFIED FALLBACK PROMPT (for small models) ============

function buildSimplifiedPrompt(strategy: DiscoveryStrategy, batchSize: number): string {
  const domainFocus = strategy.targetDomain
    ? `Focus on Domain ${strategy.targetDomain}.`
    : 'Cover domains 1-4.';

  return `Generate ${batchSize} ISACA AAISM exam practice questions. ${domainFocus}

Return a JSON array. Each object needs: domain (1-4), question, options (4 strings with A/B/C/D prefixes), correctAnswer (0-3), explanation, difficulty (easy/medium/hard), topic.

Example:
[{"domain":1,"question":"What is the PRIMARY purpose of an AI Governance Board?","options":["A) Develop AI models","B) Provide strategic oversight","C) Replace IT department","D) Approve vendor contracts"],"correctAnswer":1,"explanation":"The board provides oversight.","difficulty":"medium","topic":"AI Governance"}]

Return ONLY the JSON array, nothing else.`;
}

// ============ CORE AGENT PIPELINE ============

export interface LiveLogEntry {
  timestamp: string;
  phase: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'thinking';
}

export interface AgentCallbacks {
  onPhaseChange: (phase: string, message: string) => void;
  onLog: (entry: LiveLogEntry) => void;
  onLeadsFound: (leads: QuestionLead[]) => void;
  onComplete: (run: AgentRun) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

class AgentAbortError extends Error {
  constructor() { super('Agent stopped by user'); this.name = 'AgentAbortError'; }
}

function checkAbort(callbacks: AgentCallbacks) {
  if (callbacks.signal?.aborted) throw new AgentAbortError();
}

function emitLog(callbacks: AgentCallbacks, phase: string, message: string, type: LiveLogEntry['type'] = 'info') {
  callbacks.onLog({
    timestamp: new Date().toISOString(),
    phase,
    message,
    type,
  });
}

const AI_THINKING_MESSAGES = [
  'Reasoning about ISACA exam patterns...',
  'Analyzing domain knowledge requirements...',
  'Crafting plausible distractors...',
  'Calibrating difficulty levels...',
  'Ensuring questions test understanding, not memorization...',
  'Evaluating cross-domain concept integration...',
  'Reviewing NIST AI RMF alignment...',
  'Checking EU AI Act relevance...',
  'Formulating detailed explanations...',
  'Applying OWASP LLM Top 10 coverage...',
  'Balancing governance vs technical depth...',
  'Generating scenario-based contexts...',
  'Validating answer option quality...',
  'Mapping questions to MITRE ATLAS tactics...',
  'Incorporating MLOps best practices...',
  'Cross-referencing ISO 42001 requirements...',
  'Structuring JSON response payload...',
];

export async function runDiscoveryAgent(
  strategy: DiscoveryStrategy,
  callbacks: AgentCallbacks,
  config?: AIConfig,
): Promise<AgentRun> {
  const aiConfig = config || loadAIConfig();
  const run = startRun(strategy);

  try {
    // Phase 1: Analyze
    checkAbort(callbacks);
    callbacks.onPhaseChange('analyze', 'Scanning existing question bank...');
    emitLog(callbacks, 'analyze', 'Starting coverage analysis of existing question bank', 'info');
    addLogEntry(run.id, { phase: 'analyze', message: 'Starting coverage analysis' });

    const coverage = analyzeCoverage();
    emitLog(callbacks, 'analyze', `Scanned ${coverage.totalQuestions} existing questions across 4 domains`, 'info');

    const topGaps = coverage.gaps.filter(g =>
      (!strategy.targetDomain || g.domain === strategy.targetDomain) &&
      (!strategy.targetDifficulty || g.difficulty === strategy.targetDifficulty)
    );

    emitLog(callbacks, 'analyze', `Domain breakdown — D1: ${coverage.domainCounts[1]}, D2: ${coverage.domainCounts[2]}, D3: ${coverage.domainCounts[3]}, D4: ${coverage.domainCounts[4]}`, 'info');
    emitLog(callbacks, 'analyze', `Difficulty split — Easy: ${coverage.difficultyCounts['easy']}, Medium: ${coverage.difficultyCounts['medium']}, Hard: ${coverage.difficultyCounts['hard']}`, 'info');
    emitLog(callbacks, 'analyze', `Identified ${topGaps.length} coverage gaps matching strategy filters`, 'success');

    if (topGaps.length > 0) {
      const topN = topGaps.slice(0, 3);
      topN.forEach(g => {
        emitLog(callbacks, 'analyze', `  Gap: D${g.domain} "${g.topic}" [${g.difficulty}] — ${g.currentCount} question(s)`, 'warning');
      });
      if (topGaps.length > 3) {
        emitLog(callbacks, 'analyze', `  ...and ${topGaps.length - 3} more gaps`, 'info');
      }
    }

    addLogEntry(run.id, {
      phase: 'analyze',
      message: `Found ${topGaps.length} coverage gaps across ${coverage.totalQuestions} existing questions`,
      data: { domainCounts: coverage.domainCounts, difficultyCounts: coverage.difficultyCounts },
    });

    // Phase 2: Discover
    checkAbort(callbacks);
    callbacks.onPhaseChange('discover', `Connecting to ${aiConfig.provider}...`);
    emitLog(callbacks, 'discover', `Connecting to ${aiConfig.provider} (model: ${aiConfig.model})`, 'info');
    addLogEntry(run.id, { phase: 'discover', message: `Calling ${aiConfig.provider} (${aiConfig.model}) for question generation` });

    const existingQuestions = getAllQuestions();
    const sampleQuestions = existingQuestions.sort(() => Math.random() - 0.5).slice(0, 5);

    // Helper: AI call with heartbeat
    async function callAIWithHeartbeat(msgs: Message[], label: string) {
      let thinkingIdx = 0;
      let heartbeatCount = 0;
      const heartbeat = setInterval(() => {
        heartbeatCount++;
        const msg = AI_THINKING_MESSAGES[thinkingIdx % AI_THINKING_MESSAGES.length];
        thinkingIdx++;
        emitLog(callbacks, 'discover', msg, 'thinking');
        callbacks.onPhaseChange('discover', `${label} (${heartbeatCount * 5}s) — ${msg}`);
      }, 5000);
      try {
        return await chat(aiConfig, msgs);
      } finally {
        clearInterval(heartbeat);
      }
    }

    // === ATTEMPT 1: Full prompt ===
    const prompt = buildDiscoveryPrompt(strategy, topGaps, sampleQuestions);
    emitLog(callbacks, 'discover', `Built discovery prompt (${Math.round(prompt.length / 1024)}KB) with ${sampleQuestions.length} examples`, 'info');
    emitLog(callbacks, 'discover', `Strategy: ${strategy.type} — requesting ${strategy.questionCount} questions`, 'info');
    emitLog(callbacks, 'discover', `Attempt 1: Full prompt → ${aiConfig.provider}`, 'thinking');
    callbacks.onPhaseChange('discover', `AI generating ${strategy.questionCount} questions...`);

    const fullMessages: Message[] = [
      { role: 'system', content: AAISM_CONTEXT },
      { role: 'user', content: prompt },
    ];

    let response = await callAIWithHeartbeat(fullMessages, 'AI thinking...');
    let discovered: ParsedQuestion[] = [];

    if (response.error) {
      emitLog(callbacks, 'discover', `AI error: ${response.error}`, 'warning');
    } else {
      emitLog(callbacks, 'discover', `Response received (${response.content.length} chars)`, 'success');
      discovered = parseDiscoveredQuestions(response.content);
      emitLog(callbacks, 'discover', `Attempt 1 parsed ${discovered.length}/${strategy.questionCount} questions`, discovered.length > 0 ? 'success' : 'warning');
    }

    // === ATTEMPT 2: Simplified prompt (if attempt 1 got <50% of target) ===
    checkAbort(callbacks);
    if (discovered.length < Math.ceil(strategy.questionCount / 2)) {
      const remaining = strategy.questionCount - discovered.length;
      emitLog(callbacks, 'discover', `Attempt 2: Simplified prompt for ${remaining} questions (smaller models handle this better)`, 'thinking');
      callbacks.onPhaseChange('discover', `Retry with simplified prompt...`);

      const simplePrompt = buildSimplifiedPrompt(strategy, remaining);
      const simpleMessages: Message[] = [
        { role: 'system', content: 'You are an ISACA AAISM certification exam question writer. Return only valid JSON.' },
        { role: 'user', content: simplePrompt },
      ];

      const retryResponse = await callAIWithHeartbeat(simpleMessages, 'Retry thinking...');
      if (!retryResponse.error) {
        const retryParsed = parseDiscoveredQuestions(retryResponse.content);
        emitLog(callbacks, 'discover', `Attempt 2 parsed ${retryParsed.length} additional questions`, retryParsed.length > 0 ? 'success' : 'warning');
        discovered.push(...retryParsed);
      } else {
        emitLog(callbacks, 'discover', `Retry also failed: ${retryResponse.error}`, 'warning');
      }
    }

    // === ATTEMPT 3: Chunked 2-at-a-time (if still empty) ===
    checkAbort(callbacks);
    if (discovered.length === 0) {
      emitLog(callbacks, 'discover', `Attempt 3: Chunking into individual question requests`, 'thinking');
      callbacks.onPhaseChange('discover', `Chunked generation (1-2 questions per call)...`);

      const chunksNeeded = Math.min(strategy.questionCount, 4);
      for (let c = 0; c < chunksNeeded; c++) {
        checkAbort(callbacks);
        emitLog(callbacks, 'discover', `  Chunk ${c + 1}/${chunksNeeded}...`, 'thinking');
        const chunkMessages: Message[] = [
          { role: 'system', content: 'Return only valid JSON. No explanation, no markdown.' },
          { role: 'user', content: `Write 2 ISACA AAISM exam questions as a JSON array. Each needs: domain (1-4), question, options (["A) ...","B) ...","C) ...","D) ..."]), correctAnswer (0-3), explanation, difficulty, topic. JSON only:` },
        ];
        const chunkResp = await callAIWithHeartbeat(chunkMessages, `Chunk ${c + 1}/${chunksNeeded}`);
        if (!chunkResp.error) {
          const chunkParsed = parseDiscoveredQuestions(chunkResp.content);
          emitLog(callbacks, 'discover', `  Chunk ${c + 1}: got ${chunkParsed.length} questions`, chunkParsed.length > 0 ? 'success' : 'warning');
          discovered.push(...chunkParsed);
        }
      }
    }

    // === Final check ===
    if (discovered.length === 0) {
      emitLog(callbacks, 'discover', 'All attempts failed to produce valid questions', 'warning');
      if (aiConfig.provider === 'ollama') {
        emitLog(callbacks, 'discover', '-------', 'info');
        emitLog(callbacks, 'discover', 'TIP: Groq is FREE and much better at structured JSON', 'warning');
        emitLog(callbacks, 'discover', 'Get a free API key at https://console.groq.com', 'warning');
        emitLog(callbacks, 'discover', 'Then set provider to Groq in Dashboard → Settings', 'warning');
        emitLog(callbacks, 'discover', 'Alternatively, try: ollama pull llama3.1 (8B is much better than 3.2 3B)', 'warning');
      }
      if (response.content) {
        emitLog(callbacks, 'discover', `Last raw response: ${response.content.slice(0, 300)}...`, 'info');
      }
      throw new Error(
        `Could not parse valid questions after 3 attempts. ` +
        (aiConfig.provider === 'ollama'
          ? `Your model (${aiConfig.model}) may be too small for structured JSON. Try Groq (free) or a larger Ollama model.`
          : 'Try running again or switching models.')
      );
    }

    emitLog(callbacks, 'discover', `Total discovered: ${discovered.length} valid questions across all attempts`, 'success');
    discovered.forEach((q, i) => {
      emitLog(callbacks, 'discover', `  Q${i + 1}: [D${q.domain}/${q.difficulty}] ${q.question.slice(0, 80)}...`, 'info');
    });

    addLogEntry(run.id, {
      phase: 'discover',
      message: `AI generated ${discovered.length} raw questions`,
    });

    // Phase 3: Deduplicate
    checkAbort(callbacks);
    callbacks.onPhaseChange('deduplicate', `Deduplicating ${discovered.length} questions against ${existingQuestions.length} existing...`);
    emitLog(callbacks, 'deduplicate', `Running Jaccard bigram similarity against ${existingQuestions.length} existing questions`, 'info');
    addLogEntry(run.id, { phase: 'deduplicate', message: 'Running similarity analysis' });

    const allExisting = [...existingQuestions, ...getApprovedQuestions()];
    const deduped: Array<typeof discovered[number] & { similarityScore: number }> = [];
    for (let i = 0; i < discovered.length; i++) {
      const q = discovered[i];
      const sim = findMaxSimilarity(q.question, allExisting);
      deduped.push({ ...q, similarityScore: sim });
      const status = sim >= 60 ? 'DUPLICATE' : sim >= 30 ? 'similar' : 'unique';
      emitLog(callbacks, 'deduplicate', `  Q${i + 1}: similarity ${sim}% — ${status}`, sim >= 60 ? 'warning' : 'info');
    }

    const unique = deduped.filter(q => q.similarityScore < 60);
    const duplicates = deduped.filter(q => q.similarityScore >= 60);

    emitLog(callbacks, 'deduplicate', `Result: ${unique.length} unique, ${duplicates.length} duplicates filtered out`, 'success');

    addLogEntry(run.id, {
      phase: 'deduplicate',
      message: `${unique.length} unique questions, ${duplicates.length} too similar to existing`,
    });

    // Phase 4: Score
    checkAbort(callbacks);
    callbacks.onPhaseChange('score', `Scoring ${unique.length} unique questions...`);
    emitLog(callbacks, 'score', `Classifying ${unique.length} leads (auto-approve threshold: ${strategy.autoApproveThreshold}%)`, 'info');
    addLogEntry(run.id, { phase: 'score', message: 'Scoring and classifying leads' });

    const leads: QuestionLead[] = unique.map((q, i) => {
      const isAutoApprove = q.confidence >= strategy.autoApproveThreshold && q.similarityScore < 30;
      const status = isAutoApprove ? 'auto_approved' : 'pending_review';
      emitLog(callbacks, 'score',
        `  Q${i + 1}: confidence ${q.confidence}% / similarity ${q.similarityScore}% → ${status === 'auto_approved' ? 'AUTO-APPROVED' : 'pending review'}`,
        isAutoApprove ? 'success' : 'info'
      );

      return {
        id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        question: {
          id: q.id,
          domain: q.domain,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
        },
        status,
        confidence: q.confidence,
        similarityScore: q.similarityScore,
        source: run.id,
        discoveredAt: new Date().toISOString(),
        tags: [
          `domain-${q.domain}`,
          q.difficulty,
          strategy.type,
          ...(q.confidence >= 80 ? ['high-quality'] : []),
          ...(q.similarityScore < 15 ? ['highly-unique'] : []),
        ],
        reasoning: q.reasoning,
      } satisfies QuestionLead;
    });

    // Phase 5: Populate
    checkAbort(callbacks);
    callbacks.onPhaseChange('populate', `Adding ${leads.length} leads to pipeline...`);
    emitLog(callbacks, 'populate', `Writing ${leads.length} leads to pipeline store`, 'info');
    addLogEntry(run.id, { phase: 'populate', message: `Populating ${leads.length} leads` });

    const updatedState = addLeads(leads);

    const autoApproved = leads.filter(l => l.status === 'auto_approved').length;
    const pendingReview = leads.filter(l => l.status === 'pending_review').length;

    emitLog(callbacks, 'populate', `${autoApproved} auto-approved → added to question bank`, 'success');
    emitLog(callbacks, 'populate', `${pendingReview} pending your review`, 'info');
    emitLog(callbacks, 'populate', `Total in pipeline: ${updatedState.leads.length} leads`, 'success');

    addLogEntry(run.id, {
      phase: 'populate',
      message: `Pipeline updated: ${autoApproved} auto-approved, ${pendingReview} pending review`,
      data: { autoApproved, pendingReview, totalInPipeline: updatedState.leads.length },
    });

    // Finalize
    emitLog(callbacks, 'populate', 'Agent run completed successfully', 'success');

    const completedRun: Partial<AgentRun> = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      leadsFound: leads.length,
      leadsApproved: autoApproved,
    };
    updateRun(run.id, completedRun);

    callbacks.onLeadsFound(leads);
    callbacks.onComplete({ ...run, ...completedRun } as AgentRun);

    return { ...run, ...completedRun } as AgentRun;
  } catch (error) {
    if (error instanceof AgentAbortError) {
      emitLog(callbacks, 'populate', 'Agent stopped by user', 'warning');
      updateRun(run.id, { status: 'failed', completedAt: new Date().toISOString(), error: 'Stopped by user' });
      addLogEntry(run.id, { phase: 'populate', message: 'Agent stopped by user' });
      callbacks.onComplete({ ...run, status: 'failed', completedAt: new Date().toISOString(), leadsFound: 0, leadsApproved: 0 } as AgentRun);
      return { ...run, status: 'failed', error: 'Stopped by user' };
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    emitLog(callbacks, 'error', `Agent failed: ${errMsg}`, 'warning');
    updateRun(run.id, { status: 'failed', completedAt: new Date().toISOString(), error: errMsg });
    addLogEntry(run.id, { phase: 'discover', message: `Agent failed: ${errMsg}` });
    callbacks.onError(errMsg);
    return { ...run, status: 'failed', error: errMsg };
  }
}

// ============ PRESET STRATEGIES ============

export const PRESET_STRATEGIES: Array<{ name: string; description: string; strategy: DiscoveryStrategy }> = [
  {
    name: 'Smart Gap Fill',
    description: 'Finds coverage gaps in your question bank and generates questions to fill them',
    strategy: { type: 'gap_fill', questionCount: 10, autoApproveThreshold: 85 },
  },
  {
    name: 'Hard Questions Blitz',
    description: 'Generates challenging questions that test deep understanding and synthesis',
    strategy: { type: 'difficulty_balance', targetDifficulty: 'hard', questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Scenario Builder',
    description: 'Creates realistic workplace scenarios matching ISACA exam patterns',
    strategy: { type: 'scenario_based', questionCount: 6, autoApproveThreshold: 75 },
  },
  {
    name: 'Cross-Domain Mixer',
    description: 'Generates questions spanning multiple domains to test integrated knowledge',
    strategy: { type: 'cross_domain', questionCount: 6, autoApproveThreshold: 80 },
  },
  {
    name: 'Domain 1 Deep Dive',
    description: 'Deep dive into AI Governance — policies, ethics, compliance',
    strategy: { type: 'topic_deep_dive', targetDomain: 1, questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Domain 2 Deep Dive',
    description: 'Deep dive into AI Risk — threats, controls, OWASP, MITRE ATLAS',
    strategy: { type: 'topic_deep_dive', targetDomain: 2, questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Domain 3 Deep Dive',
    description: 'Deep dive into AI Technologies — CRISP-DM, MLOps, deployment, testing',
    strategy: { type: 'topic_deep_dive', targetDomain: 3, questionCount: 8, autoApproveThreshold: 80 },
  },
  {
    name: 'Full Sweep',
    description: 'Comprehensive sweep across all domains, topics, and difficulties',
    strategy: { type: 'full_sweep', questionCount: 15, autoApproveThreshold: 85 },
  },
  {
    name: 'Community Pattern Match',
    description: 'Generates BEST/MOST/FIRST/PRIMARY/NOT questions using community-sourced exam patterns',
    strategy: { type: 'community_pattern', questionCount: 10, autoApproveThreshold: 80 },
  },
  {
    name: 'Trap Buster',
    description: 'Questions targeting known exam traps — practice the pitfalls before the real exam',
    strategy: { type: 'trap_buster', questionCount: 8, autoApproveThreshold: 75 },
  },
  {
    name: 'Forum Hot Topics',
    description: 'Questions on the most frequently reported exam topics from Reddit, LinkedIn, and YouTube',
    strategy: { type: 'forum_hot_topics', questionCount: 10, autoApproveThreshold: 80 },
  },
];

// ============ PIPELINE STATS ============

export function getPipelineStats() {
  const state = loadPipelineState();
  const coverage = analyzeCoverage();

  const pendingCount = state.leads.filter(l => l.status === 'pending_review' || l.status === 'discovered').length;
  const approvedCount = state.leads.filter(l => l.status === 'approved' || l.status === 'auto_approved').length;
  const rejectedCount = state.leads.filter(l => l.status === 'rejected').length;

  const avgConfidence = state.leads.length > 0
    ? Math.round(state.leads.reduce((sum, l) => sum + l.confidence, 0) / state.leads.length)
    : 0;

  const domainDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  state.leads.forEach(l => {
    domainDistribution[l.question.domain] = (domainDistribution[l.question.domain] || 0) + 1;
  });

  return {
    totalLeads: state.leads.length,
    pendingCount,
    approvedCount,
    rejectedCount,
    avgConfidence,
    totalRuns: state.runs.length,
    lastRunAt: state.lastRunAt,
    domainDistribution,
    coverageGaps: coverage.gaps.filter(g => g.priority === 'high').length,
    totalQuestions: coverage.totalQuestions,
    approvedQuestions: state.approvedQuestions.length,
  };
}
