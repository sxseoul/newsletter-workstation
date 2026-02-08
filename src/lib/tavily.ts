import { NewsItem } from '@/types';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
}

export async function searchNews(
  query: string,
  apiKey: string,
  includeDomains?: string[]
): Promise<NewsItem[]> {
  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: 'advanced',
      include_domains: includeDomains ?? [],
      exclude_domains: [],
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
      topic: 'news',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily API error: ${error}`);
  }

  const data: TavilyResponse = await response.json();

  return data.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
    publishedDate: result.published_date,
    source: extractDomain(result.url),
  }));
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

export async function searchMultipleKeywords(
  keywords: string[],
  apiKey: string,
  includeDomains?: string[]
): Promise<Map<string, NewsItem[]>> {
  const results = new Map<string, NewsItem[]>();

  await Promise.all(
    keywords.map(async (keyword) => {
      try {
        const news = await searchNews(keyword, apiKey, includeDomains);
        results.set(keyword, news);
      } catch (error) {
        console.error(`Error searching for "${keyword}":`, error);
        results.set(keyword, []);
      }
    })
  );

  return results;
}
