import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import type { ReconUltraCandidate } from '../recon-ultra.types.js';

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

async function fetchTwitterForQuery(query: string): Promise<ReconUltraCandidate[]> {
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
    logger.warn({ query, status: res.status }, '[RECON-ULTRA:TWITTER] TwitterAPI query failed');
    return [];
  }

  const data = await res.json() as { tweets?: TwitterApiTweet[] };
  const tweets = (data.tweets ?? [])
    .filter((t) => t.likeCount >= 20 || t.retweetCount >= 5)
    .slice(0, 5);

  logger.info(
    { query, tweetCount: tweets.length },
    '[RECON-ULTRA:TWITTER] Query completed'
  );

  const candidates: ReconUltraCandidate[] = [];

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
      body_content: null,
      url: `https://x.com/${tweet.author.userName}/status/${tweet.id}`,
      author: tweet.author.name || tweet.author.userName,
      category: null,
      source_score: engagementScore,
      source_comments: tweet.replyCount,
      source_retweets: tweet.retweetCount,
      source_views: null,
      recency_score: 0,
      engagement_score: 0,
      relevance_score: 0,
      richness_score: 0,
      pillar_alignment_score: 0,
      final_score: 0,
      pillar_tag: 'provoke' as const,
      query_used: query,
      posted_at: tweet.createdAt,
      expires_at: '',
    });
  }

  return candidates;
}

export async function fetchTwitterDynamic(
  queries: string[]
): Promise<ReconUltraCandidate[]> {
  if (!env.TWITTERAPI_IO_KEY) return [];

  const fetchPromises = queries.map((q) => fetchTwitterForQuery(q));
  const results = await Promise.allSettled(fetchPromises);

  const candidates: ReconUltraCandidate[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      candidates.push(...r.value);
    } else {
      logger.error(
        { error: r.reason?.message ?? String(r.reason) },
        '[RECON-ULTRA:TWITTER] Query fetch failed — continuing'
      );
    }
  }

  logger.info(
    { queryCount: queries.length, candidateCount: candidates.length },
    '[RECON-ULTRA:TWITTER] fetchTwitterDynamic complete'
  );

  return candidates;
}
