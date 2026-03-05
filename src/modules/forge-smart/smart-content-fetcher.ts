import RSSParser from 'rss-parser';
import Snoowrap from 'snoowrap';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { supabase } from '../../config/supabase.js';
import type { SmartCandidate } from './forge-smart.types.js';

const rssParser = new RSSParser();

// ─── TwitterAPI.io ───────────────────────────────────────────────

interface TwitterApiTweet {
  id: string;
  text: string;
  author: { userName: string; name: string };
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  createdAt: string;
  conversationId?: string;
}

// ─── Google News ─────────────────────────────────────────────────

export function extractProfileKeywords(
  target_audience: string,
  main_pain_point: string,
  user_prompt?: string | null
): string[] {
  const combined = [target_audience, main_pain_point, user_prompt ?? ''].join(' ');
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'with', 'how', 'que', 'para', 'de', 'do', 'da']);
  const words = combined
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !stopwords.has(w));
  return [...new Set(words)].slice(0, 15);
}

function scoreNewsRelevance(title: string, keywords: string[]): number {
  const lower = title.toLowerCase();
  let score = 4.0; // base score

  // Keyword match: +1.5 per hit (max 3 hits)
  let keywordHits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      score += 1.5;
      keywordHits++;
      if (keywordHits >= 3) break;
    }
  }

  // Rich content signals: +0.5 each
  if (/\d+%|\d+x|\$\d+|\d+k\b|\d+ percent/i.test(title)) score += 0.5;
  if (/study|report|survey|research|data|found|according/i.test(title)) score += 0.5;
  if (/how to|tips|guide|step|strategy|method/i.test(title)) score += 0.3;

  // PR fluff penalty: -2
  if (/announces|pleased to|proud to|excited to|partnership with|proud partner/i.test(title)) score -= 2;

  // Breaking/recency signal: +0.5
  if (/breaking|just|new|launch|released|update/i.test(title)) score += 0.5;

  return Math.max(0, Math.min(score, 10));
}

function passesEditorialFilter(candidate: SmartCandidate): boolean {
  const title = candidate.title;

  if (title.trim().length < 15) return false;

  // Reject articles older than MAX_AGE_DAYS
  if (!isRecentEnough(candidate.posted_at)) return false;

  const prPatterns = [
    /proud (to|partner|member)/i,
    /pleased to announce/i,
    /we are excited/i,
    /\bsponsored\b/i,
    /\badvertisement\b/i,
    /\bpress release\b/i,
  ];
  if (prPatterns.some((re) => re.test(title))) return false;

  if (/\[paywall\]|\(paywall\)|subscriber.only/i.test(title)) return false;

  return true;
}

const MAX_AGE_DAYS = 14;

function isRecentEnough(isoDate: string | null | undefined): boolean {
  if (!isoDate) return true; // no date = let it through, scorer will penalize
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= MAX_AGE_DAYS;
}

async function fetchGoogleNewsByQuery(query: string, keywords: string[]): Promise<SmartCandidate[]> {
  const encoded = encodeURIComponent(query);
  // when:7d restricts Google News to last 7 days; pt-BR for Portuguese results
  const feedUrl = `https://news.google.com/rss/search?q=${encoded}+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  try {
    const feed = await rssParser.parseURL(feedUrl);
    return feed.items
      .filter((item) => isRecentEnough(item.isoDate))
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
        relevance_score: scoreNewsRelevance(item.title ?? '', keywords),
        query_used: query,
      })).filter((c) => c.title.length >= 5);
  } catch (err) {
    logger.warn({ query, error: (err as Error).message }, '[FORGE-SMART:FETCH] Google News query failed');
    return [];
  }
}

// ─── Reddit ──────────────────────────────────────────────────────

function createRedditClient(): Snoowrap | null {
  if (!env.REDDIT_CLIENT_ID || env.REDDIT_CLIENT_ID === 'PLACEHOLDER') {
    return null;
  }
  return new Snoowrap({
    userAgent: 'SHADOWFEED/1.0 (smart content discovery)',
    clientId: env.REDDIT_CLIENT_ID,
    clientSecret: env.REDDIT_CLIENT_SECRET,
    username: env.REDDIT_USERNAME,
    password: env.REDDIT_PASSWORD,
  });
}

async function fetchRedditByQuery(
  reddit: Snoowrap,
  query: string
): Promise<SmartCandidate[]> {
  try {
    const results = await reddit.search({
      query,
      sort: 'relevance',
      time: 'week',
      limit: 10,
    });

    return results
      .filter((post: any) => post.score >= 50 && !post.stickied)
      .slice(0, 5)
      .map((post: any) => ({
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
        relevance_score: scoreRedditRelevance(post.score, post.num_comments),
        query_used: query,
      }));
  } catch (err) {
    logger.warn({ query, error: (err as Error).message }, '[FORGE-SMART:FETCH] Reddit query failed');
    return [];
  }
}

function scoreRedditRelevance(score: number, comments: number): number {
  let relevance = 5.0;
  if (score > 1000) relevance += 2;
  else if (score > 500) relevance += 1.5;
  else if (score > 200) relevance += 1;
  if (comments > 100) relevance += 1;
  return Math.min(relevance, 10);
}

// ─── Twitter (TwitterAPI.io) ──────────────────────────────────────

async function fetchTweetThread(conversationId: string, authorUserName: string): Promise<string> {
  const params = new URLSearchParams({
    query: `conversation_id:${conversationId} from:${authorUserName}`,
    queryType: 'Latest',
  });

  try {
    const res = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?${params}`,
      {
        headers: {
          'X-API-Key': env.TWITTERAPI_IO_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return '';

    const data = await res.json() as { tweets?: TwitterApiTweet[] };
    const replies = (data.tweets ?? [])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10);

    return replies.map((t) => t.text).join('\n\n');
  } catch {
    return '';
  }
}

