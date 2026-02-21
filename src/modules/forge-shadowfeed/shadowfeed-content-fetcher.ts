import RSSParser from 'rss-parser';
import Snoowrap from 'snoowrap';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { supabase } from '../../config/supabase.js';
import type { PillarId } from './forge-shadowfeed.types.js';
import type { SmartCandidate } from '../forge-smart/forge-smart.types.js';

const rssParser = new RSSParser();

// Brazilian subreddits per spec § 4 AC6
const BR_SUBREDDITS = ['brdev', 'brasil', 'empreendedorismo', 'marketing', 'investimentos'];

// ─── TwitterAPI.io types ──────────────────────────────────────────

interface TwitterApiTweet {
  id: string;
  text: string;
  author: { userName: string; name: string };
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  createdAt: string;
}

// ─── Google News BR ───────────────────────────────────────────────
// AC5: hl=pt-BR&gl=BR&ceid=BR:pt-419

async function fetchGoogleNewsBR(query: string): Promise<SmartCandidate[]> {
  const encoded = encodeURIComponent(query);
  const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  try {
    const feed = await rssParser.parseURL(feedUrl);
    return feed.items
      .slice(0, 8)
      .map((item) => ({
        source_type: 'google_news' as const,
        title: item.title ?? '',
        summary: item.contentSnippet?.slice(0, 500) ?? null,
        url: item.link ?? null,
        author: item.creator ?? null,
        source_score: null,
        source_comments: null,
        posted_at: item.isoDate ?? null,
        relevance_score: 5.0,
        query_used: query,
      }))
      .filter((c) => c.title.length >= 5);
  } catch (err) {
    logger.warn(
      { query, error: (err as Error).message },
      '[SHADOWFEED:FETCH] Google News BR failed'
    );
    return [];
  }
}

// ─── Reddit BR ────────────────────────────────────────────────────
// AC6: r/brdev, r/brasil, r/empreendedorismo, r/marketing, r/investimentos

function createRedditClient(): Snoowrap | null {
  if (!env.REDDIT_CLIENT_ID || env.REDDIT_CLIENT_ID === 'PLACEHOLDER') {
    return null;
  }
  return new Snoowrap({
    userAgent: 'SHADOWFEED/1.0 (BR content discovery)',
    clientId: env.REDDIT_CLIENT_ID,
    clientSecret: env.REDDIT_CLIENT_SECRET,
    username: env.REDDIT_USERNAME,
    password: env.REDDIT_PASSWORD,
  });
}

async function fetchRedditBR(reddit: Snoowrap, query: string): Promise<SmartCandidate[]> {
  const subredditPromises = BR_SUBREDDITS.map(async (name) => {
    try {
      const results = await (reddit.getSubreddit(name) as any).search({
        query,
        sort: 'hot',
        time: 'week',
        limit: 5,
      });

      return (results as any[])
        .filter((post: any) => post.score >= 10 && !post.stickied)
        .slice(0, 3)
        .map(
          (post: any): SmartCandidate => ({
            source_type: 'reddit' as const,
            title: post.title,
            summary: post.selftext?.slice(0, 500) || null,
            url: post.url?.startsWith('/r/')
              ? `https://reddit.com${post.url}`
              : post.url,
            author: post.author?.name ?? null,
            source_score: post.score,
            source_comments: post.num_comments,
            posted_at: null,
            relevance_score: 5.0,
            query_used: query,
          })
        );
    } catch {
      return [] as SmartCandidate[];
    }
  });

  const settled = await Promise.allSettled(subredditPromises);
  const candidates: SmartCandidate[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') candidates.push(...r.value);
  }
  return candidates;
}

// ─── Twitter BR ───────────────────────────────────────────────────
// AC7: lang:pt filter, min_faves:20
// AC14: key read from TWITTER_IO_API_KEY env var

function getTwitterKey(): string {
  return env.TWITTER_IO_API_KEY || env.TWITTERAPI_IO_KEY || '';
}

async function fetchTwitterBR(query: string): Promise<SmartCandidate[]> {
  const apiKey = getTwitterKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query: `${query} lang:pt min_faves:20 -is:retweet`,
    queryType: 'Top',
  });

  try {
    const res = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?${params}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      logger.warn(
        { query, status: res.status },
        '[SHADOWFEED:FETCH] Twitter BR request failed'
      );
      return [];
    }

    const data = (await res.json()) as { tweets?: TwitterApiTweet[] };
    return (data.tweets ?? []).slice(0, 5).map(
      (tweet): SmartCandidate => ({
        source_type: 'twitter',
        title: tweet.text.slice(0, 200),
        summary: tweet.text.length > 100 ? tweet.text.slice(0, 2000) : null,
        url: `https://x.com/${tweet.author.userName}/status/${tweet.id}`,
        author: tweet.author.name || tweet.author.userName,
        source_score: tweet.likeCount + tweet.retweetCount * 2,
        source_comments: tweet.replyCount,
        posted_at: tweet.createdAt,
        relevance_score: 5.0,
        query_used: query,
      })
    );
  } catch (err) {
    logger.warn(
      { query, error: (err as Error).message },
      '[SHADOWFEED:FETCH] Twitter BR fetch failed'
    );
    return [];
  }
}

