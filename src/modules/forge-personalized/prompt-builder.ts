import type { PersonalizedForgeContext } from '../../shared/types/post-themes.types.js';
import { getSystemPromptForTheme } from '../../shared/themes/post-themes.library.js';
import { FEW_SHOT_EXAMPLES } from '../forge/prompts/fewshot.prompt.js';

/**
 * Build personalized forge prompt with user profile data
 */
export function buildPersonalizedPrompt(ctx: PersonalizedForgeContext): string {
  const { source, userProfile, theme } = ctx;

  let prompt = '';

  // BLOCK 0: CURRENT DATE CONTEXT
  const now = new Date();
  const nowStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  prompt += `# DATA ATUAL\n`;
  prompt += `$now = ${nowStr}\n`;
  prompt += `IMPORTANTE: Ao mencionar datas ou periodos temporais, use esta data como referencia.\n`;
  prompt += `NUNCA escreva "em 2024 ainda nao temos..." se estamos em 2026.\n`;
  prompt += `SEMPRE verifique se as datas e referencias temporais fazem sentido com $now.\n`;
  prompt += `\n`;

  // BLOCK 1: USER PERSONALIZATION CONTEXT
  prompt += `# PERFIL DO USUARIO\n`;
  prompt += `Nome do Instagram: ${userProfile.instagram_handle || 'N/A'}\n`;
  prompt += `Usuario: @${userProfile.instagram_username || 'N/A'}\n`;
  prompt += `Público-alvo: ${userProfile.target_audience || 'N/A'}\n`;
  prompt += `Dor principal: ${userProfile.main_pain_point || 'N/A'}\n`;
  prompt += `Tom de voz: ${userProfile.voice_tone}\n`;
  if (userProfile.user_prompt) {
    prompt += `Descrição do negócio: "${userProfile.user_prompt}"\n`;
  }
  prompt += `\n`;

  // BLOCK 2: THEME-SPECIFIC SYSTEM INSTRUCTION
  prompt += `# SISTEMA DE CRIAÇÃO DE CONTEÚDO\n`;
  prompt += `Tema selecionado: ${theme.name}\n`;
  prompt += `Slides: ${theme.slideCount.min}-${theme.slideCount.max}\n`;
  prompt += `Densidade: ${theme.contentDensity}\n`;
  prompt += `Uso de emojis: ${theme.emojiUsage}\n`;
  prompt += `\n`;

  // BLOCK 3: VOICE TONE INSTRUCTION
  prompt += theme.toneInstructions[userProfile.voice_tone];
  prompt += `\n`;

  // BLOCK 4: CONTENT SOURCE
  prompt += `# CONTEÚDO-FONTE\n`;
  prompt += `Título: ${source.title}\n`;
  prompt += `Resumo: ${source.summary || 'Elabore baseado no título'}\n`;
  if (source.url) prompt += `URL: ${source.url}\n`;
  if (source.category) prompt += `Categoria: ${source.category}\n`;
  prompt += `\n`;

  // BLOCK 5: PERSONALIZATION INSTRUCTIONS
  prompt += `# INSTRUÇÕES DE PERSONALIZAÇÃO\n`;
  prompt += `Personalize o conteúdo PARA o público-alvo especificado.\n`;
  prompt += `Use o tom de voz definido (${userProfile.voice_tone}).\n`;
  if (userProfile.main_pain_point) {
    prompt += `Conecte o conteúdo com a dor principal: "${userProfile.main_pain_point}".\n`;
  }
  if (userProfile.user_prompt) {
    prompt += `Alinhe o conteúdo com o negócio do usuário.\n`;
  }
  prompt += `Mencione o nome do Instagram (${userProfile.instagram_handle || 'a marca'}) quando apropriado no CTA.\n`;
  prompt += `\n`;

  // BLOCK 6: PRODUTO (se habilitado)
  if (ctx.product?.enabled) {
    prompt += `# CONFIGURAÇÃO DE PRODUTO\n`;
    prompt += `IMPORTANTE: O usuário está divulgando um produto/oferta neste post.\n`;
    prompt += `Produto/Oferta: ${ctx.product.description}\n`;
    prompt += `Palavra-chave do CTA: "${ctx.product.ctaKeyword}"\n`;
    prompt += `\n`;
    prompt += `INSTRUÇÕES PARA O SLIDE FINAL (CTA):\n`;
    prompt += `- O último slide DEVE ser um CTA focado no PRODUTO, não um CTA genérico.\n`;
    prompt += `- Use a estrutura: "Quer [benefício/produto]? Comenta **${ctx.product.ctaKeyword.toUpperCase()}** que te envio na DM!"\n`;
    prompt += `- A palavra-chave "${ctx.product.ctaKeyword}" DEVE estar destacada com **negrito** (ex: **${ctx.product.ctaKeyword.toUpperCase()}**).\n`;
    prompt += `- Seja natural e persuasivo, conectando o conteúdo do carrossel ao produto.\n`;
    prompt += `- Exemplo: "Quer receber ${ctx.product.description}? Comenta **${ctx.product.ctaKeyword.toUpperCase()}** abaixo que te mando no direct! 🚀"\n`;
    prompt += `\n`;
  }

  // BLOCK 7: FEW-SHOT EXAMPLES
  prompt += `# EXEMPLOS DE FORMATO\n`;
  prompt += FEW_SHOT_EXAMPLES;
  prompt += `\n`;

  // BLOCK 8: FINAL INSTRUCTION
  prompt += `# INSTRUÇÃO FINAL\n`;
  prompt += `Crie um carrossel ${theme.name.toLowerCase()} completo sobre o tema acima.\n`;
  prompt += `Decida autonomamente o número ideal de slides (${theme.slideCount.min}-${theme.slideCount.max}) baseado na profundidade do conteúdo.\n`;
  prompt += `Siga as regras de densidade: ${theme.contentDensity}.\n`;
  prompt += `Use emojis: ${theme.emojiUsage}.\n`;
  prompt += `\n`;
  prompt += `REGRAS DE IMAGEM:\n`;
  prompt += `- O hook (slide 1) DEVE ter image: true.\n`;
  prompt += `- Voce decide quais content slides tem imagem.\n`;
  prompt += `- image: true/false apenas. NAO gere prompts de imagem.\n`;
  prompt += `\n`;
  if (ctx.product?.enabled) {
    prompt += `REGRAS DO CTA (SLIDE FINAL):\n`;
    prompt += `- OBRIGATÓRIO: Usar o formato de produto conforme instruções acima.\n`;
    prompt += `- A palavra "${ctx.product.ctaKeyword}" DEVE estar em **negrito**.\n`;
    prompt += `- Conecte o produto ao conteúdo apresentado nos slides anteriores.\n`;
    prompt += `\n`;
  } else {
    prompt += `REGRAS DO CTA (SLIDE FINAL):\n`;
    prompt += `- Use CTA genérico de engajamento (ex: "Salva esse post", "Compartilha com um amigo", "Segue para mais").\n`;
    prompt += `\n`;
  }
  prompt += `REGRAS DE CAPTION:\n`;
  prompt += `- A caption DEVE seguir a estrutura de 3 blocos separados por "---".\n`;
  prompt += `- Bloco 1: Conteudo editorial.\n`;
  prompt += `- Bloco 2: Keywords de SEO.\n`;
  prompt += `- Bloco 3: Hashtags (max 5).\n`;
  prompt += `\n`;
  prompt += `CAMPOS OBRIGATORIOS NO JSON (Nivel raiz):\n`;
  prompt += `- hashtags: Array de strings (ex: ["#AI", "#Tech"]).\n`;
  prompt += `- cta_text: Texto curto para o botão de ação (ex: "Saiba mais", "Salvar post").\n`;
  prompt += `- best_posting_time: Sugestão de horário (ex: "18:00 BRT").\n`;
  prompt += `\n`;
  prompt += `Siga RIGOROSAMENTE o formato JSON especificado.\n`;
  prompt += `Retorne APENAS o JSON. Nenhum texto antes ou depois.\n`;

  return prompt;
}

/**
 * Get personalized system instruction
 */
export function getPersonalizedSystemInstruction(themeId: string, voiceTone: string): string {
  const basePrompt = getSystemPromptForTheme(themeId);

  return `${basePrompt}\n\n# CONTEXTO DE PERSONALIZAÇÃO\nEste conteúdo será usado por @username com o objetivo de resolver ${voiceTone} para o público-alvo especificado no perfil do usuário.`;
}
