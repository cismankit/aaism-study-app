/**
 * Career intel service — company profiles, job analysis, people map via LLM.
 * Public pasted data only — no LinkedIn scraping or private profile access.
 */

import { chat, loadAIConfig } from './aiService';
import { buildCertTrainingContext, getActiveCertification } from './certContextService';
import { getOpsAgent } from './opsAgentService';
import {
  CAREER_STORAGE_KEY,
  CAREER_ETHICS_BANNER,
  inferTechTags,
  type CompanyProfile,
  type JobAnalysis,
  type PeopleMapResult,
  type TechStackTag,
} from '../data/careerIntel';

function readProfiles(): CompanyProfile[] {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    return raw ? JSON.parse(raw) as CompanyProfile[] : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: CompanyProfile[]): void {
  try {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save career profiles:', e);
  }
}

export function getSavedCompanyProfiles(): CompanyProfile[] {
  return readProfiles();
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  const existing = readProfiles();
  const idx = existing.findIndex(p => p.id === profile.id);
  if (idx >= 0) existing[idx] = profile;
  else existing.unshift(profile);
  writeProfiles(existing);
}

export function deleteCompanyProfile(id: string): void {
  writeProfiles(readProfiles().filter(p => p.id !== id));
}

async function fetchJobTextFromUrl(url: string): Promise<string | null> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);
  } catch {
    return null;
  }
}

function parseJsonBlock<T>(raw: string): T | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