async function fetchTwitterByQuery(query: string): Promise<SmartCandidate[]> {
  if (!env.TWITTERAPI_IO_KEY) return [];

  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    queryType: 'Top',
  });

  const res = await fetch(
    `https://api.twitterapi.io/twitter/tweet/advanced_search?${params}`,
    {
      headers: {
        'X-API-Key': env.TWITTERAPI_IO_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    logger.warn({ query, status: res.status }, '[FORGE-SMART:FETCH] TwitterAPI query failed');
    return [];
  }

  const data = await res.json() as { tweets?: TwitterApiTweet[] };
  const tweets = (data.tweets ?? [])
    .filter((t) => t.likeCount >= 20 || t.retweetCount >= 5)
    .slice(0, 5);

  logger.info(
    { query, tweetCount: tweets.length },
    '[FORGE-SMART:FETCH] Twitter query completed'
  );

  const candidates: SmartCandidate[] = [];

  for (const tweet of tweets) {
    let threadContent = tweet.text;
    if (tweet.conversationId && tweet.conversationId !== tweet.id) {
      const thread = await fetchTweetThread(tweet.conversationId, tweet.author.userName);
      if (thread && thread.length > threadContent.length) {
        threadContent = thread;
      }
    }

    const engagementScore = tweet.likeCount + (tweet.retweetCount * 2);

    candidates.push({
      source_type: 'twitter',
      title: tweet.text.slice(0, 200),
      summary: threadContent.length > 100 ? threadContent.slice(0, 2000) : null,
      url: `https://x.com/${tweet.author.userName}/status/${tweet.id}`,
      author: tweet.author.name || tweet.author.userName,
      source_score: engagementScore,
      source_comments: tweet.replyCount,
      posted_at: tweet.createdAt,
      relevance_score: 5.0, // recalculated by dynamic scorer
      query_used: query,
    });
  }

  return candidates;
}

// ─── Deduplicação ────────────────────────────────────────────────

function deduplicateByTitle(items: SmartCandidate[]): SmartCandidate[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getRecentlyUsedTitles(userId: string): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from('sf_posts')
      .select('smart_query_used')
      .eq('user_id', userId)
      .eq('generation_method', 'smart')
      .not('smart_query_used', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const usedTitles = new Set<string>();
    (data ?? []).forEach((row: any) => {
      if (row.smart_query_used) {
        usedTitles.add(row.smart_query_used.toLowerCase().slice(0, 60));
      }
    });
    return usedTitles;
  } catch {
    return new Set();
  }
}

// ─── Export principal ─────────────────────────────────────────────

export async function fetchSmartCandidates(
  queries: string[],
  userId: string,
  profileKeywords: string[]
): Promise<SmartCandidate[]> {
  const reddit = createRedditClient();

  const fetchPromises: Promise<SmartCandidate[]>[] = [];
  for (const query of queries) {
    fetchPromises.push(fetchGoogleNewsByQuery(query, profileKeywords));
    if (reddit) fetchPromises.push(fetchRedditByQuery(reddit, query));
    if (env.TWITTERAPI_IO_KEY) fetchPromises.push(fetchTwitterByQuery(query));
  }

  const results = await Promise.allSettled(fetchPromises);
  const allCandidates: SmartCandidate[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allCandidates.push(...result.value);
    }
  }

  const editorialFiltered = allCandidates.filter(passesEditorialFilter);

  logger.info(
    { before: allCandidates.length, afterFilter: editorialFiltered.length, rejected: allCandidates.length - editorialFiltered.length },
    '[FORGE-SMART:FILTER] Editorial filter applied'
  );

  const deduplicated = deduplicateByTitle(editorialFiltered);
  const usedTitles = await getRecentlyUsedTitles(userId);
  const filtered = deduplicated.filter((c) => {
    const key = c.title.toLowerCase().slice(0, 60);
    return !usedTitles.has(key);
  });

  logger.info(
    { userId, raw: allCandidates.length, afterDedup: deduplicated.length, afterFilter: filtered.length },
    '[FORGE-SMART:FETCH] Candidates collected'
  );

  return filtered;
}
