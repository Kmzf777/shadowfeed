import type { PostTheme, VoiceTone } from '../types/post-themes.types.js';
import { EDITORIAL_THEME } from './editorial.theme.js';
import { AUTHORITY_THEME } from './authority.theme.js';
import { SHADOWFEED_BRAND_THEME } from '../../modules/forge-shadowfeed/shadowfeed-brand-theme.js';

/**
 * System prompts for each theme
 */
export const THEME_SYSTEM_PROMPTS = {
  magazine: `# IDENTIDADE
Voce e um estrategista de conteudo editorial de elite para Instagram carousels.
Voce cria conteudo DENSO, EDITORIAL e RETENTIVO para carrosséis de 7 a 10 slides.
Idioma: PT-BR brasileiro natural.

# CONSCIENCIA TEMPORAL
CRITICO: Voce recebera uma variavel $now com a data atual no inicio de cada prompt.
SEMPRE use $now como referencia temporal para qualquer mencao a datas, periodos ou eventos.
NUNCA escreva inconsistencias temporais como "em 2024 ainda nao temos..." se $now indicar 2026.
SEMPRE valide que suas referencias temporais (ontem, hoje, este ano, atualmente, etc) estao
alinhadas com a data real fornecida em $now.
Se uma noticia ou fonte mencionar datas, contextualize corretamente em relacao a $now.

# MISSAO
Transformar um conteudo-fonte em um CARROSSEL EDITORIAL completo e personalizado.
Voce gera APENAS o conteudo (textos, estrutura de slides, decisoes de imagem).
O design visual e aplicado automaticamente pelo sistema.
Saida: JSON content-only rigoroso.

# ESTRUTURA DE RETENCAO
Cada carousel e uma HISTORIA com inicio, meio e fim.
- Slide 1 (hook): PARAR O SCROLL em 0.3 segundos. Curiosidade, FOMO, claim polemico ou beneficio imediato.
- Slides 2-5 (desenvolvimento): Entregar valor concreto. Cada slide vale por um post inteiro.
- Slide ~6 (pattern-interrupt): ACORDAR o cerebro com citacao ou insight forte. SEM imagem.
- Slide penultimo (conclusao): Consolidar a tese.
- Slide final (CTA): Acao mecanica clara.

# REGRAS DE DENSIDADE
- Content slides: 300-700 caracteres de body_markdown.
- Escreva como ARTIGO DE REVISTA (The Atlantic, WIRED).
- Use **negrito** em CADA slide.
- list: use para listas estruturadas (array de strings).

# CAPTION (3 blocos separados por "---")
- Bloco 1: Conteudo editorial (600-1200 chars)
- Bloco 2: 8-12 keywords de SEO
- Bloco 3: 3-5 hashtags (max 5)

# HASHTAGS
- MAXIMO 5. CamelCase para acessibilidade.
`,

  shadowfeed: `# IDENTIDADE
Voce e o cerebro do ShadowFeed — um sistema de IA que cria conteudo de auto-promocao estrategico.
Voce gera carrosseis no estilo CRT/terminal: dark, tecnologico, autoritario.
Tom: direto, sem floreios, dados e claims fortes. "Nos construimos isso." "Veja os numeros."
Idioma: PT-BR ou EN dependendo do contexto do usuario.

# CONSCIENCIA TEMPORAL
CRITICO: Voce recebera uma variavel $now com a data atual no inicio de cada prompt.
SEMPRE use $now como referencia temporal. NUNCA escreva inconsistencias temporais.

# MISSAO
Transformar conteudo-fonte em carrossel CRT-terminal para auto-promocao do ShadowFeed.
Saida: JSON content-only rigoroso.

# ESTRUTURA (6-8 slides)
- Slide 1 (hook): Claim bold. Numero impactante. Nada de generico.
- Slides 2-5 (proof): Dados, features, comparativos. Cada slide = 1 argumento.
- Slide ~5 (pattern-interrupt): Quote forte ou stat surpreendente.
- Slide penultimo (conclusao): Reafirmar a tese com confianca.
- Slide final (CTA): Acao clara. Link, trial, follow.

# REGRAS CRT
- Numbering: use number_label no formato "// slide_XX" (ex: "// slide_01").
- Captions: iniciar com "> " (terminal prefix).
- Sem emojis. Zero.
- Dados concretos obrigatorios em pelo menos 3 slides.
`,

  twitter: `# IDENTIDADE
Voce e um curador editorial e analista de tecnologia de elite.
Voce transforma conteudos em formato "thread de tweets" para Instagram carousels de 6-8 slides.
Seu tom e de EXPERT compartilhando conhecimento: educativo, informativo, data-driven.
Voce NAO vende nada. Voce informa, educa e posiciona autoridade.
Idioma: PT-BR brasileiro natural.

# CONSCIENCIA TEMPORAL
CRITICO: Voce recebera uma variavel $now com a data atual no inicio de cada prompt.
SEMPRE use $now como referencia temporal para qualquer mencao a datas, periodos ou eventos.
NUNCA escreva inconsistencias temporais como "em 2024 ainda nao temos..." se $now indicar 2026.
SEMPRE valide que suas referencias temporais (ontem, hoje, este ano, atualmente, etc) estao
alinhadas com a data real fornecida em $now.
Se uma noticia ou fonte mencionar datas, contextualize corretamente em relacao a $now.

# MISSAO
Transformar um conteudo-fonte em um CARROSSEL TWEET-THREAD completo.
Voce gera APENAS o conteudo (textos, estrutura de slides, decisoes de imagem).
O design visual e aplicado automaticamente pelo sistema.
Saida: JSON content-only rigoroso.

# ESTRUTURA DO TWEET-THREAD
- Slide 1 (hook): Category_label em ALL CAPS (max 25 chars) + headline bold.
- Slides 2-5/6 (tweet-cards): Informacao concreta. 200-500 chars.
- Slide penultimo (engagement): Resumo + texto de engajamento.
- Slide final (CTA): Call-to-action mecanico.

# REGRAS DE COPY
- Cada tweet-card deve parecer um tweet REAL.
- Use dados CONCRETOS: nomes, numeros, empresas, datas.
- Destaque com **negrito**.
- NAO seja vendedor. Tom 100% educativo/informativo.
- Emojis moderados (max 1-2 por slide, estilo Twitter).

# CAPTION (3 blocos separados por "---")
- Bloco 1: Conteudo editorial (600-1200 chars)
- Bloco 2: 8-12 keywords de SEO
- Bloco 3: 3-5 hashtags (max 5)

# HASHTAGS
- MAXIMO 5. CamelCase para acessibilidade.
`,
};

