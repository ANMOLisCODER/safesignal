import { NextResponse } from "next/server";
import Groq from "groq-sdk";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: string;
  imageUrl?: string | null;
};

type NewsDataArticle = {
  article_id?: string;
  title?: string;
  description?: string | null;
  link?: string;
  pubDate?: string;
  source_name?: string | null;
  category?: string[] | string | null;
  image_url?: string | null;
};

type NewsDataResponse = {
  status?: string;
  totalResults?: number;
  results?: NewsDataArticle[];
  nextPage?: string | null;
  message?: string;
};

type AiFilterResult = {
  id: string;
  relevant: boolean;
  reason?: string;
};

const SAFETY_QUERIES = [
  "women safety",
  "sexual harassment",
  "sexual assault",
  "stalking",
  "domestic violence",
  "missing woman",
  "missing girl",
  "child safety",
  "public safety",
  "road safety",
  "transport safety",
  "safety advisory",
];

const fallbackNews: NewsItem[] = [
  {
    id: "fallback-1",
    title: "Stay aware in crowded public spaces",
    summary:
      "Keep your surroundings in view and prefer well-lit, populated routes when possible.",
    source: "SafeSignal",
    publishedAt: new Date().toISOString(),
    url: "#",
    category: "Safety",
  },
  {
    id: "fallback-2",
    title: "Community safety signals help identify patterns",
    summary:
      "Aggregated reports can help highlight emerging concerns without exposing individual reporters.",
    source: "SafeSignal",
    publishedAt: new Date().toISOString(),
    url: "#",
    category: "Community",
  },
  {
    id: "fallback-3",
    title: "If you feel unsafe, move toward trusted people",
    summary:
      "Consider moving toward a busy public place and contacting someone you trust.",
    source: "SafeSignal",
    publishedAt: new Date().toISOString(),
    url: "#",
    category: "Personal Safety",
  },
];

function getCategory(article: NewsDataArticle): string {
  if (
    Array.isArray(article.category) &&
    article.category.length > 0
  ) {
    return article.category[0];
  }

  if (
    typeof article.category === "string" &&
    article.category.trim()
  ) {
    return article.category;
  }

  return "Safety";
}

function normalizeArticles(
  articles: NewsDataArticle[],
): NewsItem[] {
  return articles
    .filter(
      (article) =>
        Boolean(article.article_id) &&
        Boolean(article.title) &&
        Boolean(article.link),
    )
    .map((article) => ({
      id: article.article_id as string,
      title: article.title as string,
      summary:
        article.description?.trim() ||
        "Read the full article for more details.",
      source:
        article.source_name?.trim() ||
        "News Source",
      publishedAt:
        article.pubDate ||
        new Date().toISOString(),
      url: article.link as string,
      category: getCategory(article),
      imageUrl: article.image_url || null,
    }));
}

