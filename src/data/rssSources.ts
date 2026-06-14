export type RssSourceCategory = 'threat' | 'governance' | 'exam' | 'community' | 'framework';

export interface RssSource {
  id: string;
  name: string;
  url: string;
  homepage: string;
  category: RssSourceCategory;
}

/** Curated security / AI governance feeds relevant to AAISM exam prep. */
export const RSS_SOURCES: RssSource[] = [
  {
    id: 'nist-ai',
    name: 'NIST AI',
    url: 'https://www.nist.gov/news-events/artificial-intelligence/rss.xml',
    homepage: 'https://www.nist.gov/artificial-intelligence',
    category: 'framework',
  },
  {
    id: 'nist-cyber',
    name: 'NIST Cyber',
    url: 'https://www.nist.gov/news-events/cybersecurity/rss.xml',
    homepage: 'https://www.nist.gov/cybersecurity',
    category: 'framework',
  },
  {
    id: 'cisa',
    name: 'CISA',
    url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    homepage: 'https://www.cisa.gov',
    category: 'threat',
  },
  {
    id: 'krebs',
    name: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
    homepage: 'https://krebsonsecurity.com',
    category: 'threat',
  },
  {
    id: 'schneier',
    name: 'Schneier on Security',
    url: 'https://www.schneier.com/feed/atom/',
    homepage: 'https://www.schneier.com',
    category: 'governance',
  },
  {
    id: 'thn',
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    homepage: 'https://thehackernews.com',
    category: 'community',
  },
  {
    id: 'darkreading',
    name: 'Dark Reading',
    url: 'https://www.darkreading.com/rss.xml',
    homepage: 'https://www.darkreading.com',
    category: 'exam',
  },
  {
    id: 'securityweek',
    name: 'SecurityWeek',
    url: 'https://www.securityweek.com/feed/',
    homepage: 'https://www.securityweek.com',
    category: 'threat',
  },
  {
    id: 'arxiv-cscr',
    name: 'arXiv cs.CR',
    url: 'https://export.arxiv.org/rss/cs.CR',
    homepage: 'https://arxiv.org/list/cs.CR/recent',
    category: 'framework',
  },
];
