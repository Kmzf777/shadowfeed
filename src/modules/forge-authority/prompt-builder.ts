import { AUTHORITY_SYSTEM_INSTRUCTION } from './prompts/system.prompt.js';
import { AUTHORITY_FEW_SHOT } from './prompts/fewshot.prompt.js';
import type { IntelSource } from '../../shared/types/global.types.js';

interface AuthorityForgeContext {
  source: IntelSource;
}

export function buildAuthorityPrompt(ctx: AuthorityForgeContext): string {
  const { source } = ctx;

  let prompt = '';

  // Block 0: Current date context
  const now = new Date();
  const nowStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  prompt += `## DATA ATUAL\n`;
  prompt += `$now = ${nowStr}\n`;
  prompt += `IMPORTANTE: Ao mencionar datas ou periodos temporais, use esta data como referencia.\n`;
  prompt += `NUNCA escreva "em 2024 ainda nao temos..." se estamos em 2026.\n`;
  prompt += `SEMPRE verifique se as datas e referencias temporais fazem sentido com $now.\n`;
  prompt += `\n`;

  // Block 1: Trend data
  prompt += `## TREND PARA O CAROUSEL TWEET-THREAD\n`;
  prompt += `Titulo: ${source.title}\n`;
  prompt += `Resumo/Noticias:\n${source.summary || 'Elabore baseado no titulo'}\n`;
  prompt += `Fonte: ${source.url || 'N/A'}\n`;
  prompt += `Categoria: ${source.category || 'industry_news'}\n`;
  prompt += `Trafego: ${source.source_score ? `${source.source_score.toLocaleString()}+` : 'N/A'}\n`;
  prompt += `\n`;

  if (source.raw_content) {
    prompt += `## CONTEUDO BASE\n`;
    prompt += `${source.raw_content}\n`;
    prompt += `(Use este conteudo como fonte principal de verdade)\n`;
    prompt += `\n`;
  }

  // Block 2: Few-shot example
  prompt += `## EXEMPLO DE OUTPUT CONTENT-ONLY\n`;
  prompt += AUTHORITY_FEW_SHOT;
  prompt += `\n\n`;

  // Block 3: Final instruction
  prompt += `## INSTRUCAO\n`;
  prompt += `Crie um carousel tweet-thread completo sobre a trend acima.\n`;
  prompt += `Use 6-8 slides: hook visual → tweet cards educativos → engagement → CTA.\n`;
  prompt += `Use os DADOS CONCRETOS das noticias para enriquecer cada tweet card.\n`;
  prompt += `NAO invente dados — use as informacoes fornecidas.\n`;
  prompt += `Tom: autoridade + educativo. ZERO vendas.\n`;
  prompt += `\n`;
  prompt += `REGRAS DE IMAGEM:\n`;
  prompt += `- O hook (slide 1) DEVE ter image: true.\n`;
  prompt += `- Voce decide quais content slides tem imagem (maximo 2 slides com imagem alem do hook).\n`;
  prompt += `- image: true/false apenas. NAO gere prompts de imagem.\n`;
  prompt += `\n`;
  prompt += `Campo list: use para listas estruturadas de itens destacados (array de strings).\n`;
  prompt += `\n`;
  prompt += `Siga RIGOROSAMENTE o formato JSON especificado nas instrucoes do sistema.\n`;
  prompt += `Retorne APENAS o JSON. Nenhum texto antes ou depois.\n`;

  return prompt;
}

export function getAuthoritySystemInstruction(): string {
  return AUTHORITY_SYSTEM_INSTRUCTION;
}
