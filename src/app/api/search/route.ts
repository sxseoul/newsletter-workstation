import { NextResponse } from 'next/server';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate: string;
  source: string;
  category: string;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

// Mock data for demo mode
const MOCK_DATA: SearchResult[] = [
  {
    title: 'EU AI Act Enters Full Enforcement Phase in 2026',
    url: 'https://reuters.com/technology/eu-ai-act-enforcement-2026',
    content: 'The European Union\'s landmark AI Act has entered its full enforcement phase, requiring companies to conduct comprehensive risk assessments for high-risk AI systems. Legal experts predict a wave of compliance activities across the tech industry.',
    score: 0.98,
    publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Reuters',
    category: 'AI Law',
  },
  {
    title: 'White House Unveils Comprehensive AI Safety Framework',
    url: 'https://nytimes.com/2026/ai-safety-framework',
    content: 'The Biden administration has released a sweeping AI safety framework that establishes mandatory reporting requirements for AI incidents and creates new oversight mechanisms for frontier AI models.',
    score: 0.96,
    publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'New York Times',
    category: 'AI Law',
  },
  {
    title: 'FTC Proposes Strict Algorithmic Transparency Rules',
    url: 'https://techcrunch.com/ftc-algorithmic-transparency',
    content: 'The Federal Trade Commission has proposed new rules requiring companies to disclose how their algorithms make decisions affecting consumers. The proposal would mandate regular algorithmic audits and public reporting.',
    score: 0.94,
    publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'TechCrunch',
    category: 'Tech Regulation',
  },
  {
    title: 'Supreme Court to Hear Landmark AI Copyright Case',
    url: 'https://lawfare.com/supreme-court-ai-copyright',
    content: 'The Supreme Court has agreed to hear a pivotal case that could determine whether AI-generated content can be copyrighted and establish precedents for training data liability.',
    score: 0.93,
    publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Lawfare',
    category: 'AI Law',
  },
  {
    title: 'China Implements New Cross-Border Data Transfer Regulations',
    url: 'https://ft.com/china-data-regulations',
    content: 'China\'s Cyberspace Administration has implemented stringent new regulations governing cross-border data transfers, requiring tech companies to undergo security assessments before transferring data overseas.',
    score: 0.91,
    publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Financial Times',
    category: 'Tech Regulation',
  },
  {
    title: 'UK Digital Markets Act: First Enforcement Actions Announced',
    url: 'https://theguardian.com/uk-digital-markets-act',
    content: 'The UK Competition and Markets Authority has announced its first enforcement actions under the Digital Markets Act, targeting major platform companies for alleged anti-competitive practices.',
    score: 0.89,
    publishedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'The Guardian',
    category: 'Tech Regulation',
  },
  {
    title: 'OpenAI Reaches Settlement in Training Data Lawsuit',
    url: 'https://wsj.com/openai-settlement',
    content: 'OpenAI has reached a confidential settlement with several content creators in a lawsuit alleging unauthorized use of copyrighted materials for AI training, potentially setting new industry standards.',
    score: 0.88,
    publishedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Wall Street Journal',
    category: 'AI Law',
  },
  {
    title: 'Japan Establishes AI Governance Council',
    url: 'https://nikkei.com/japan-ai-governance',
    content: 'Japan has established a new AI Governance Council bringing together industry leaders, academics, and policymakers to develop comprehensive AI regulations while maintaining innovation-friendly policies.',
    score: 0.86,
    publishedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Nikkei Asia',
    category: 'AI Law',
  },
  {
    title: 'US Senate Passes Comprehensive Data Privacy Bill',
    url: 'https://politico.com/us-data-privacy-bill',
    content: 'The US Senate has passed a landmark federal data privacy bill establishing nationwide standards for data collection, storage, and sharing, preempting the current patchwork of state laws.',
    score: 0.84,
    publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Politico',
    category: 'Tech Regulation',
  },
  {
    title: 'EU Commission Opens Investigation into AI Chatbot Market',
    url: 'https://euractiv.com/eu-chatbot-investigation',
    content: 'The European Commission has opened a formal investigation into the AI chatbot market, examining potential antitrust concerns related to market concentration and data access advantages.',
    score: 0.82,
    publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'Euractiv',
    category: 'Tech Regulation',
  },
];

async function fetchFromTavily(query: string, apiKey: string): Promise<SearchResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      include_domains: [
        'reuters.com',
        'nytimes.com',
        'ft.com',
        'wsj.com',
        'techcrunch.com',
        'theguardian.com',
        'politico.com',
        'lawfare.com',
        'euractiv.com',
      ],
      max_results: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }

  const data = await response.json();
  const category = query.includes('AI') ? 'AI Law' : 'Tech Regulation';

  return data.results.map((result: TavilyResult) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
    publishedDate: result.published_date || new Date().toISOString(),
    source: new URL(result.url).hostname.replace('www.', ''),
    category,
  }));
}

export async function GET() {
  const apiKey = process.env.TAVILY_API_KEY;

  // Demo mode: return mock data when API key is not configured
  if (!apiKey) {
    return NextResponse.json({
      results: MOCK_DATA,
      searchedAt: new Date().toISOString(),
      isDemo: true,
      queries: ['AI Law', 'Tech Regulation'],
    });
  }

  try {
    const queries = ['AI Law news 2026', 'Tech Regulation news 2026'];
    const allResults: SearchResult[] = [];

    const searchPromises = queries.map((query) => fetchFromTavily(query, apiKey));
    const searchResults = await Promise.all(searchPromises);

    searchResults.forEach((results) => {
      allResults.push(...results);
    });

    // Sort by score and remove duplicates
    const uniqueResults = allResults
      .filter((result, index, self) =>
        index === self.findIndex((r) => r.url === result.url)
      )
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      results: uniqueResults,
      searchedAt: new Date().toISOString(),
      isDemo: false,
      queries,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
