export interface NewsSource {
  id: string;
  domain: string;
  name: string;
}

export const DEFAULT_SOURCES: NewsSource[] = [
  { id: 'reuters', domain: 'reuters.com', name: 'Reuters' },
  { id: 'nytimes', domain: 'nytimes.com', name: 'New York Times' },
  { id: 'ft', domain: 'ft.com', name: 'Financial Times' },
  { id: 'wsj', domain: 'wsj.com', name: 'Wall Street Journal' },
  { id: 'techcrunch', domain: 'techcrunch.com', name: 'TechCrunch' },
  { id: 'theguardian', domain: 'theguardian.com', name: 'The Guardian' },
  { id: 'politico', domain: 'politico.com', name: 'Politico' },
  { id: 'bbc', domain: 'bbc.com', name: 'BBC' },
  { id: 'bloomberg', domain: 'bloomberg.com', name: 'Bloomberg' },
  { id: 'wired', domain: 'wired.com', name: 'Wired' },
  { id: 'arstechnica', domain: 'arstechnica.com', name: 'Ars Technica' },
  { id: 'theverge', domain: 'theverge.com', name: 'The Verge' },
];

const STORAGE_KEY = 'news-intel-sources';

export function loadSources(): NewsSource[] {
  if (typeof window === 'undefined') return DEFAULT_SOURCES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SOURCES;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SOURCES;
  } catch {
    return DEFAULT_SOURCES;
  }
}

export function saveSources(sources: NewsSource[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
}

export function addSource(sources: NewsSource[], domain: string): NewsSource[] {
  const trimmed = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (!trimmed) return sources;
  if (sources.some((s) => s.domain === trimmed)) return sources;
  const newSource: NewsSource = {
    id: `source-${Date.now()}`,
    domain: trimmed,
    name: trimmed.replace(/\.com$|\.org$|\.net$|\.co$|\.io$/, ''),
  };
  return [...sources, newSource];
}

export function deleteSource(sources: NewsSource[], id: string): NewsSource[] {
  return sources.filter((s) => s.id !== id);
}