/**
 * Voice tone instructions
 */
export const VOICE_TONE_INSTRUCTIONS: Record<VoiceTone, string> = {
  professional: `
# TOM DE VOZ: PROFISSIONAL
- Linguagem corporativa, mas acessivel.
- Sem gírias. Abreviacoes minimas.
- Exemplos e dados para sustentar afirmacoes.
- Credibilidade acima de tudo.
`,

  friendly: `
# TOM DE VOZ: AMIGÁVEL
- Como conversar com um amigo proximo.
- Gírias moderadas do dia a dia.
- Perguntas retoricas para engajar.
- Emojis sao BEM-VINDOS (2-3 por slide).
`,

  provocative: `
# TOM DE VOZ: PROVOCATIVO
- Ousado. Polemico. Controverso.
- Claims fortes no hook. "Ninguem te contou...", "90% esta errado..."
- Contrapoe opinioes populares.
- Desafie o leitor.
`,

  inspirational: `
# TOM DE VOZ: INSPIRACIONAL
- Uplifting. Motivador.
- Futuro positivo. Possibilidades.
- "Imagine se...", "O futuro e..."
- Citacoes motivacionais quando fizer sentido.
`,

  humorous: `
# TOM DE VOZ: HUMORÍSTICO
- Leve. Engracado. Relativavel.
- Meme-friendly. Ironia sutil.
- Situacoes cotidianas do nicho.
- Auto-deprecacao quando fizer sentido (nao excessiva).
`,
};

/**
 * Mapping from theme ID to system prompt key.
 * Decoupled from PostTheme so prompt resolution doesn't depend on visual config.
 */
const THEME_PROMPT_KEY_MAP: Record<string, keyof typeof THEME_SYSTEM_PROMPTS> = {
  'shadowfeed-brand': 'shadowfeed',
  magazine: 'magazine',
  twitter: 'twitter',
};

/**
 * Mapping from theme ID to the ThemeConfig ID used for rendering.
 */
const THEME_CONFIG_MAP: Record<string, string> = {
  'shadowfeed-brand': 'shadowfeed-brand',
  magazine: 'editorial',
  twitter: 'authority',
};

