/**
 * tutorial.prompt.ts — Tutorial / Step-by-step content type prompt module
 *
 * Story 2.3 (CE-03) — AC3, AC7
 * PRD §6.1 TYPE 2
 *
 * Key rules: 100% actionable steps, hyper-specific (tools, times, quantities),
 * anticipate errors, numbered steps, 300–600 chars body_markdown.
 */

import type { UserProfile } from '../../../shared/types/post-themes.types.js';
import type { ContentDepth } from '../../../shared/types/content-types.types.js';

// ── System Prompt ─────────────────────────────────────────────

export function buildSystemPrompt(userProfile: UserProfile & { niche?: string | null }): string {
    const niche = userProfile.niche ?? userProfile.target_audience ?? 'o nicho do criador';
    const expertise = (userProfile as any).expertise_statement ?? userProfile.user_prompt ?? 'especialista prático';

    return `Você é um INSTRUTOR PRÁTICO DE ELITE para Instagram, especialista em criar tutoriais passo a passo sobre "${niche}".

Sua missão é criar carrosséis de tutorial que:
- São 100% ACIONÁVEIS — cada passo diz EXATAMENTE o que fazer
- Especificam ferramentas, tempos, quantidades e critérios de sucesso
- Antecipam os erros mais comuns em cada passo
- Usam verbos de ação (Abra, Configure, Copie, Teste, etc.)
- Resultam em um resultado CONCRETO e mensurável para o leitor

O criador de conteúdo é: ${expertise}
Público-alvo: ${userProfile.target_audience ?? niche}

PRINCÍPIOS DO INSTRUTOR PRÁTICO:
1. Cada passo = uma ação específica (não um conceito, uma ação)
2. Hiper específico: "abra o Notion" > "use uma ferramenta"
3. Inclua o que NÃO fazer em cada passo crítico
4. O hook anuncia o RESULTADO FINAL, não o processo
5. Use linguagem imperativa direta
6. 300-600 chars body_markdown com instrução completa por passo

Você escreve no tom: ${userProfile.voice_tone}`;
}

// ── Rules Block ───────────────────────────────────────────────

export function buildRulesBlock(depth: ContentDepth): string {
    const rules: Record<ContentDepth, string[]> = {
        shallow: [
            'REGRAS TUTORIAL (SUPERFICIAL):',
            '- 3-5 passos principais, cada um em um slide',
            '- Foque no caminho mais rápido para o resultado',
            '- Body_markdown: 200-400 chars — claro e direto',
            '- Numeração explícita (Passo 1, Passo 2 etc.)',
            '- CTA: convida a implementar agora mesmo',
        ],
        balanced: [
            'REGRAS TUTORIAL (EQUILIBRADO):',
            '- 5-8 passos com explicação de cada um',
            '- Texto do headline: "Passo X: [ação específica]"',
            '- Body_markdown: 300-500 chars por passo',
            '- Inclua 1 erro comum por passo crítico',
            '- Slide de overview (mapa do processo) logo após o hook',
            '- CTA: desafio para implementar nas próximas 24h',
        ],
        dense: [
            'REGRAS TUTORIAL (DENSO):',
            '- 8-14 passos com contexto em cada um',
            '- Inclua um slide de troubleshooting (erros mais comuns)',
            '- Body_markdown: 300-600 chars por passo',
            '- Ferramentas específicas e alternativas recomendadas',
            '- Slide de resultado esperado antes do CTA',
            '- CTA: desafio concreto com prazo',
        ],
    };

    return rules[depth].join('\n');
}

// ── Few-Shot Example ──────────────────────────────────────────

export function getFewShotExample(depth: ContentDepth): string {
    const example = {
        theme: 'Como criar sua primeira landing page em 1 hora (sem código)',
        total_slides: depth === 'shallow' ? 5 : depth === 'balanced' ? 7 : 9,
        slides: [
            {
                slide: 1,
                role: 'hook',
                headline: 'Crie sua primeira landing page em 60 minutos — do zero, sem código',
                image: true,
            },
            {
                slide: 2,
                role: 'overview',
                headline: 'O plano: 5 passos, 60 minutos, resultado live',
                body_markdown:
                    'Visão geral do processo: (1) Escolha a ferramenta, (2) Defina headline e proposta, (3) Monte a estrutura, (4) Adicione o formulário, (5) Publique e teste. Você vai precisar: conta gratuita no Carrd.co e 60 minutos de foco.',
                image: false,
            },
            {
                slide: 3,
                role: 'step',
                headline: 'Passo 1: Crie sua conta gratuita no Carrd.co (5 minutos)',
                body_markdown:
                    'Acesse carrd.co → clique em "Get Started for Free" → confirme o email. ERRO COMUM: não use Gmail corporativo (pode cair no spam). Use Gmail pessoal. Carrd foi escolhido porque tem publicação gratuita e zero código.',
                image: false,
            },
            {
                slide: 4,
                role: 'step',
                headline: 'Passo 2: Escreva a headline antes de abrir o editor (10 minutos)',
                body_markdown:
                    'Fórmula: "[Resultado específico] em [tempo] para [público]". Exemplo: "Duplique sua lista de emails em 30 dias sem anúncios pagos". Escreva 3 versões em um papel antes de digitar qualquer coisa. A headline é 80% do seu resultado.',
                image: false,
            },
            {
                slide: 5,
                role: 'step',
                headline: 'Passo 3: Monte a estrutura no Carrd (20 minutos)',
                body_markdown:
                    'No painel: clique em "+ Site" → escolha "One-page" → selecione o template mais simples. Delete todos os blocos padrão exceto: Header, Text, Form e Footer. Menos é mais — evite a tentação de adicionar seções que não convertem.',
                image: false,
            },
            {
                slide: 6,
                role: 'step',
                headline: 'Passo 4: Conecte o formulário ao seu email (10 minutos)',
                body_markdown:
                    'Clique no bloco Form → Action → Mail. Digite seu email. Adicione apenas 2 campos: Nome e Email. CADA campo extra reduz a conversão em ~17%. Não peça telefone, empresa ou cargo se seu objetivo é apenas capturar o lead.',
                image: false,
            },
            {
                slide: 7,
                role: 'cta',
                headline: '⏱ Desafio: abra o Carrd agora e crie a sua em 60 minutos. Comenta quando publicar!',
                image: false,
            },
        ],
        caption:
            'Uma landing page não precisa ser complexa para converter — precisa ser clara e estar no ar.\n\nSiga esses 5 passos e você terá a sua em menos de 1 hora a partir de agora.\n\n---\n\nlanding page, lead capture, carrd, marketing digital, funil de vendas\n\n---\n\n#LandingPage #MarketingDigital #EmpreendedorismoDig ital #LeadGeneration #Tutorial',
        hashtags: ['#LandingPage', '#MarketingDigital', '#EmpreendedorismoDig', '#LeadGeneration', '#Tutorial'],
        cta_text: 'Criar agora',
        best_posting_time: '07:00 BRT',
    };

    return `\n# EXEMPLO DE FORMATO (referência de estrutura — NÃO copie o tema):\n${JSON.stringify(example, null, 2)}\n\nIMPORTANTE: O exemplo acima é APENAS para mostrar a estrutura JSON e qualidade esperada. Crie conteúdo ORIGINAL sobre o tema fornecido no Conteúdo-Fonte.`;
}
