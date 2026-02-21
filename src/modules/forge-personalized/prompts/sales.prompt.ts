/**
 * sales.prompt.ts — Sales / AIDA content type prompt module
 *
 * Story 2.3 (CE-03) — AC3, AC7, AC8
 * PRD §6.1 TYPE 3
 *
 * Key rules: AIDA structure, never mention price, one benefit per slide,
 * 'você' throughout, keyword in bold **[PALAVRA]**, 200–500 chars.
 * Requires product data (throws if missing — AC8).
 */

import type { UserProfile } from '../../../shared/types/post-themes.types.js';
import type { ContentDepth } from '../../../shared/types/content-types.types.js';

// ── System Prompt ─────────────────────────────────────────────

export function buildSystemPrompt(userProfile: UserProfile & { niche?: string | null }): string {
    const niche = userProfile.niche ?? userProfile.target_audience ?? 'o nicho do criador';

    return `Você é um COPYWRITER DE VENDAS DE ELITE para Instagram, especialista em criar carrosséis de conversão sobre "${niche}".

Sua missão é criar carrosséis de venda que:
- Seguem a estrutura AIDA (Atenção → Interesse → Desejo → Ação)
- NUNCA mencionam preço — o objetivo é a conversa na DM
- Comunicam um benefício por slide (não sobrecarregue)
- Usam "você" em todo o conteúdo (nunca "você" distante, sempre próximo)
- Criam desejo antes de fazer a oferta
- A palavra-chave do produto DEVE aparecer em **negrito** no CTA

Público-alvo: ${userProfile.target_audience ?? niche}
Tom de voz: ${userProfile.voice_tone}

PRINCÍPIOS DO COPYWRITER DE ELITE:
1. Comece pela DOR — a atenção vem do reconhecimento do problema
2. Nunca mencione preço, facilite o contato
3. Um benefício por slide — mais confunde, menos converte
4. Use "você" em todas as frases — a pessoa deve se sentir falada diretamente
5. Prova > promessa — resultados concretos vendem mais que adjetivos
6. O CTA final DEVE ter a palavra-chave em **negrito** e instrução clara
7. 200-500 chars por slide — direto e persuasivo`;
}

// ── Rules Block ───────────────────────────────────────────────

export function buildRulesBlock(depth: ContentDepth): string {
    const rules: Record<ContentDepth, string[]> = {
        shallow: [
            'REGRAS SALES / AIDA (SUPERFICIAL):',
            '- Estrutura: Atenção → Interesse → Desejo → Ação → CTA',
            '- 5-7 slides, foco no caminho mais curto até o CTA',
            '- Body_markdown: 150-300 chars — linguagem direta e emocional',
            '- NUNCA mencione preço',
            '- CTA: palavra-chave em **negrito** + instrução "comenta X que te envio na DM"',
        ],
        balanced: [
            'REGRAS SALES / AIDA (EQUILIBRADO):',
            '- Estrutura completa: Attention → Interest (×2) → Desire (×2) → Proof → Action → CTA',
            '- Body_markdown: 200-400 chars por slide',
            '- Slide de prova social ou resultado antes do CTA',
            '- Objeção implícita respondida no slide de Desejo',
            '- NUNCA mencione preço — focue no benefício e na conversa',
        ],
        dense: [
            'REGRAS SALES / AIDA (DENSO):',
            '- Estrutura expandida com slide de objeção explícita',
            '- Body_markdown: 250-500 chars por slide',
            '- Inclua slide de prova (resultado real ou número)',
            '- Slide de objeção: responde a principal dúvida sem mencionar preço',
            '- Dois slides de CTA (um no meio, um no final) para aumentar conversão',
            '- NUNCA mencione preço em nenhum slide',
        ],
    };

    return rules[depth].join('\n');
}

// ── Few-Shot Example ──────────────────────────────────────────

export function getFewShotExample(depth: ContentDepth): string {
    const example = {
        theme: 'Método X — Aceleração de resultados em 30 dias',
        total_slides: 6,
        slides: [
            {
                slide: 1,
                role: 'attention',
                headline: 'Você está trabalhando o dobro e vendo metade do resultado?',
                image: true,
            },
            {
                slide: 2,
                role: 'interest',
                headline: 'Existe um método que inverte essa equação em 30 dias',
                body_markdown:
                    'Não é sobre trabalhar mais horas. É sobre eliminar o que não funciona e dobrar o que funciona. Os resultados chegam mais rápido quando você para de dividir atenção entre 10 coisas e foca no que realmente move o ponteiro.',
                image: false,
            },
            {
                slide: 3,
                role: 'desire',
                headline: 'O que você vai conquistar com esse método',
                body_markdown:
                    'Você vai ter clareza do que focar todos os dias. Vai parar de acordar sem saber por onde começar. E vai ver resultados concretos nas próximas semanas — não nos próximos meses. Tudo isso sem trabalhar mais, mas trabalhando diferente.',
                image: false,
            },
            {
                slide: 4,
                role: 'proof',
                headline: 'Resultados reais de quem aplicou',
                body_markdown:
                    'Clientes relataram duplicar sua produtividade em 3 semanas. Outros conseguiram fechar 2x mais contratos no mesmo mês. O denominador comum: clareza de foco e eliminação do que não gera resultado.',
                image: false,
            },
            {
                slide: 5,
                role: 'action',
                headline: 'Como ter acesso a esse método',
                body_markdown:
                    'É simples: comenta **MÉTODO** aqui embaixo que te mando todos os detalhes na DM. Sem compromisso, sem spam — só uma conversa sobre como esse processo pode funcionar para o seu caso específico.',
                image: false,
            },
            {
                slide: 6,
                role: 'cta',
                headline: 'Comenta **MÉTODO** agora e receba as informações no direct 📩',
                image: false,
            },
        ],
        caption:
            'Trabalhar mais não é a resposta — trabalhar com clareza e foco é.\n\nSe você quer resultados diferentes, precisa de um método diferente. Comenta MÉTODO e te explico como funciona.\n\n---\n\nprodutividade, método, resultados, foco, crescimento profissional\n\n---\n\n#Produtividade #Método #Resultados #Foco #CrescimentoProfissional',
        hashtags: ['#Produtividade', '#Método', '#Resultados', '#Foco', '#CrescimentoProfissional'],
        cta_text: 'Comenta MÉTODO',
        best_posting_time: '19:00 BRT',
    };

    return `\n# EXEMPLO DE FORMATO (referência de estrutura — NÃO copie o tema):\n${JSON.stringify(example, null, 2)}\n\nIMPORTANTE: Use os dados reais do produto/oferta fornecidos no bloco de Produto acima. O exemplo é apenas referência de estrutura e qualidade.`;
}
