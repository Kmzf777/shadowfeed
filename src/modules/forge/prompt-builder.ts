import { SYSTEM_INSTRUCTION } from './prompts/system.prompt.js';
import { FEW_SHOT_EXAMPLES } from './prompts/fewshot.prompt.js';
import type { IntelSource } from '../../shared/types/global.types.js';

interface ForgeContext {
  source: IntelSource;
}

export function buildForgePrompt(ctx: ForgeContext): string {
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

  // Block 1: Theme and context
  prompt += `## TEMA PARA O CAROUSEL\n`;
  prompt += `Titulo: ${source.title}\n`;
  prompt += `Resumo: ${source.summary || 'Elabore baseado no titulo'}\n`;
  prompt += `Fonte: ${source.url || 'N/A'}\n`;
  prompt += `Categoria: ${source.category}\n`;
  prompt += `Tipo original: ${source.source_type}\n`;

  // Twitter engagement context (helps LLM calibrate tone)
  if (source.source_type === 'twitter') {
    prompt += `\n### Metricas de Engajamento do Tweet Original:\n`;
    prompt += `- Likes: ${source.source_score ?? 'N/A'}\n`;
    prompt += `- Autor: @${source.author || 'N/A'}\n`;
    prompt += `\nUse essas metricas para calibrar o tom do carousel:\n`;
    prompt += `- Tweet viral (>5000 likes) = tom mais ousado, polemico, claim forte no hook.\n`;
    prompt += `- Tweet tecnico (autor conhecido do nicho) = tom educativo, profundo, storytelling nerd.\n`;
    prompt += `- Tweet de noticia = tom FOMO, urgencia temporal, curadoria.\n`;
  }
  prompt += `\n`;

  // Block 2: Few-shot examples
  prompt += `## EXEMPLOS DE OUTPUT CONTENT-ONLY\n`;
  prompt += FEW_SHOT_EXAMPLES;
  prompt += `\n\n`;

  // Block 3: Final instruction
  prompt += `## INSTRUCAO\n`;
  prompt += `Crie um carousel editorial completo sobre o tema acima.\n`;
  prompt += `Decida autonomamente o numero ideal de slides (7-10) baseado na profundidade do conteudo.\n`;
  prompt += `Siga o ARCO NARRATIVO: hook → desenvolvimento → pattern-interrupt → conclusao → cta.\n`;
  prompt += `\n`;
  prompt += `REGRAS DE IMAGEM:\n`;
  prompt += `- O hook (slide 1) DEVE ter image: true.\n`;
  prompt += `- Pattern-interrupt NAO deve ter imagem (image: false).\n`;
  prompt += `- Voce decide quais content slides tem imagem (minimo 2, maximo 70% dos slides).\n`;
  prompt += `- image: true/false apenas. NAO gere prompts de imagem.\n`;
  prompt += `\n`;
  prompt += `REGRAS DE DENSIDADE EDITORIAL:\n`;
  prompt += `- Cada content slide DEVE ter body_markdown com 300-700 caracteres de texto DENSO.\n`;
  prompt += `- Escreva como ARTIGO DE REVISTA (The Atlantic, WIRED).\n`;
  prompt += `- Campo list: use para listas estruturadas de itens destacados (array de strings).\n`;
  prompt += `\n`;
  prompt += `Siga RIGOROSAMENTE o formato JSON especificado nas instrucoes do sistema.\n`;
  prompt += `Retorne APENAS o JSON. Nenhum texto antes ou depois.\n`;

  return prompt;
}

export function getSystemInstruction(): string {
  return SYSTEM_INSTRUCTION;
}
