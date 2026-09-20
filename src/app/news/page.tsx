"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Newspaper,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

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

type NewsResponse = {
  success: boolean;
  source: "newsdata" | "fallback";
  degraded?: boolean;
  items: NewsItem[];
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadNews(isRefresh = false) {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/news", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load news.");
      }

      const data = (await response.json()) as NewsResponse;

      if (!data.success) {
        throw new Error("News service returned an error.");
      }

      setItems(data.items ?? []);
    } catch (err) {
      console.error("News page error:", err);
      setError("Unable to load the news right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to SafeSignal
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <ShieldCheck className="size-3.5" />
                SafeSignal News
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Safety & Community News
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Stay informed with India-focused news and updates relevant to
                public safety and communities.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadNews(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="h-52 animate-pulse bg-muted" />

                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-medium">{error}</p>

            <button
              type="button"
              onClick={() => loadNews()}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
            <Newspaper className="mx-auto size-10 text-muted-foreground" />

            <h2 className="mt-4 text-lg font-semibold">
              No news available
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Please try refreshing the feed.
            </p>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && items.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Latest updates
                </p>

                <p className="text-xs text-muted-foreground">
                  {items.length} articles
                </p>
              </div>

              <div className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                India
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="relative h-52 overflow-hidden bg-muted">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-muted">
                      <Newspaper className="size-12 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {item.category}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.publishedAt)}
                      </span>
                    </div>

                    <h2 className="line-clamp-2 text-lg font-semibold leading-7 tracking-tight">
                      {item.title}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {item.summary}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                      <span className="truncate text-xs font-medium text-muted-foreground">
                        {item.source}
                      </span>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        Read article
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}