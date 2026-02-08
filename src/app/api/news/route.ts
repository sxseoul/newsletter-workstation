import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/tavily';

export async function POST(request: NextRequest) {
  try {
    const { keywords, domains } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      // Demo mode: return mock data when API key is not configured
      const mockResults = generateMockNews(keywords);
      return NextResponse.json({
        results: mockResults,
        searchedAt: new Date().toISOString(),
        isDemo: true,
      });
    }

    const allResults: Record<string, unknown[]> = {};

    await Promise.all(
      keywords.map(async (keyword: string) => {
        try {
          const news = await searchNews(keyword, apiKey, domains);
          allResults[keyword] = news;
        } catch (error) {
          console.error(`Error searching for "${keyword}":`, error);
          allResults[keyword] = [];
        }
      })
    );

    return NextResponse.json({
      results: allResults,
      searchedAt: new Date().toISOString(),
      isDemo: false,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

function generateMockNews(keywords: string[]) {
  const mockNewsDatabase: Record<string, Array<{
    title: string;
    content: string;
    source: string;
    daysAgo: number;
  }>> = {
    'AI Regulation': [
      {
        title: 'White House Announces New AI Safety Framework for 2026',
        content: 'The Biden administration unveiled comprehensive AI safety guidelines requiring companies to conduct risk assessments before deploying high-risk AI systems. The framework establishes mandatory reporting requirements for AI incidents.',
        source: 'reuters.com',
        daysAgo: 1,
      },
      {
        title: 'China Releases Draft Rules for Generative AI Services',
        content: 'Chinese regulators have proposed new rules requiring generative AI service providers to obtain licenses and ensure their systems do not generate content that undermines national security.',
        source: 'techcrunch.com',
        daysAgo: 2,
      },
      {
        title: 'UK AI Safety Institute Partners with Major Tech Companies',
        content: 'The UK AI Safety Institute announced partnerships with leading AI companies to develop shared safety testing protocols and establish industry-wide benchmarks for responsible AI deployment.',
        source: 'theguardian.com',
        daysAgo: 3,
      },
    ],
    'EU AI Act': [
      {
        title: 'EU AI Act: First Enforcement Actions Expected by Q2 2026',
        content: 'European regulators are preparing for the first wave of enforcement actions under the EU AI Act, with focus on high-risk AI systems in healthcare and critical infrastructure sectors.',
        source: 'euractiv.com',
        daysAgo: 1,
      },
      {
        title: 'Companies Rush to Comply with EU AI Act Transparency Requirements',
        content: 'Major tech companies are scrambling to implement transparency measures required by the EU AI Act, including mandatory disclosure of AI-generated content and training data documentation.',
        source: 'politico.eu',
        daysAgo: 2,
      },
      {
        title: 'EU AI Act Compliance Guide: What Businesses Need to Know',
        content: 'Legal experts outline key compliance requirements under the EU AI Act, including risk classification, conformity assessments, and the establishment of AI governance frameworks.',
        source: 'lexology.com',
        daysAgo: 4,
      },
    ],
    'Copyright in AI training': [
      {
        title: 'NYT v. OpenAI: Court Sets Trial Date for Landmark Copyright Case',
        content: 'A federal judge has scheduled the trial for the New York Times lawsuit against OpenAI for September 2026, in what could become a defining case for AI copyright law.',
        source: 'nytimes.com',
        daysAgo: 1,
      },
      {
        title: 'Music Industry Files Class Action Against AI Music Generators',
        content: 'Major record labels have filed a class action lawsuit against AI music generation platforms, alleging unauthorized use of copyrighted songs for training purposes.',
        source: 'billboard.com',
        daysAgo: 2,
      },
      {
        title: 'EU Proposes Mandatory Licensing Framework for AI Training Data',
        content: 'The European Commission is considering mandatory licensing requirements for copyrighted content used in AI training, potentially reshaping how AI companies source training data.',
        source: 'ft.com',
        daysAgo: 3,
      },
    ],
    'Tech law': [
      {
        title: 'FTC Proposes Stricter Rules on Data Broker Practices',
        content: 'The Federal Trade Commission has proposed new regulations limiting how data brokers can collect and sell consumer information, with significant implications for the adtech industry.',
        source: 'wsj.com',
        daysAgo: 1,
      },
      {
        title: 'Supreme Court to Hear Case on Social Media Content Moderation',
        content: 'The Supreme Court has agreed to hear arguments on whether social media platforms can be held liable for algorithmic content recommendations.',
        source: 'scotusblog.com',
        daysAgo: 2,
      },
    ],
  };

  const results: Record<string, unknown[]> = {};

  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    let matchedNews: typeof mockNewsDatabase[keyof typeof mockNewsDatabase] = [];

    for (const [key, news] of Object.entries(mockNewsDatabase)) {
      if (keywordLower.includes(key.toLowerCase()) || key.toLowerCase().includes(keywordLower)) {
        matchedNews = news;
        break;
      }
    }

    if (matchedNews.length === 0) {
      matchedNews = [
        {
          title: `Latest Developments in ${keyword}`,
          content: `Stay updated on the latest news and regulatory changes related to ${keyword}. Legal experts are closely monitoring developments in this rapidly evolving area.`,
          source: 'lawtech.com',
          daysAgo: 1,
        },
      ];
    }

    results[keyword] = matchedNews.map((item, index) => ({
      title: item.title,
      url: `https://${item.source}/article/${Date.now()}-${index}`,
      content: item.content,
      score: 0.95 - index * 0.05,
      publishedDate: new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      source: item.source,
    }));
  });

  return results;
}
