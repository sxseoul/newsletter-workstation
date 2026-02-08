export interface NewsItem {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
  source?: string;
}

export interface NewsInsight {
  newsId: string;
  insight: string;
  updatedAt: Date;
}

export interface SelectedNews {
  id: string;
  news: NewsItem;
  category: string;
  color: string;
}

export interface SearchResponse {
  results: NewsItem[];
  query: string;
  searchedAt: string;
}

export interface KeywordCategory {
  id: string;
  name: string;
  keywords: string[];
  color: string;
}

export const DEFAULT_CATEGORIES: KeywordCategory[] = [
  {
    id: 'ai-regulation',
    name: 'AI Regulation',
    keywords: ['AI Regulation', 'AI governance', 'AI policy'],
    color: 'blue',
  },
  {
    id: 'eu-ai-act',
    name: 'EU AI Act',
    keywords: ['EU AI Act', 'European AI regulation', 'AI Act compliance'],
    color: 'indigo',
  },
  {
    id: 'copyright',
    name: 'Copyright & AI',
    keywords: ['Copyright in AI training', 'AI copyright', 'generative AI copyright'],
    color: 'purple',
  },
  {
    id: 'tech-law',
    name: 'Tech Law',
    keywords: ['Tech law', 'technology regulation', 'digital law'],
    color: 'emerald',
  },
];