function mergeTechTags(parsed: TechStackTag[] | undefined, text: string): TechStackTag[] {
  const inferred = inferTechTags(text);
  const fromParsed = parsed ?? [];
  const seen = new Set<string>();
  return [...fromParsed, ...inferred].filter(t => {
    const key = `${t.category}:${t.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildCompanyProfile(input: {
  companyName: string;
  careersUrl?: string;
  jobPostingText?: string;
  jobPostingUrl?: string;
}): Promise<CompanyProfile> {
  const cert = getActiveCertification();
  const certContext = buildCertTrainingContext(cert);
  let jobText = input.jobPostingText?.trim() ?? '';

  if (!jobText && input.jobPostingUrl) {
    const fetched = await fetchJobTextFromUrl(input.jobPostingUrl);
    if (fetched) jobText = fetched;
  }

  const agent = getOpsAgent('claude-analyst');
  const config = loadAIConfig();
  const response = await chat(config, [
    {
      role: 'system',
      content: `${agent.systemPrompt}\n\n${certContext}\n\n${CAREER_ETHICS_BANNER}\n\nAnalyze ONLY the pasted public data. Return JSON: { techStack: [{category, label}], hiringThemes: string[], openRolesSummary: string, seniorityMix: string, certAlignment: [{cert, relevance, matchScore}], cultureSignals: string[] }`,
    },
    {
      role: 'user',
      content: [
        `Company: ${input.companyName}`,
        input.careersUrl ? `Careers page (user-provided): ${input.careersUrl}` : '',
        jobText ? `Job posting text:\n${jobText.slice(0, 6000)}` : 'No job posting pasted — infer from company name only (note limitations).',
        `Active cert for alignment: ${cert.shortName}`,
      ].filter(Boolean).join('\n\n'),
    },
  ], { jsonMode: true, temperature: 0.35 });

  const now = new Date().toISOString();
  const parsed = response.error ? null : parseJsonBlock<{
    techStack?: TechStackTag[];
    hiringThemes?: string[];
    openRolesSummary?: string;
    seniorityMix?: string;
    certAlignment?: CompanyProfile['certAlignment'];
    cultureSignals?: string[];
  }>(response.content);

  const combinedText = `${input.companyName} ${jobText}`;
  return {
    id: crypto.randomUUID(),
    companyName: input.companyName,
    careersUrl: input.careersUrl,
    createdAt: now,
    updatedAt: now,
    techStack: mergeTechTags(parsed?.techStack, combinedText),
    hiringThemes: parsed?.hiringThemes ?? ['Security engineering', 'Cloud infrastructure'],
    openRolesSummary: parsed?.openRolesSummary ?? 'Paste job postings for detailed role analysis.',
    seniorityMix: parsed?.seniorityMix ?? 'Unknown — add posting text',
    certAlignment: parsed?.certAlignment ?? [{ cert: cert.shortName, relevance: 'General security alignment', matchScore: 60 }],
    cultureSignals: parsed?.cultureSignals ?? [],
    rawNotes: jobText.slice(0, 500) || undefined,
  };
}

export async function analyzeJobPosting(input: {
  title?: string;
  jobText?: string;
  jobUrl?: string;
}): Promise<JobAnalysis> {
  const cert = getActiveCertification();
  let text = input.jobText?.trim() ?? '';

  if (!text && input.jobUrl) {
    const fetched = await fetchJobTextFromUrl(input.jobUrl);
    if (fetched) text = fetched;
  }

  if (!text) {
    throw new Error('Paste job description text or provide a URL we can fetch.');
  }

  const agent = getOpsAgent('hermes');
  const config = loadAIConfig();
  const response = await chat(config, [
    {
      role: 'system',
      content: `${agent.systemPrompt}\n\n${buildCertTrainingContext(cert)}\n\n${CAREER_ETHICS_BANNER}\n\nReturn JSON: { requiredSkills: string[], niceToHaveSkills: string[], techStack: [{category, label}], teamHints: string[], interviewPrep: string[], certTieIns: string[], questionsForHumans: string[], seniorityLevel: string, title: string }`,
    },
    { role: 'user', content: `Analyze this job posting:\n${text.slice(0, 7000)}` },
  ], { jsonMode: true, temperature: 0.3 });

  const parsed = response.error ? null : parseJsonBlock<Omit<JobAnalysis, 'id' | 'analyzedAt'>>(response.content);

  return {
    id: crypto.randomUUID(),
    title: parsed?.title ?? input.title ?? 'Job posting',
    analyzedAt: new Date().toISOString(),
    requiredSkills: parsed?.requiredSkills ?? inferTechTags(text).map(t => t.label).slice(0, 8),
    niceToHaveSkills: parsed?.niceToHaveSkills ?? [],
    techStack: mergeTechTags(parsed?.techStack, text),
    teamHints: parsed?.teamHints ?? [],
    interviewPrep: parsed?.interviewPrep ?? [`Review ${cert.shortName} domain concepts matching required skills`],
    certTieIns: parsed?.certTieIns ?? [`Map ${cert.shortName} domains to role requirements`],
    questionsForHumans: parsed?.questionsForHumans ?? [
      'What does a typical week look like for this team?',
      'How does security integrate with product delivery here?',
    ],
    seniorityLevel: parsed?.seniorityLevel ?? 'Mid-level',
  };
}

export async function buildPeopleMap(input: {
  companyName: string;
  roleTitle: string;
  profileUrls?: string;
}): Promise<PeopleMapResult> {
  const cert = getActiveCertification();
  const agent = getOpsAgent('openclaw');
  const config = loadAIConfig();

  const response = await chat(config, [
    {
      role: 'system',
      content: `${agent.systemPrompt}\n\n${buildCertTrainingContext(cert)}\n\n${CAREER_ETHICS_BANNER}\n\nDo NOT scrape LinkedIn. Use role archetypes and public OSINT guidance only. Return JSON: { orgHypothesis: string[], contactsToReach: [{role, why, priority}], outreachDraft: string, publicFootprintTips: string[] }`,
    },
    {
      role: 'user',
      content: [
        `Company: ${input.companyName}`,
        `Target role: ${input.roleTitle}`,
        input.profileUrls ? `User-provided public URLs (manual paste only):\n${input.profileUrls}` : 'No profile URLs provided.',
        `User cert interest: ${cert.shortName}`,
        'Suggest who to talk to (peer IC, hiring manager archetype, recruiter) and a human outreach draft.',
      ].join('\n\n'),
    },
  ], { jsonMode: true, temperature: 0.4 });

  const parsed = response.error ? null : parseJsonBlock<{
    orgHypothesis?: string[];
    contactsToReach?: PeopleMapResult['contactsToReach'];
    outreachDraft?: string;
    publicFootprintTips?: string[];
  }>(response.content);

  return {
    id: crypto.randomUUID(),
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    createdAt: new Date().toISOString(),
    orgHypothesis: parsed?.orgHypothesis ?? [
      'CISO / VP Security → Director → Manager → Senior IC → IC',
      'Recruiting often sits parallel to hiring manager chain',
    ],
    contactsToReach: parsed?.contactsToReach ?? [
      { role: 'Peer IC in same team', why: 'Insider view of day-to-day work', priority: 'high' },
      { role: 'Hiring manager archetype', why: 'Validates fit and team needs', priority: 'high' },
      { role: 'Technical recruiter', why: 'Process and timeline clarity', priority: 'medium' },
    ],
    outreachDraft: parsed?.outreachDraft ??
      `Hi — I'm studying for ${cert.shortName} and researching ${input.companyName}'s ${input.roleTitle} team. ` +
      `I'd value 15 minutes to learn how your team approaches security — happy to share relevant cert insights in return.`,
    publicFootprintTips: parsed?.publicFootprintTips ?? [
      'Search conference talk videos (YouTube, RSA, BSides)',
      'Check GitHub org repos and contributor profiles',
      'Look for blog posts on company engineering blog',
      'Find podcast appearances — great conversation starters',
    ],
    ethicsNote: CAREER_ETHICS_BANNER,
  };
}
