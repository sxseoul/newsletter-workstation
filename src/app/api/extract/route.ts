import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return NextResponse.json({ extractedContent: null });
  }

  try {
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        urls: [url],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ extractedContent: null });
    }

    const data = await response.json();
    const result = data.results?.[0];
    const raw = result?.raw_content || result?.text || null;

    if (!raw) {
      return NextResponse.json({ extractedContent: null });
    }

    const cleaned = cleanArticleContent(raw);
    return NextResponse.json({ extractedContent: cleaned });
  } catch {
    return NextResponse.json({ extractedContent: null });
  }
}

function cleanArticleContent(raw: string): string {
  const cutoffPatterns = [
    /### Topics[\s\S]*/i,
    /## Topics[\s\S]*/i,
    /More from (?:TechCrunch|Bloomberg|Reuters|The Verge|Wired|Ars Technica|The Guardian|BBC|Politico|WSJ|Financial Times|NYT)[\s\S]*/i,
    /\n(?:Staff|Events|Newsletters|Podcasts|Videos|Partner Content)\n[\s\S]*/i,
    /Related (?:articles?|stories|posts)[\s\S]*/i,
    /Popular (?:now|stories)[\s\S]*/i,
    /You may also like[\s\S]*/i,
    /Recommended for you[\s\S]*/i,
    /\nSign up for\b[\s\S]*/i,
    /\nSubscribe to\b[\s\S]*/i,
    /\nComments?\s*\n[\s\S]*/i,
  ];

  let cleaned = raw;
  for (const pattern of cutoffPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  const lineJunkPatterns = [
    /^.*advertisement\s*$/gim,
    /^.*share this article.*/gim,
    /^.*follow us on .*/gim,
    /©\s*\d{4}.*/gi,
    /all rights reserved.*/gi,
    /getty images.*/gi,
    /\[.*?\]\(javascript:.*?\)/gi,
    /^\s*tags?:\s*.*$/gim,
    /^#+\s*Topics?\s*$/gim,
    /^(?:Biotech|Cloud Computing|Enterprise|Fintech|Fundraising|Gadgets|Gaming|Hardware|Privacy|Robotics|Security|Social|Space|Startups|Transportation|Venture|Media & Entertainment|Government & Policy|EVs|Layoffs)\s*$/gim,
    /^(?:Google|Instagram|Meta|Microsoft|TikTok|Apple|Amazon|Facebook)\s*$/gim,
    /^\s*(?:Crunchboard|Contact Us|StrictlyVC|Startup Battlefield|TechCrunch Brand Studio)\s*$/gim,
  ];

  for (const pattern of lineJunkPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  if (cleaned.length > 5000) {
    cleaned = cleaned.slice(0, 5000) + '...';
  }

  return cleaned;
}
