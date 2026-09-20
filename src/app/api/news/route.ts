import { NextResponse } from "next/server";

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
  message?: string;
};

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
  if (Array.isArray(article.category) && article.category.length > 0) {
    return article.category[0];
  }

  if (typeof article.category === "string" && article.category.trim()) {
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
      source: article.source_name?.trim() || "News Source",
      publishedAt: article.pubDate || new Date().toISOString(),
      url: article.link as string,
      category: getCategory(article),
      imageUrl: article.image_url || null,
    }));
}

export async function GET() {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.warn(
      "NEWSDATA_API_KEY is not configured. Using fallback news.",
    );

    return NextResponse.json({
      success: true,
      source: "fallback",
      degraded: true,
      items: fallbackNews,
    });
  }

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      q: "women safety OR public safety OR harassment OR crime",
      country: "in",
      language: "en",
      removeduplicate: "1",
    });

    const response = await fetch(
      `https://newsdata.io/api/1/latest?${params.toString()}`,
      {
        next: {
          revalidate: 900,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `NewsData.io returned HTTP ${response.status}`,
      );
    }

    const data = (await response.json()) as NewsDataResponse;

    const items = normalizeArticles(data.results ?? []);

    if (items.length === 0) {
      console.warn(
        "NewsData.io returned no usable articles. Using fallback news.",
      );

      return NextResponse.json({
        success: true,
        source: "fallback",
        degraded: true,
        items: fallbackNews,
      });
    }

    return NextResponse.json({
      success: true,
      source: "newsdata",
      degraded: false,
      items,
    });
  } catch (error) {
    console.error("NewsData.io request failed:", error);

    return NextResponse.json({
      success: true,
      source: "fallback",
      degraded: true,
      items: fallbackNews,
    });
  }
}