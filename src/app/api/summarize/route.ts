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

export async function POST(request: Request) {
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

  try {
    const articlesText = articles
      .map(
        (article, index) =>
          `[Article ${index + 1}]\nTitle: ${article.title}\nSource: ${article.source}\nCategory: ${article.category}\nContent: ${article.content}\nURL: ${article.url}`
      )
      .join('\n\n---\n\n');

    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(`너는 기술·법률 전문 뉴스레터 에디터야. 아래 기사들을 분석해서 한국어 Legal Memo 스타일 뉴스레터를 작성해.
절대 원문을 그대로 인용하지 마. 반드시 네가 분석·요약해서 써.

=== 출력 형식 (정확히 따라) ===

# 📮 Tech-Law Intelligence Brief
> (이번 호 핵심 키워드 한 줄 요약)

**${today}**

---

## 🔍 Executive Summary

(전체 기사를 관통하는 기술·법률 트렌드를 2~3문장으로 분석)

---

## 1. (기사 제목을 한국어로 번역)

**📌 카테고리:** (category) | **출처:** (source)

### 사실관계 (Facts)
- (핵심 사실 2~3개, 각각 한 문장)

### 법적 쟁점 (Legal Issues)
- (이 기사에서 주목할 법적·규제적 쟁점 1~2개)

### 실무적 시사점 (Implications)
- (기업·실무자가 알아야 할 영향 1~2개)

> 💡 **핵심 인사이트:** (so what? 한 문장으로 정리)

🔗 [원문 읽기](url)

---

(위 형식을 모든 기사에 반복)

## 📝 에디터 노트

(전체를 아우르는 마무리 분석 2~3문장)

---

*다음 호에서 또 만나요! 🙌*

=== 규칙 ===
1. 각 섹션은 bullet point로만 작성. 긴 문단 금지.
2. 각 bullet은 한 문장, 간결하게.
3. 전부 한국어로 작성.
4. 원문 영어 문장, 인용문, 기자 이름 포함 금지.
5. **굵은 글씨**는 핵심 키워드 1~2개에만.
6. 법률 용어가 있으면 한국 법률 맥락에 맞게 설명해.

=== 기사 원문 ===
${articlesText}`);

    const newsletter = result.response.text() || generateFallbackNewsletter(articles);

    return NextResponse.json({ newsletter, isAI: true });
  } catch (error) {
    console.error('Summarize API error:', error);

    // AI failed - return cleaned fallback instead of 500 error
    const newsletter = generateFallbackNewsletter(articles);
    return NextResponse.json({ newsletter, isAI: false });
  }
}

function generateFallbackNewsletter(articles: Article[]): string {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let content = `# Tech-Law Intelligence Brief\n`;
  content += `${today}\n\n`;
  content += `---\n\n`;
  content += `> ⚠️ AI 요약을 사용할 수 없어 원문 요약본을 제공합니다.\n\n`;
  content += `---\n\n`;

  articles.forEach((article, index) => {
    // Truncate content for fallback display
    const truncated = article.content.length > 300
      ? article.content.slice(0, 300) + '...'
      : article.content;

    content += `## ${index + 1}. ${article.title}\n\n`;
    content += `**카테고리:** ${article.category} | **출처:** ${article.source}\n\n`;
    content += `${truncated}\n\n`;
    content += `🔗 [원문 읽기](${article.url})\n\n`;
    if (index < articles.length - 1) {
      content += `---\n\n`;
    }
  });

  return content;
}