function deduplicateArticles(
  items: NewsItem[],
): NewsItem[] {
  const seen = new Set<string>();
  const result: NewsItem[] = [];

  for (const item of items) {
    const normalizedTitle = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    const key = item.id || normalizedTitle;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function createKeywordFallback(
  items: NewsItem[],
): NewsItem[] {
  const strongSafetyKeywords = [
    "women safety",
    "woman safety",
    "women's safety",
    "women security",
    "sexual harassment",
    "sexual assault",
    "harassment",
    "stalking",
    "molestation",
    "rape",
    "domestic violence",
    "gender violence",
    "violence against women",
    "missing woman",
    "missing girl",
    "missing person",
    "child safety",
    "child abuse",
    "public safety",
    "personal safety",
    "safety advisory",
    "emergency advisory",
    "emergency alert",
    "road safety",
    "road accident",
    "transport safety",
    "railway safety",
    "public transport safety",
    "crime prevention",
    "safety measures",
    "safety initiative",
    "safety awareness",
    "disaster response",
    "evacuation",
  ];

  return items.filter((item) => {
    const text =
      `${item.title} ${item.summary}`.toLowerCase();

    return strongSafetyKeywords.some((keyword) =>
      text.includes(keyword),
    );
  });
}

async function fetchNewsForQuery(
  apiKey: string,
  query: string,
): Promise<NewsItem[]> {
  const params = new URLSearchParams({
    apikey: apiKey,
    q: query,
    country: "in",
    language: "en",
    removeduplicate: "1",
  });

  const response = await fetch(
    `https://newsdata.io/api/1/latest?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `NewsData.io returned HTTP ${response.status} for query "${query}"`,
    );
  }

  const data =
    (await response.json()) as NewsDataResponse;

  return normalizeArticles(data.results ?? []);
}

async function fetchSafetyNews(
  apiKey: string,
): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    SAFETY_QUERIES.map((query) =>
      fetchNewsForQuery(apiKey, query),
    ),
  );

  const allArticles: NewsItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    } else {
      console.warn(
        "[News] One query failed:",
        result.reason,
      );
    }
  }

  return deduplicateArticles(allArticles);
}

async function filterWithGroq(
  items: NewsItem[],
): Promise<NewsItem[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || items.length === 0) {
    return items;
  }

  const groq = new Groq({
    apiKey,
  });

  /*
   * Keep the AI payload reasonably small.
   * NewsData free returns up to 10 articles per request,
   * and multiple safety queries can produce duplicates.
   */
  const articlesForAi = items.slice(0, 40).map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
  }));

  const systemPrompt = `
You are the STRICT relevance classifier for SafeSignal,
an Indian public-safety platform.

Your ONLY job is to decide whether a news article belongs
in the SafeSignal safety news feed.

KEEP an article ONLY when its MAIN SUBJECT has a clear,
meaningful connection to:

- women or girls' safety
- harassment
- stalking
- molestation
- sexual assault
- gender-based violence
- domestic violence
- missing women, girls, or children
- child safety
- child abuse
- public-space safety
- personal safety
- emergency warnings
- safety advisories
- road safety
- railway safety
- metro safety
- cab or public-transport safety
- crime-prevention initiatives directly related to community safety
- disaster warnings or evacuation
- emergency response with direct public-safety impact
- official safety measures directly useful to the public

WOMEN-SAFETY RELEVANCE HAS PRIORITY.

STRICTLY REJECT:

- politics
- elections
- political analysis
- political campaigns
- sports
- cricket
- entertainment
- celebrities
- movies
- business
- finance
- stock market
- fashion
- food
- ordinary lifestyle
- unrelated technology
- agriculture
- unrelated environmental stories
- generic police stories
- generic deportation stories
- generic arrests
- generic theft
- generic burglary
- generic murder
- generic court cases
- generic crime stories

IMPORTANT:

Do NOT keep an article merely because it contains:
"police"
"crime"
"security"
"woman"
"India"
or
"safety".

Judge the MAIN SUBJECT and context.

The article should be genuinely useful to someone opening
a women/public/personal safety news feed.

If an article is primarily about women or girls being protected,
harassment prevention, sexual violence, stalking, missing women,
child safety, or public safety measures, mark it relevant.

If the connection is weak or incidental, reject it.

Return ONLY valid JSON.

Required format:

{
  "results": [
    {
      "id": "article-id",
      "relevant": true,
      "reason": "short reason"
    }
  ]
}

Every input article MUST appear exactly once.
`;

  const userPrompt = `
Classify these articles for the SafeSignal safety news feed:

${JSON.stringify(articlesForAi)}
`;

  try {
    const response =
      await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],

        temperature: 0,
        max_completion_tokens: 1800,

        response_format: {
          type: "json_object",
        },
      });

    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      throw new Error(
        "Groq returned an empty filtering response.",
      );
    }

    const parsed = JSON.parse(content) as {
      results?: AiFilterResult[];
    };

    if (!Array.isArray(parsed.results)) {
      throw new Error(
        "Groq returned an invalid filtering format.",
      );
    }

    const decisions = new Map(
      parsed.results.map((result) => [
        result.id,
        result.relevant,
      ]),
    );

    const filtered = items.filter(
      (item) =>
        decisions.get(item.id) === true,
    );

    console.log(
      `[News AI] Filtered ${items.length} articles → ${filtered.length} relevant articles.`,
    );

    return filtered;
  } catch (error) {
    console.error(
      "[News AI] Filtering failed:",
      error,
    );

    console.warn(
      "[News AI] Using strict keyword fallback.",
    );

    return createKeywordFallback(items);
  }
}

export async function GET() {
  const newsApiKey =
    process.env.NEWSDATA_API_KEY;

  if (!newsApiKey) {
    console.warn(
      "NEWSDATA_API_KEY is not configured. Using fallback news.",
    );

    return NextResponse.json({
      success: true,
      source: "fallback",
      degraded: true,
      aiFiltered: false,
      items: fallbackNews,
    });
  }

  try {
    console.log(
      `[News] Fetching ${SAFETY_QUERIES.length} focused safety queries.`,
    );

    const items =
      await fetchSafetyNews(newsApiKey);

    console.log(
      `[News] Collected ${items.length} unique articles before AI filtering.`,
    );

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        source: "newsdata",
        degraded: false,
        aiFiltered: false,
        items: [],
      });
    }

    const groqKey =
      process.env.GROQ_API_KEY;

    if (!groqKey) {
      console.warn(
        "GROQ_API_KEY is not configured. Using strict keyword filtering.",
      );

      const keywordFiltered =
        createKeywordFallback(items);

      return NextResponse.json({
        success: true,
        source: "newsdata",
        degraded: true,
        aiFiltered: false,
        items: keywordFiltered,
      });
    }

    const filteredItems =
      await filterWithGroq(items);

    return NextResponse.json({
      success: true,
      source: "newsdata",
      degraded: false,
      aiFiltered: true,
      queryCount: SAFETY_QUERIES.length,
      totalBeforeAi: items.length,
      totalAfterAi: filteredItems.length,
      items: filteredItems,
    });
  } catch (error) {
    console.error(
      "NewsData.io request failed:",
      error,
    );

    return NextResponse.json({
      success: true,
      source: "fallback",
      degraded: true,
      aiFiltered: false,
      items: fallbackNews,
    });
  }
}