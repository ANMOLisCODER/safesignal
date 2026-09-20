import { NextResponse } from "next/server";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: string;
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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      source: "fallback",
      items: fallbackNews,
    });
  } catch (error) {
    console.error(
      "News feed request failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load news feed.",
      },
      { status: 500 },
    );
  }
}