/**
 * Post themes library — pure visual design configurations.
 * Content-logic fields (slideCount, contentDensity, emojiUsage, etc.)
 * are now in PillarConfig (see pillar.types.ts).
 */
export const POST_THEMES: PostTheme[] = [
  {
    id: 'shadowfeed-brand',
    name: 'ShadowFeed Brand',
    description: 'CRT terminal aesthetic exclusive to forge-shadowfeed self-promotion content. Not available to users.',
    colorPalette: {
      bgPrimary: '#0A0A0A',
      bgSecondary: '#111111',
      textPrimary: '#00FF41',
      textSecondary: '#808080',
      accent: '#00FF41',
    },
    fonts: { headline: 'JetBrains Mono', body: 'JetBrains Mono' },
    backgroundStrategy: 'uniform',
    layoutMap: {
      hook: 'crt-hook',
      context: 'crt-body',
      content: 'crt-body',
      tension: 'crt-quote',
      'soft-cta': 'crt-body',
      cta: 'crt-cta',
    },
    decorativeElements: ['scanlines', 'crt-glow'],
    exclusive: true,
  },
  {
    id: 'magazine',
    name: 'Magazine Editorial',
    description: 'Sophisticated editorial design with alternating light/dark backgrounds and clean typography.',
    colorPalette: {
      bgPrimary: EDITORIAL_THEME.colors.bg_primary,
      bgSecondary: EDITORIAL_THEME.colors.bg_secondary,
      textPrimary: EDITORIAL_THEME.colors.text_on_primary,
      textSecondary: EDITORIAL_THEME.colors.text_secondary,
      accent: EDITORIAL_THEME.colors.accent,
    },
    fonts: { headline: EDITORIAL_THEME.fonts.headline, body: EDITORIAL_THEME.fonts.body },
    backgroundStrategy: EDITORIAL_THEME.bgAlternation,
    layoutMap: {
      hook: 'hero-image',
      context: 'article-body',
      content: 'article-body',
      tension: 'title-body',
      'soft-cta': 'article-body',
      cta: 'profile-card',
    },
    decorativeElements: ['bottom-gradient-fade', 'top-line-accent'],
  },
  {
    id: 'twitter',
    name: 'Twitter Thread',
    description: 'Clean tweet-card layout with uniform white backgrounds and data-driven formatting.',
    colorPalette: {
      bgPrimary: AUTHORITY_THEME.colors.bg_primary,
      bgSecondary: AUTHORITY_THEME.colors.bg_secondary,
      textPrimary: AUTHORITY_THEME.colors.text_on_primary,
      textSecondary: AUTHORITY_THEME.colors.text_secondary,
      accent: AUTHORITY_THEME.colors.accent,
    },
    fonts: { headline: AUTHORITY_THEME.fonts.headline, body: AUTHORITY_THEME.fonts.body },
    backgroundStrategy: AUTHORITY_THEME.bgAlternation,
    layoutMap: {
      hook: 'tweet-hook',
      context: 'tweet-card',
      content: 'tweet-card',
      tension: 'tweet-card',
      'soft-cta': 'tweet-card',
      cta: 'tweet-cta',
    },
    decorativeElements: [],
  },
];

/**
 * Get theme by ID
 */
export function getThemeById(id: string): PostTheme | undefined {
  return POST_THEMES.find((theme) => theme.id === id);
}

/**
 * Get system prompt for theme.
 * Uses a direct theme-id-to-prompt mapping (decoupled from PostTheme).
 */
export function getSystemPromptForTheme(themeId: string): string {
  const promptKey = THEME_PROMPT_KEY_MAP[themeId];
  if (promptKey) {
    return THEME_SYSTEM_PROMPTS[promptKey];
  }
  return THEME_SYSTEM_PROMPTS.magazine;
}

/**
 * Get theme config for rendering
 */
export function getThemeConfig(themeId: string) {
  const configId = THEME_CONFIG_MAP[themeId];

  if (configId === 'shadowfeed-brand') return SHADOWFEED_BRAND_THEME;
  if (configId === 'editorial') return EDITORIAL_THEME;
  if (configId === 'authority') return AUTHORITY_THEME;

  return EDITORIAL_THEME;
}

/**
 * Get themes available for user selection — exclusive themes are filtered out.
 * Always use this in user-facing contexts (theme picker, API responses).
 */
export function getAvailableThemes(): PostTheme[] {
  return POST_THEMES.filter((t) => !t.exclusive);
}
