export type ContentFormatId =
  | 'linkedin'
  | 'twitter-thread'
  | 'youtube-outline'
  | 'youtube-shorts'
  | 'github-readme'
  | 'blog-intro'
  | 'exam-carousel';

export interface ContentTemplate {
  id: ContentFormatId;
  label: string;
  shortLabel: string;
  description: string;
  platform: string;
  maxLength?: number;
  publishChecklist: string[];
  systemHint: string;
  promptTemplate: string;
  staticFallback: string;
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    shortLabel: 'LinkedIn',
    description: 'Professional post for practitioners and hiring managers (≤1300 chars)',
    platform: 'LinkedIn',
    maxLength: 1300,
    publishChecklist: [
      'Add 3–5 relevant hashtags (#AAISM #AISecurity #ResponsibleAI)',
      'Tag ISACA or relevant communities if appropriate',
      'Post during weekday morning in your timezone',
      'Reply to early comments within 2 hours for reach',
    ],
    systemHint: 'Write a polished LinkedIn post. No markdown headers. Use short paragraphs and 1–2 emoji max.',
    promptTemplate: `Create a LinkedIn post (max 1300 characters) about:

Topic: {{topic}}
Domain: AAISM Domain {{domain}} — {{domainName}}
Context:
{{context}}

Include: hook line, 2–3 insight bullets, practical takeaway, soft CTA to study or share. Professional tone.`,
    staticFallback: `🛡️ AAISM insight: {{topic}}

Domain {{domain}} ({{domainName}}) keeps showing up in exam prep and real deployments.

Key takeaway: {{context}}

What's your team's approach to AI security governance? Drop a comment — studying for AAISM? This topic is high-yield.

#AAISM #AISecurity #ResponsibleAI`,
  },
  {
    id: 'twitter-thread',
    label: 'Twitter/X Thread',
    shortLabel: 'Thread',
    description: '5–7 tweet thread with hooks and exam-ready tips',
    platform: 'X (Twitter)',
    publishChecklist: [
      'Tweet 1 must stand alone as a hook',
      'Number tweets 1/7, 2/7, etc.',
      'Add one diagram or cheat-sheet image to tweet 2 or 3',
      'Quote-tweet your thread after 24h with a bonus tip',
    ],
    systemHint: 'Output exactly 5–7 tweets. Label each "1/7", "2/7", etc. Each tweet under 280 characters.',
    promptTemplate: `Write a 5–7 tweet thread about:

Topic: {{topic}}
Domain: D{{domain}} — {{domainName}}
Context:
{{context}}

Tweet 1 = hook. Middle tweets = frameworks, risks, controls. Final tweet = CTA + hashtags.`,
    staticFallback: `1/7 🧵 {{topic}} — AAISM Domain {{domain}} thread

2/7 Context: {{context}}

3/7 Framework lens: NIST AI RMF + ISO/IEC 42001 map directly to governance controls.

4/7 Exam trap: "Most important FIRST step" → policy & risk assessment before tooling.

5/7 Practitioner move: document model inventory + data lineage before production.

6/7 Study tip: drill "best/most/first" pattern questions for this domain.

7/7 Preparing for AAISM? Save this thread. #AAISM #AISecurity`,
  },
  {
    id: 'youtube-outline',
    label: 'YouTube Session Outline',
    shortLabel: 'YouTube',
    description: '10-minute study session outline with timestamps',
    platform: 'YouTube',
    publishChecklist: [
      'Record in 1080p with chapter markers matching timestamps',
      'Upload custom thumbnail with domain badge (D1–D4)',
      'Add links to NIST AI RMF and ISACA in description',
      'Pin a comment with quiz link or study app URL',
    ],
    systemHint: 'Structured markdown outline with timestamps (0:00 format), talking points, and B-roll suggestions.',
    promptTemplate: `Create a 10-minute YouTube study session outline for:

Title topic: {{topic}}
Domain: D{{domain}} — {{domainName}}
Context:
{{context}}

Include: title options, hook (0:00–0:45), 4–5 chapters with timestamps, recap, and description blurb.`,
    staticFallback: `# {{topic}} — AAISM Domain {{domain}} (10 min)

## Title options
- "{{topic}} Explained for AAISM Domain {{domain}}"
- "Pass AAISM: {{topic}} in 10 Minutes"

## Outline
- **0:00** Hook — why {{topic}} matters on the exam
- **1:30** Definitions & scope ({{domainName}})
- **3:00** Framework mapping (NIST AI RMF, EU AI Act)
- **5:30** Risks & controls — {{context}}
- **7:30** Sample exam question walkthrough
- **9:00** Recap + 3 flashcard prompts

## Description
Study guide for AAISM candidates covering {{topic}}. Domain {{domain}} focus.`,
  },
  {
    id: 'youtube-shorts',
    label: 'YouTube Shorts Script',
    shortLabel: 'Shorts',
    description: '60-second vertical video script',
    platform: 'YouTube Shorts',
    publishChecklist: [
      'Vertical 9:16, captions burned in',
      'Hook in first 2 seconds',
      'End with "Follow for AAISM tips"',
      'Use #Shorts #AAISM in description',
    ],
    systemHint: '60-second spoken script. Label [VISUAL] cues. Punchy sentences. Under 150 words.',
    promptTemplate: `Write a 60-second YouTube Shorts script about:

Topic: {{topic}}
Domain: D{{domain}}
Context: {{context}}

Format: HOOK (2s) → 3 rapid insights → exam tip → CTA. Include [VISUAL] cues.`,
    staticFallback: `[VISUAL: Text overlay "{{topic}}"]
HOOK: "AAISM examiners love this Domain {{domain}} topic."

[VISUAL: Bullet animations]
Insight 1: {{context}}
Insight 2: Map to NIST AI RMF Govern + Map functions.
Insight 3: Risk-based thinking beats tool-first answers.

[VISUAL: "FIRST step?" flash card]
Exam tip: Policy and inventory before deployment.

CTA: Follow for daily AAISM Shorts.`,
  },
  {
    id: 'github-readme',
    label: 'GitHub README Section',
    shortLabel: 'GitHub',
    description: 'README section for an AAISM study or security project',
    platform: 'GitHub',
    publishChecklist: [
      'Add badges (license, AAISM domain, build status)',
      'Link to official ISACA AAISM page',
      'Include "Contributing" and "Security" sections',
      'Add table of contents if README exceeds 100 lines',
    ],
    systemHint: 'Markdown README section. Use headers, bullet lists, and a compliance/framework table.',
    promptTemplate: `Write a GitHub README section (markdown) for a project about:

Topic: {{topic}}
Domain: D{{domain}} — {{domainName}}
Context:
{{context}}

Include: overview, features list, framework alignment table, and getting started steps.`,
    staticFallback: `## {{topic}}

> AAISM Domain {{domain}} — {{domainName}}

### Overview
{{context}}

### Features
- Domain {{domain}} study notes and flashcards
- Framework crosswalk (NIST AI RMF, ISO/IEC 42001, OWASP LLM Top 10)
- Practice questions with explanations

### Framework alignment
| Framework | Relevance |
|-----------|-----------|
| NIST AI RMF | Govern, Map, Measure, Manage |
| EU AI Act | Risk classification & documentation |

### Getting started
\`\`\`bash
git clone <repo>
npm install && npm run dev
\`\`\``,
  },
  {
    id: 'blog-intro',
    label: 'Blog Post Intro',
    shortLabel: 'Blog',
    description: 'Opening section for a technical blog article',
    platform: 'Blog / Newsletter',
    publishChecklist: [
      'Set meta description (155 chars)',
      'Add hero image with alt text',
      'Internal link to related domain guide',
      'End intro with "In this post, you\'ll learn…" bullet list',
    ],
    systemHint: 'Blog intro in markdown. Engaging lede, problem statement, and preview bullets.',
    promptTemplate: `Write a blog post introduction (300–400 words) about:

Topic: {{topic}}
Domain: D{{domain}} — {{domainName}}
Context:
{{context}}

Include: narrative hook, why practitioners care, and "In this article" preview list.`,
    staticFallback: `# {{topic}}: What AAISM Candidates Need to Know

Enterprise AI adoption has outpaced security governance — and certification bodies noticed. **{{topic}}** sits squarely in **Domain {{domain}} ({{domainName}})**, one of the highest-weight areas on the AAISM exam.

{{context}}

In this article, you'll learn:
- How exam questions frame {{topic}}
- Which frameworks (NIST AI RMF, EU AI Act) apply
- Practical controls you can implement this quarter`,
  },
  {
    id: 'exam-carousel',
    label: 'Exam Tip Carousel',
    shortLabel: 'Carousel',
    description: '5-slide text carousel for LinkedIn/Instagram',
    platform: 'LinkedIn / Instagram Carousel',
    publishChecklist: [
      'Export slides as 1080×1080 PNG',
      'Slide 1 = bold title, Slide 5 = CTA',
      'Keep ≤40 words per slide',
      'Upload as PDF carousel on LinkedIn for better reach',
    ],
    systemHint: 'Output exactly 5 slides labeled "Slide 1" through "Slide 5". Short punchy text per slide.',
    promptTemplate: `Create 5 carousel slides (text only) about:

Topic: {{topic}}
Domain: D{{domain}} — {{domainName}}
Context:
{{context}}

Slide 1 = title hook. Slides 2–4 = tips. Slide 5 = CTA + hashtags.`,
    staticFallback: `Slide 1: {{topic}}
AAISM Domain {{domain}} — must-know

Slide 2: Definition
{{context}}

Slide 3: Exam trap
"Best FIRST step" → governance & risk assessment

Slide 4: Framework
NIST AI RMF · ISO/IEC 42001 · OWASP LLM

Slide 5: Save & share
Studying for AAISM? Follow for daily carousels.
#AAISM #AISecurity`,
  },
];

export const BATCH_FORMAT_IDS: ContentFormatId[] = [
  'linkedin',
  'youtube-shorts',
  'twitter-thread',
  'github-readme',
];

export function getContentTemplate(id: ContentFormatId): ContentTemplate {
  const template = CONTENT_TEMPLATES.find(t => t.id === id);
  if (!template) throw new Error(`Unknown content format: ${id}`);
  return template;
}

export function fillTemplatePlaceholders(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}
