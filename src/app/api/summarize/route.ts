import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Article {
  title: string;
  content: string;
  source: string;
  category: string;
  url: string;
}

interface RequestBody {
  articles: Article[];
}

async function extractFullArticle(url: string, tavilyKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        urls: [url],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data.results?.[0];
    return result?.raw_content || result?.text || null;
  } catch {
    return null;
  }
}

function cleanArticleContent(raw: string): string {
  // Remove common junk patterns
  const junkPatterns = [
    /read next[:\s].*/gi,
    /related articles?[:\s].*/gi,
    /recommended for you.*/gi,
    /sign up for .*newsletter.*/gi,
    /subscribe to .*/gi,
    /advertisement\s*/gi,
    /share this article.*/gi,
    /follow us on .*/gi,
    /click here to .*/gi,
    /©\s*\d{4}.*/gi,
    /all rights reserved.*/gi,
    /getty images.*/gi,
    /\[.*?\]\(javascript:.*?\)/gi,
    /^\s*tags?:\s*.*$/gim,
    /^\s*topics?:\s*.*$/gim,
    /more from .*/gi,
    /you may also like.*/gi,
    /popular now.*/gi,
  ];

  let cleaned = raw;
  for (const pattern of junkPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Collapse excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // Truncate to ~5000 chars to avoid token overflow
  if (cleaned.length > 5000) {
    cleaned = cleaned.slice(0, 5000) + '...';
  }

  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { articles } = body;

    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles provided' },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      const newsletter = generateFallbackNewsletter(articles);
      return NextResponse.json({ newsletter, isAI: false });
    }

    // Extract full article content via Tavily Extract API
    const tavilyKey = process.env.TAVILY_API_KEY;
    let enrichedArticles = articles;

    if (tavilyKey) {
      const extractions = await Promise.all(
        articles.map(async (article) => {
          const fullContent = await extractFullArticle(article.url, tavilyKey);
          if (fullContent) {
            return { ...article, content: cleanArticleContent(fullContent) };
          }
          return { ...article, content: cleanArticleContent(article.content) };
        })
      );
      enrichedArticles = extractions;
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const articlesText = enrichedArticles
      .map(
        (article, index) =>
          `[Article ${index + 1}]\nTitle: ${article.title}\nSource: ${article.source}\nCategory: ${article.category}\nContent: ${article.content}\nURL: ${article.url}`
      )
      .join('\n\n---\n\n');

    const result = await model.generateContent(
      `You are a top Substack newsletter writer known for sharp, engaging analysis. Write a Korean-language newsletter from the articles below.

Use rich Markdown formatting. Follow this structure exactly:

# 📮 News Intelligence Weekly
> 한 줄 서브헤딩 — 이번 호의 핵심 키워드를 담은 문장

**${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}**

---

## 🔍 이번 주 핵심 요약

Write 3-4 sentences summarizing the overarching themes across all articles. Use **bold** for key phrases. Make it feel like a personal briefing from an expert analyst.

---

Then for EACH article, write a section like this:

## 1. [Article title in Korean translation]

**📌 카테고리:** Category | **출처:** Source

Write 3-4 sentence analysis in Korean. Not a dry summary — add context, explain *why this matters*, and connect it to broader trends. Use **bold** for the most important phrases. Write like you're explaining to a smart friend over coffee.

> 💡 **핵심 인사이트:** One sentence takeaway in Korean that captures the "so what?" of this article.

🔗 [원문 읽기](url)

---

After all articles, end with:

## 📝 에디터 노트

Write 2-3 closing sentences connecting the dots between the articles, offering a forward-looking perspective. End with something thought-provoking.

---

*다음 호에서 또 만나요! 🙌*

IMPORTANT RULES:
- Write ALL analysis and insights in Korean
- Keep article titles translated to Korean
- Use bold, blockquotes, and emojis purposefully (not excessively)
- Each article section should feel distinct and insightful, not templated
- Tone: professional yet warm, like a trusted industry insider
- Base your analysis on the FULL article content provided — not just headlines

Articles:
${articlesText}`
    );

    const newsletter = result.response.text() || generateFallbackNewsletter(articles);

    return NextResponse.json({ newsletter, isAI: true });
  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate newsletter' },
      { status: 500 }
    );
  }
}

function generateFallbackNewsletter(articles: Article[]): string {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let content = `# News Intelligence Weekly\n`;
  content += `${today}\n\n`;
  content += `---\n\n`;
  content += `## Executive Summary\n\n`;
  content += `이번 주 주요 뉴스 ${articles.length}건을 정리했습니다.\n\n`;
  content += `---\n\n`;

  articles.forEach((article, index) => {
    content += `## ${index + 1}. ${article.title}\n\n`;
    content += `**카테고리:** ${article.category} | **출처:** ${article.source}\n\n`;
    content += `${article.content}\n\n`;
    content += `**Key Insight:** 해당 기사의 주요 함의를 검토하시기 바랍니다.\n\n`;
    content += `[원문 보기](${article.url})\n\n`;
    if (index < articles.length - 1) {
      content += `---\n\n`;
    }
  });

  return content;
}