// ─── Google Trends BR ─────────────────────────────────────────────
// Used only for shadow-school pillar (spec § 4, Task 2)

interface TrendArticle {
  title?: string;
  url?: string;
  source?: string;
  snippet?: string;
}

interface TrendingSearch {
  title?: { query?: string };
  articles?: TrendArticle[];
}

async function fetchGoogleTrendsBR(): Promise<SmartCandidate[]> {
  try {
    // google-trends-api is CJS — dynamic import avoids ESM interop issues
    const googleTrends = (await import('google-trends-api')).default as unknown as {
      dailyTrends: (opts: { geo: string }) => Promise<string>;
    };

    const resultsStr = await googleTrends.dailyTrends({ geo: 'BR' });
    const data = JSON.parse(resultsStr) as {
      default?: {
        trendingSearchesDays?: Array<{
          trendingSearches?: TrendingSearch[];
        }>;
      };
    };

    const searches =
      data?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
    const candidates: SmartCandidate[] = [];

    for (const trend of searches.slice(0, 10)) {
      const query = trend.title?.query ?? '';
      if (!query) continue;

      candidates.push({
        source_type: 'google_news' as const,
        title: query,
        summary: trend.articles?.[0]?.snippet ?? null,
        url: trend.articles?.[0]?.url ?? null,
        author: trend.articles?.[0]?.source ?? null,
        source_score: null,
        source_comments: null,
        posted_at: new Date().toISOString(), // trending = now
        relevance_score: 6.0, // trending topics get a higher base score
        query_used: `google-trends-br:${query}`,
      });

      for (const article of (trend.articles ?? []).slice(0, 2)) {
        if (!article.title) continue;
        candidates.push({
          source_type: 'google_news' as const,
          title: article.title,
          summary: article.snippet ?? null,
          url: article.url ?? null,
          author: article.source ?? null,
          source_score: null,
          source_comments: null,
          posted_at: new Date().toISOString(),
          relevance_score: 5.5,
          query_used: `google-trends-br:${query}`,
        });
      }
    }

    logger.info(
      { candidateCount: candidates.length },
      '[SHADOWFEED:FETCH] Google Trends BR fetched'
    );

    return candidates;
  } catch (err) {
    logger.warn(
      { error: (err as Error).message },
      '[SHADOWFEED:FETCH] Google Trends BR failed'
    );
    return [];
  }
}

// ─── Deduplication by title prefix (AC11) ────────────────────────

function deduplicateByTitle(items: SmartCandidate[]): SmartCandidate[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Recency filter — last 30 ShadowFeed posts (AC12) ────────────

async function getRecentShadowFeedThemes(): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from('sf_posts')
      .select('title')
      .eq('generation_method', 'shadowfeed')
      .order('created_at', { ascending: false })
      .limit(30);

    const usedThemes = new Set<string>();
    (data ?? []).forEach((row: any) => {
      if (row.title) {
        usedThemes.add((row.title as string).toLowerCase().slice(0, 60));
      }
    });
    return usedThemes;
  } catch {
    return new Set();
  }
}

// ─── Main export (AC4, AC8) ───────────────────────────────────────

/**
 * Fetch ShadowFeed discovery candidates from all 4 BR sources in parallel.
 * Sources: Google News BR, Reddit BR, Twitter BR (optional), Google Trends BR (shadow-school only).
 * Uses Promise.allSettled for isolation — one source failure does not block others.
 * Applies dedup (60-char title prefix) and recency filter (last 30 shadowfeed posts).
 */
export async function fetchShadowFeedCandidates(
  queries: string[],
  pillarId: PillarId
): Promise<SmartCandidate[]> {
  const reddit = createRedditClient();
  const twitterKey = getTwitterKey();

  // AC8: Promise.allSettled — one source failure must not block others
  const fetchPromises: Promise<SmartCandidate[]>[] = [];

  for (const query of queries) {
    fetchPromises.push(fetchGoogleNewsBR(query));
    if (reddit) fetchPromises.push(fetchRedditBR(reddit, query));
    if (twitterKey) fetchPromises.push(fetchTwitterBR(query));
  }

  // Google Trends BR — shadow-school only per spec
  if (pillarId === 'shadow-school') {
    fetchPromises.push(fetchGoogleTrendsBR());
  }

  const results = await Promise.allSettled(fetchPromises);
  const allCandidates: SmartCandidate[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allCandidates.push(...result.value);
    }
  }

  logger.info(
    { pillarId, raw: allCandidates.length },
    '[SHADOWFEED:FETCH] Raw candidates collected'
  );

  // AC11: dedup by 60-char title prefix
  const deduplicated = deduplicateByTitle(allCandidates);

  // AC12: filter topics used in last 30 ShadowFeed posts
  const recentThemes = await getRecentShadowFeedThemes();
  const filtered = deduplicated.filter((c) => {
    const key = c.title.toLowerCase().slice(0, 60);
    return !recentThemes.has(key);
  });

  logger.info(
    {
      pillarId,
      afterDedup: deduplicated.length,
      afterFilter: filtered.length,
      recentThemesCount: recentThemes.size,
    },
    '[SHADOWFEED:FETCH] Candidates after dedup + recency filter'
  );

  return filtered;
}
