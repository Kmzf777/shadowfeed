import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_ANON_KEY: z.string().min(10),

  // OpenAI
  OPENAI_API_KEY: z.string().min(5),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // Reddit
  REDDIT_CLIENT_ID: z.string().default(''),
  REDDIT_CLIENT_SECRET: z.string().default(''),
  REDDIT_USERNAME: z.string().default(''),
  REDDIT_PASSWORD: z.string().default(''),
  REDDIT_SUBREDDITS: z.string().default('artificial,technology,MachineLearning'),

  // Google Trends
  GOOGLE_TRENDS_KEYWORDS: z.string().default('inteligencia artificial,AI tools,ChatGPT'),

  // Twitter
  TWITTERAPI_IO_KEY: z.string().default(''),
  TWITTER_IO_API_KEY: z.string().default(''), // shadowfeed-specific key (AC14)
  TWITTER_PROFILES: z.string().default(''),
  TWITTER_SEARCH_QUERIES: z.string().default('AI tools,artificial intelligence,LLM'),
  TWITTER_MAX_POSTS: z.coerce.number().default(50),


  RENDERER_APP_URL: z.string().url().default('http://localhost:3001'),
  OUTPUT_DIR: z.string().default('./output'),

  // Rate Limits
  MAX_DAILY_LLM_CALLS: z.coerce.number().default(30),
  MAX_DAILY_SCRAPE_POSTS: z.coerce.number().default(100),

  // Stripe
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_SUCCESS_URL: z.string().default('http://localhost:3000/account?purchase=success'),
  STRIPE_CANCEL_URL: z.string().default('http://localhost:3000/account?purchase=cancelled'),

  // Admin Dashboard
  ADMIN_USERNAME: z.string().default('Shadowfeed'),
  ADMIN_PASSWORD: z.string().default('Shadowfeedinteligencia*321'),
  ADMIN_JWT_SECRET: z.string().default('sf-admin-jwt-secret-change-in-prod'),

  // Forge ShadowFeed
  SHADOWFEED_ADMIN_TOKEN: z.string().default('sf_admin_change_me'),
  SHADOWFEED_INSTAGRAM_HANDLE: z.string().default('@shadowfeed.ai'),
  SHADOWFEED_TIMEZONE: z.string().default('America/Sao_Paulo'),
  SHADOWFEED_SESSION_DIR: z.string().default('./sessions'),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `  ${i.path.join('.')}: ${i.message}`
    );
    console.error('❌ Invalid environment variables:\n' + errors.join('\n'));
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
