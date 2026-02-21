import type { PillarId } from './forge-shadowfeed.types.js';

// ── § 11 — Few-shot examples per pillar ──────────────────────
// 1–2 complete carousel JSON examples that demonstrate the expected voice,
// structure, and output format for each pillar.

export interface FewShotExample {
  theme: string;
  total_slides: number;
  slides: Array<{
    slide: number;
    role: string;
    headline: string;
    subtitle?: string | null;
    body_markdown?: string | null;
    image: boolean;
    list?: string[] | null;
    number_label?: string | null;
  }>;
  caption: string;
  hashtags: string[];
  cta_text: string;
  best_posting_time: string;
}

export const PILLAR_FEW_SHOTS: Record<PillarId, FewShotExample[]> = {
  'wake-up-slap': [
    {
      theme: 'O custo oculto de criar conteúdo na mão',
      total_slides: 6,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Você gastou 12 horas esse mês criando conteúdo.',
          subtitle: 'Quanto isso custou em dinheiro real?',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'content',
          headline: 'A conta que ninguém faz.',
          body_markdown:
            'Se sua hora vale R$ 80 → 12h = **R$ 960 em trabalho não-faturável**.\n\nIsso sem contar o custo mental de ficar olhando pra tela em branco.',
          image: false,
        },
        {
          slide: 3,
          role: 'content',
          headline: 'E o retorno?',
          body_markdown:
            'Alcance orgânico médio no Instagram BR: 5–8% dos seguidores.\n\nVocê pagou R$ 960 pra falar com 80 pessoas.',
          image: false,
          list: ['Tempo gasto: 12h', 'Custo real: R$ 960', 'Alcance médio: 80 pessoas', 'Custo por pessoa alcançada: R$ 12'],
        },
        {
          slide: 4,
          role: 'pattern-interrupt',
          headline: 'Uma ferramenta de automação faz isso em 4 minutos.',
          subtitle: null,
          body_markdown: 'Custo: R$ 1,60 por carousel gerado.\n\nSó pra você ter uma referência.',
          image: false,
        },
        {
          slide: 5,
          role: 'conflict',
          headline: 'Você não está sendo criativo. Está sendo ineficiente.',
          body_markdown:
            'Criatividade é estratégia. Execução repetitiva é operação.\n\nVocê não precisa fazer operação manualmente em 2025.',
          image: false,
        },
        {
          slide: 6,
          role: 'cta',
          headline: 'Continua fazendo manual. Ou não.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        '12 horas de trabalho. R$ 960 de custo. 80 pessoas alcançadas.\n\nIsso é criação de conteúdo manual em 2025.\n\nA máquina faz o mesmo em 4 minutos por R$ 1,60. Sem reunião. Sem brief. Sem espera.',
      hashtags: ['#shadowfeed', '#contentmachine', '#marketingdigital', '#automacao', '#criacaodeconteudo'],
      cta_text: 'shadowfeed.io — pra quem decidiu parar de desperdiçar tempo',
      best_posting_time: '09:00',
    },
  ],

  'proof-of-machine': [
    {
      theme: 'ShadowFeed vs agência de conteúdo: a comparação real',
      total_slides: 8,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Uma agência de conteúdo cobra em média R$ 3.500/mês.',
          subtitle: 'O ShadowFeed custa R$ 50.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'content',
          headline: 'O que a agência entrega.',
          body_markdown: null,
          list: ['3–5 posts por semana', 'Turnaround: 3–7 dias por peça', 'Reuniões semanais de alinhamento', 'Revisões até 2x por peça', 'Humano com dia ruim pode afetar a entrega'],
          image: false,
        },
        {
          slide: 3,
          role: 'content',
          headline: 'O que a máquina entrega.',
          body_markdown: null,
          list: ['Até 560 posts/mês no plano Booster', 'Turnaround: 4 minutos por carousel', 'Zero reuniões', 'Revisão? Regenera em 4 min', 'A máquina não tem dia ruim'],
          image: false,
        },
        {
          slide: 4,
          role: 'content',
          headline: 'Consistência não é opcional.',
          body_markdown:
            'O algoritmo do Instagram recompensa frequência.\n\nQuem posta todos os dias vence quem posta perfeitamente uma vez por semana.\n\nA máquina posta todos os dias. Você não precisa fazer nada.',
          image: false,
        },
        {
          slide: 5,
          role: 'content',
          headline: 'Custo por post publicado.',
          body_markdown: null,
          list: [
            'Agência: R$ 175–700 por post',
            'Freelancer: R$ 50–200 por post',
            'ShadowFeed Starter: R$ 0,36 por carousel',
            'ShadowFeed Booster: R$ 0,07 por carousel',
          ],
          image: false,
        },
        {
          slide: 6,
          role: 'content',
          headline: '4 pilares. Postagem automática. Nenhuma decisão sua.',
          body_markdown:
            'TAPA NA CARA → 09h\nPROVA DA MÁQUINA → 13h\nESCOLA SHADOW → 17h\nA OFERTA → 20h\n\nEstrutura validada. Rotação automática. Você não precisa pensar.',
          image: false,
        },
        {
          slide: 7,
          role: 'engagement',
          headline: 'Qual das duas opções faz mais sentido pro seu negócio?',
          body_markdown: 'R$ 3.500/mês por 5 posts/semana.\nOu R$ 50/mês por consistência diária automatizada.',
          image: false,
        },
        {
          slide: 8,
          role: 'cta',
          headline: 'Os números estão na tela.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        'R$ 3.500 vs R$ 50.\n\nMesmo trabalho. Resultados comparáveis em volume e consistência.\n\nA diferença: um escala. O outro não.\n\nOs números estão na tela. O próximo passo é seu.',
      hashtags: ['#shadowfeed', '#contentmachine', '#iamarketing', '#marketingdeconteudo', '#instagrambrasil'],
      cta_text: 'shadowfeed.io — a máquina que nunca para',
      best_posting_time: '13:00',
    },
  ],

  'shadow-school': [
    {
      theme: 'Por que o algoritmo pune quem posta sem consistência',
      total_slides: 9,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'O Instagram não te pune por postar mal. Te pune por sumir.',
          subtitle: 'E a maioria das pessoas erra exatamente aqui.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'content',
          headline: 'Como o algoritmo funciona de verdade.',
          body_markdown:
            'O Instagram usa um sistema de distribuição baseado em engajamento recente.\n\nSe você ficou 2 semanas sem postar, o algoritmo te trata como conta inativa.',
          image: false,
        },
        {
          slide: 3,
          role: 'content',
          headline: 'O conceito de "momentum algorítmico".',
          body_markdown:
            'Cada post bem-recebido amplifica o alcance do próximo.\n\nCada gap sem postagem reinicia esse ciclo do zero.\n\nConsistência não é opcional — é a estratégia.',
          image: false,
          number_label: '01',
        },
        {
          slide: 4,
          role: 'content',
          headline: '3 métricas que o algoritmo pesa.',
          body_markdown: null,
          list: [
            '**Frequência**: com que regularidade você posta',
            '**Saves**: indicador de valor percebido pelo usuário',
            '**Tempo de visualização**: o quanto o conteúdo prende',
          ],
          image: false,
          number_label: '02',
        },
        {
          slide: 5,
          role: 'content',
          headline: 'Por que saves importam mais que likes.',
          body_markdown:
            'Like = "achei interessante".\nSave = "vou usar isso".\n\nO algoritmo trata saves como proxy de qualidade real.\n\nConteúdo educacional e de utilidade gera 3–5x mais saves que conteúdo inspiracional.',
          image: false,
          number_label: '03',
        },
        {
          slide: 6,
          role: 'content',
          headline: 'A janela de distribuição.',
          body_markdown:
            'Nas primeiras 2h após publicação, o Instagram mede engajamento por amostragem.\n\nSe o engajamento inicial for forte → distribui para mais pessoas.\nSe for fraco → limita o alcance e arquiva o post.',
          image: false,
          number_label: '04',
        },
        {
          slide: 7,
          role: 'content',
          headline: 'Implicação prática: horário importa.',
          body_markdown:
            'Postar quando sua audiência está ativa aumenta engajamento na janela inicial.\n\nIsso amplifica distribuição orgânica.\n\nNão é "hack" — é física do algoritmo.',
          image: false,
          number_label: '05',
        },
        {
          slide: 8,
          role: 'pattern-interrupt',
          headline: 'Um sistema automatizado resolve tudo isso sem você pensar.',
          body_markdown:
            'Frequência diária → automática.\nHorários otimizados por pillar → pré-configurados.\nConsistência de 365 dias → garantida.\n\nNão é vantagem injusta. É só eficiência.',
          image: false,
        },
        {
          slide: 9,
          role: 'cta',
          headline: 'Você aprendeu. Agora decide.',
          subtitle: 'Faz manual ou deixa a máquina.',
          body_markdown: 'shadowfeed.io',
          image: false,
        },
      ],
      caption:
        'O algoritmo não te pune por postar mal.\n\nTe pune por sumir.\n\nConsistência diária → momentum algorítmico → alcance crescente.\n\nIsso não é teoria. É a física de como o Instagram distribui conteúdo.\n\nE a máquina faz isso automaticamente.',
      hashtags: ['#shadowfeed', '#contentmachine', '#instagramtips', '#marketingdeconteudo', '#criacaodeconteudo'],
      cta_text: 'shadowfeed.io — consistência automática',
      best_posting_time: '17:00',
    },
  ],

  'the-offer': [
    {
      theme: 'O que você ganha com 160 tokens grátis no ShadowFeed',
      total_slides: 6,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Você está pagando R$ 1.500 pra agência ou perdendo horas todo mês criando sozinho.',
          subtitle: 'Existe uma terceira opção.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'content',
          headline: 'O que o ShadowFeed faz.',
          body_markdown: null,
          list: [
            'Gera carrosséis em 4 pilares de conteúdo',
            'Publica automaticamente via Instagram API',
            'Rotaciona temas e hashtags',
            'Opera 24/7 sem intervenção manual',
            'Conteúdo 100% em PT-BR com persona definida',
          ],
          image: false,
        },
        {
          slide: 3,
          role: 'content',
          headline: 'Os planos.',
          body_markdown: null,
          list: [
            'Starter: R$ ~50/mês → 1.000 tokens (~140 posts)',
            'Micro-Op: R$ ~100/mês → 2.000 tokens (~280 posts)',
            'Booster: R$ ~200/mês → 4.000 tokens (~560 posts)',
            'Tokens extras nunca expiram',
            '160 tokens grátis pra começar',
          ],
          image: false,
        },
        {
          slide: 4,
          role: 'conflict',
          headline: 'A comparação honesta.',
          body_markdown: null,
          list: [
            'Agência: R$ 1.500–5.000/mês | 3–5 posts/semana',
            'Freelancer: R$ 500–2.000/mês | 2–4 posts/semana',
            'ChatGPT sozinho: texto sem publicação, sem pilares, sem agenda',
            'ShadowFeed Starter: R$ ~50/mês | até 140 posts/mês | automático',
          ],
          image: false,
        },
        {
          slide: 5,
          role: 'conclusion',
          headline: 'Se o objetivo é consistência sem custo de agência, a escolha é óbvia.',
          body_markdown:
            'Não é pra todo mundo. Se você precisa de conteúdo altamente customizado por nicho específico, talvez precise de um humano.\n\nMas se você precisa de presença consistente, escalável e previsível — a máquina resolve.',
          image: false,
        },
        {
          slide: 6,
          role: 'cta',
          headline: '160 tokens grátis pra começar agora.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        'R$ ~50/mês. 140 posts. Automático.\n\nIsso é o plano Starter do ShadowFeed.\n\n160 tokens grátis pra testar antes de decidir.\n\nSe fizer sentido, fica. Se não fizer, não fica. Sem pressão.',
      hashtags: ['#shadowfeed', '#contentmachine', '#marketingdigital', '#instagrambrasil', '#automacao'],
      cta_text: 'shadowfeed.io — 160 tokens grátis pra começar',
      best_posting_time: '20:00',
    },
  ],
};
