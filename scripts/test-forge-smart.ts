/**
 * FORGE-SMART — Full Pipeline Diagnostic Test
 * Runs Stages 1→2→3 with full verbosity. Stage 4 is shown as dry-run input only.
 * Usage: npx tsx scripts/test-forge-smart.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateSmartQueries } from '../src/modules/forge-smart/smart-query-generator.js';
import { fetchSmartCandidates, extractProfileKeywords } from '../src/modules/forge-smart/smart-content-fetcher.js';
import { enrichWinnerWithScrapedBody } from '../src/modules/forge-smart/smart-winner-scraper.js';
import { getPillarConfig } from '../src/modules/pillar-system/pillar.service.js';
import type { SmartCandidate } from '../src/modules/forge-smart/forge-smart.types.js';

// ── ANSI helpers ────────────────────────────────────────────────────────────
const B    = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM  = (s: string) => `\x1b[2m${s}\x1b[0m`;
const G    = (s: string) => `\x1b[32m${s}\x1b[0m`;
const Y    = (s: string) => `\x1b[33m${s}\x1b[0m`;
const C    = (s: string) => `\x1b[36m${s}\x1b[0m`;
const R    = (s: string) => `\x1b[31m${s}\x1b[0m`;
const SEP  = DIM('─'.repeat(72));
const HEAD = (t: string) => `\n${SEP}\n${B('  ' + t)}\n${SEP}`;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Score helpers (mirrors smart-content-scorer.ts exactly) ───────────────
function recency(posted_at: string | null): number {
  if (!posted_at) return 2;
  const h = (Date.now() - new Date(posted_at).getTime()) / 3_600_000;
  if (h < 6) return 10;
  if (h < 24) return 8;
  if (h < 48) return 6;
  if (h < 168) return 4;
  return 2;
}

function engagement(source_score: number | null): number {
  if (!source_score) return 2;
  if (source_score > 5000) return 10;
  if (source_score > 1000) return 8;
  if (source_score > 500)  return 6;
  if (source_score > 100)  return 4;
  return 2;
}

function richness(c: SmartCandidate): number {
  let s = 0;
  if (c.summary && c.summary.length > 100) s += 5;
  if (c.url && c.url.startsWith('http')) s += 3;
  if (c.author) s += 2;
  return s;
}

function finalScore(c: SmartCandidate): number {
  return (recency(c.posted_at) * 0.40)
       + (engagement(c.source_score) * 0.30)
       + (c.relevance_score * 0.20)
       + (richness(c) * 0.10);
}

function age(posted_at: string | null): string {
  if (!posted_at) return 'no-date';
  const h = Math.floor((Date.now() - new Date(posted_at).getTime()) / 3_600_000);
  return h < 1 ? '<1h' : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${B('═'.repeat(72))}`);
  console.log(B('  🔬 FORGE-SMART — Full Pipeline Diagnostic'));
  console.log(`${B('═'.repeat(72))}\n`);

  // ── 0. Load user profile ────────────────────────────────────────────────
  console.log(C('▸ Loading test user profile from DB...'));

  const { data: profile, error: pErr } = await supabase
    .from('users')
    .select('id, target_audience, main_pain_point, voice_tone, user_prompt')
    .eq('setup_completed', true)
    .not('target_audience', 'is', null)
    .not('main_pain_point', 'is', null)
    .limit(1)
    .single();

  if (pErr || !profile) {
    console.error(R('❌ No user with setup_completed=true + target_audience + main_pain_point found in DB.'));
    process.exit(1);
  }

  console.log(G(`✓ User: ${profile.id}`));
  console.log(`  ${DIM('target_audience')}  : ${Y(profile.target_audience)}`);
  console.log(`  ${DIM('main_pain_point')}  : ${Y(profile.main_pain_point)}`);
  console.log(`  ${DIM('voice_tone      ')}  : ${profile.voice_tone ?? 'professional'}`);
  console.log(`  ${DIM('user_prompt     ')}  : ${profile.user_prompt?.slice(0, 80) ?? DIM('(none)')}\n`);

  // ── STAGE 1 ─────────────────────────────────────────────────────────────
  console.log(HEAD('STAGE 1 — Smart Query Generator  [gpt-4o-mini]'));

  const t1 = Date.now();
  const pillarConfig = getPillarConfig('educate');
  const queries = await generateSmartQueries({
    target_audience: profile.target_audience,
    main_pain_point: profile.main_pain_point,
    voice_tone:      profile.voice_tone ?? 'professional',
    user_prompt:     profile.user_prompt,
    pillarConfig,
  });
  const ms1 = Date.now() - t1;

  const ANGLES = pillarConfig.queryAngles;
  console.log(G(`\n✓ ${queries.length} queries in ${ms1}ms\n`));
  queries.forEach((q, i) => {
    console.log(`  ${Y(`[${i + 1}]`)} ${B(q)}  ${DIM(`← ${ANGLES[i] ?? 'extra'}`)}`);
  });

  // ── STAGE 2 ─────────────────────────────────────────────────────────────
  console.log(HEAD('STAGE 2 — Smart Content Fetcher  [Google News RSS + Twitter + Reddit]'));

  const profileKeywords = extractProfileKeywords(
    profile.target_audience,
    profile.main_pain_point,
    profile.user_prompt ?? null
  );

  const t2 = Date.now();
  const candidates = await fetchSmartCandidates(queries, profile.id, profileKeywords);
  const ms2 = Date.now() - t2;

  if (candidates.length === 0) {
    console.error(R('\n❌ Zero candidates returned. Cannot proceed to Stage 3.'));
    process.exit(1);
  }

  // Group by source
  const bySource = candidates.reduce<Record<string, SmartCandidate[]>>((acc, c) => {
    (acc[c.source_type] ??= []).push(c);
    return acc;
  }, {});

  console.log(G(`\n✓ ${candidates.length} candidates collected in ${ms2}ms`));
  console.log(`  (after dedup + user-history filter)\n`);

  for (const [src, items] of Object.entries(bySource)) {
    console.log(`${C(`  ▸ ${src.toUpperCase()}`)} ${DIM(`(${items.length} items)`)}`);
    items.forEach((c, i) => {
      const title = c.title.length > 68 ? c.title.slice(0, 68) + '…' : c.title;
      const meta  = [age(c.posted_at), c.source_score ? `↑${c.source_score}` : null, `rel=${c.relevance_score}`]
                      .filter(Boolean).join('  ');
      console.log(`    ${DIM(String(i + 1).padStart(2, '0'))} ${title}`);
      console.log(`       ${DIM(`query: "${c.query_used}"  ${meta}`)}`);
      if (c.summary) {
        console.log(`       ${DIM('summ : ' + c.summary.slice(0, 90) + (c.summary.length > 90 ? '…' : ''))}`);
      }
    });
    console.log();
  }

  // ── STAGE 3 ─────────────────────────────────────────────────────────────
  console.log(HEAD('STAGE 3 — Smart Content Scorer  [weighted formula]'));

  console.log(DIM('\n  Formula: (recency×0.40) + (engagement×0.30) + (relevance×0.20) + (richness×0.10)\n'));

  const scored = candidates
    .map(c => ({
      c,
      rec: recency(c.posted_at),
      eng: engagement(c.source_score),
      rel: c.relevance_score,
      ric: richness(c),
      fs:  finalScore(c),
    }))
    .sort((a, b) => b.fs - a.fs);

  const winner = scored[0].c;
  const top    = scored.slice(0, 8);

  console.log(G(`✓ Scored ${scored.length} candidates. Showing top ${top.length}:\n`));
  console.log(
    DIM('  #   Score  rec  eng  rel  ric  src          Title')
  );
  console.log(DIM('  ' + '─'.repeat(70)));

  top.forEach(({ c, rec, eng, rel, ric, fs }, i) => {
    const rank  = i === 0 ? G(B(' 🏆 ')) : `  ${String(i + 1).padStart(2)} `;
    const score = i === 0 ? G(B(fs.toFixed(2))) : Y(fs.toFixed(2));
    const src   = c.source_type === 'google_news' ? DIM('news') : c.source_type === 'twitter' ? DIM('twt') : DIM('rddt');
    const title = (i === 0 ? B(c.title) : c.title).slice(0, 36) + (c.title.length > 36 ? '…' : '');
    console.log(`${rank} ${score}  ${String(rec).padEnd(3)}  ${String(eng).padEnd(3)}  ${String(rel).padEnd(3)}  ${String(ric).padEnd(3)}  ${src.padEnd(12)}  ${title}`);
  });

  console.log();
  console.log(G(`\n  🏆 WINNER:`));
  console.log(`     title   : ${B(winner.title)}`);
  console.log(`     source  : ${winner.source_type}  |  query: "${Y(winner.query_used)}"`);
  console.log(`     url     : ${winner.url ? DIM(winner.url) : DIM('(none)')}`);
  if (winner.summary) {
    console.log(`     summary : ${winner.summary.slice(0, 120)}${winner.summary.length > 120 ? '…' : ''}`);
  }
  console.log(`     score   : ${G(finalScore(winner).toFixed(2))} (rec=${recency(winner.posted_at)} eng=${engagement(winner.source_score)} rel=${winner.relevance_score} ric=${richness(winner)})`);

  // ── STAGE 2.5 ────────────────────────────────────────────────────────────
  console.log(HEAD('STAGE 2.5 — Winner Enrichment  [URL scraper]'));

  const enrichedWinner = await enrichWinnerWithScrapedBody({ ...winner, final_score: finalScore(winner) });
  const bodyLen = enrichedWinner.scraped_body?.length ?? 0;

  if (bodyLen > 0) {
    console.log(G(`\n✓ scraped_body length: ${bodyLen} chars`));
    console.log(`  ${DIM('preview: ' + enrichedWinner.scraped_body!.slice(0, 120) + (bodyLen > 120 ? '…' : ''))}`);
  } else {
    console.log(Y(`\n⚠  No scraped body — source_type=${winner.source_type}, url=${winner.url ?? '(none)'}`));
    console.log(`  ${DIM('Fallback: summary/title will be used as rawContent')}`);
  }

  // ── STAGE 4 (dry-run) ────────────────────────────────────────────────────
  console.log(HEAD('STAGE 4 — AI Input (dry-run)  [what forge-personalized receives]'));

  const forgeInput = {
    title:      enrichedWinner.title,
    summary:    enrichedWinner.scraped_body ?? enrichedWinner.summary ?? undefined,
    rawContent: enrichedWinner.scraped_body ?? enrichedWinner.summary ?? enrichedWinner.title,
    themeId:    'twitter',
    userId:     profile.id,
    productMode: false,
  };

  console.log(C('\n  ForgePersonalizedRequest:\n'));
  console.log(`  ${DIM('title')}      : ${B(forgeInput.title)}`);
  console.log(`  ${DIM('summary')}    : ${forgeInput.summary ? forgeInput.summary.slice(0, 100) + (forgeInput.summary.length > 100 ? '…' : '') : DIM('(none — title used as rawContent)')}`);
  console.log(`  ${DIM('rawContent')} :`);
  const raw = forgeInput.rawContent ?? '';
  // Print rawContent in 80-char lines
  for (let pos = 0; pos < raw.length; pos += 80) {
    console.log(`    ${raw.slice(pos, pos + 80)}`);
  }
  console.log(`\n  ${DIM('themeId')}    : ${forgeInput.themeId}`);
  console.log(`  ${DIM('userId')}     : ${forgeInput.userId}`);
  console.log(`  ${DIM('productMode')}: ${forgeInput.productMode}`);

  console.log(C('\n  DB update after forgePersonalizedCarousel():'));
  console.log(`  ${DIM('generation_method')} = "smart"`);
  console.log(`  ${DIM('smart_query_used')}  = "${Y(enrichedWinner.query_used)}"`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log(B('  PIPELINE SUMMARY'));
  console.log(SEP);
  console.log(`  Stage 1 (queries)    : ${ms1}ms  →  ${queries.length} queries generated`);
  console.log(`  Stage 2 (fetch)      : ${ms2}ms  →  ${candidates.length} candidates (${Object.entries(bySource).map(([k, v]) => `${k.replace('google_', '')}:${v.length}`).join(', ')})`);
  console.log(`  Stage 3 (score)      : <1ms  →  winner score ${G(finalScore(winner).toFixed(2))}`);
  console.log(`  Stage 2.5 (scrape)   : scraped_body ${bodyLen > 0 ? G(`${bodyLen} chars`) : Y('(none — fallback)')}`);
  console.log(`  Stage 4 (AI + DB)    : ${DIM('not executed in test mode')}`);
  console.log(`  Total (stages 1-3)   : ${ms1 + ms2}ms`);
  console.log(`\n${B('═'.repeat(72))}\n`);
}

main().catch(err => {
  console.error(R('\n❌ Test failed:'), err);
  process.exit(1);
});
