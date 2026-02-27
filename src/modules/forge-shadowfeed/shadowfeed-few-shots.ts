import type { PillarId } from './forge-shadowfeed.types.js';

// ── § 11 — Few-shot examples per pillar (v2 — Decoded Content Machine) ──────
// 1 complete carousel JSON example per pillar demonstrating:
// - Correct 7-zone slide roles (hook → context → content → tension → soft-cta → cta)
// - 3-phase copy progression (interruption → development → conversion)
// - Pillar-appropriate contextual CTA
// - Declarative hook (never a question)

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
  'educational-value': [
    {
      theme: 'O algoritmo do Instagram recompensa frequência, não qualidade',
      total_slides: 9,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: '92% das contas que cresceram em 2024 postaram diariamente.',
          subtitle: 'As que postaram "quando inspiradas" perderam alcance.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'context',
          headline: 'O Instagram mudou as regras.',
          body_markdown:
            'Em 2023, qualidade bastava. Post bom = alcance.\n\nEm 2024, o algoritmo passou a pesar frequência como fator primário de distribuição.\n\nSe você sumiu por 5 dias, o algoritmo te trata como conta inativa.',
          image: false,
        },
        {
          slide: 3,
          role: 'context',
          headline: 'O conceito de momentum algorítmico.',
          body_markdown:
            'Cada post bem-recebido amplifica o alcance do próximo.\n\nCada gap sem postagem reinicia esse ciclo do zero.\n\nConsistência não é opcional — é a infraestrutura.',
          image: false,
        },
        {
          slide: 4,
          role: 'content',
          headline: '3 métricas que o algoritmo realmente pesa.',
          body_markdown: null,
          list: [
            '**Frequência**: regularidade de publicação (diária > semanal)',
            '**Saves**: proxy de qualidade real (3-5x mais peso que likes)',
            '**Tempo de visualização**: o quanto o conteúdo prende no slide',
          ],
          image: false,
          number_label: '01',
        },
        {
          slide: 5,
          role: 'content',
          headline: 'A janela de distribuição dura 2 horas.',
          body_markdown:
            'Nas primeiras 2h após publicação, o Instagram mede engajamento por amostragem.\n\nEngajamento forte → distribui para mais pessoas.\nEngajamento fraco → arquiva o post.\n\nHorário de publicação é infraestrutura, não detalhe.',
          image: false,
          number_label: '02',
        },
        {
          slide: 6,
          role: 'content',
          headline: 'Por que saves importam mais que likes.',
          body_markdown:
            'Like = "achei interessante".\nSave = "vou usar isso".\n\nConteúdo educacional gera 3-5x mais saves que conteúdo inspiracional.\n\nO algoritmo sabe a diferença.',
          image: false,
          number_label: '03',
        },
        {
          slide: 7,
          role: 'tension',
          headline: 'Um sistema automatizado resolve tudo isso sem você pensar.',
          body_markdown:
            'Frequência diária → automática.\nHorários otimizados → pré-configurados.\nConsistência de 365 dias → garantida.\n\nVocê está competindo contra máquinas fazendo tudo manualmente.',
          image: false,
        },
        {
          slide: 8,
          role: 'soft-cta',
          headline: 'Você aprendeu a física do algoritmo.',
          body_markdown:
            'Agora tem duas opções:\nAplicar manualmente todos os dias.\nOu deixar o sistema aplicar por você.',
          image: false,
        },
        {
          slide: 9,
          role: 'cta',
          headline: 'Salva esse post. Você vai precisar.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        '92% das contas que cresceram em 2024 postaram diariamente.\n\nAs que esperaram "inspiração" perderam alcance.\n\nConsistência não é virtude. É infraestrutura algorítmica.\n\nE a máquina faz isso automaticamente.',
      hashtags: ['#shadowfeed', '#contentmachine', '#instagramtips', '#marketingdeconteudo', '#criacaodeconteudo'],
      cta_text: 'Salva esse post, você vai precisar.',
      best_posting_time: '09:00',
    },
  ],

  'wake-up-slap': [
    {
      theme: 'O custo real de criar conteúdo manualmente',
      total_slides: 7,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Você gastou 12 horas esse mês criando conteúdo.',
          subtitle: 'Custou R$ 960 em tempo não-faturável.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'context',
          headline: 'A conta que ninguém faz.',
          body_markdown:
            'Se sua hora vale R$ 80 → 12h = **R$ 960 em trabalho invisível**.\n\nIsso sem contar o custo mental de ficar olhando pra tela em branco decidindo o que postar.',
          image: false,
        },
        {
          slide: 3,
          role: 'context',
          headline: 'E o retorno dessas 12 horas.',
          body_markdown:
            'Alcance orgânico médio no Instagram BR: 5-8% dos seguidores.\n\nVocê pagou R$ 960 pra falar com 80 pessoas.\n\nCusto por pessoa alcançada: R$ 12.',
          image: false,
        },
        {
          slide: 4,
          role: 'content',
          headline: 'A comparação que dói.',
          body_markdown: null,
          list: [
            'Tempo gasto manual: 12h/mês',
            'Custo real: R$ 960/mês',
            'Posts produzidos: 8-12',
            'Automação: 4 min por carousel, R$ 1,60',
            'Posts produzidos: ilimitados no plano',
          ],
          image: false,
        },
        {
          slide: 5,
          role: 'tension',
          headline: 'Você não está sendo criativo. Está sendo ineficiente.',
          body_markdown:
            'Criatividade é estratégia. Execução repetitiva é operação.\n\nVocê está confundindo as duas coisas.\n\nE pagando caro por isso.',
          image: false,
        },
        {
          slide: 6,
          role: 'soft-cta',
          headline: 'A matemática não mente.',
          body_markdown:
            'R$ 960 por 12 posts manuais.\nOu R$ 50 por 140 posts automáticos.\n\nNão é opinião. É aritmética.',
          image: false,
        },
        {
          slide: 7,
          role: 'cta',
          headline: 'Continua fazendo manual. Ou não.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        '12 horas de trabalho. R$ 960 de custo. 80 pessoas alcançadas.\n\nIsso é criação de conteúdo manual em 2025.\n\nA máquina faz o mesmo em 4 minutos por R$ 1,60.',
      hashtags: ['#shadowfeed', '#contentmachine', '#marketingdigital', '#automacao', '#criacaodeconteudo'],
      cta_text: 'Comenta "ACORDEI" se você concorda.',
      best_posting_time: '11:00',
    },
  ],

  'brand-breakdown': [
    {
      theme: 'Como a Nike domina o Instagram sem vender tênis',
      total_slides: 10,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Nike não vende tênis no Instagram.',
          subtitle: 'Vende identidade. A fórmula é replicável.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'context',
          headline: 'Nike tem 306M de seguidores.',
          body_markdown:
            'Mas menos de 5% dos posts mostram produto.\n\nO feed parece editorial de moda, não catálogo.\n\nIsso é intencional. E funciona.',
          image: false,
        },
        {
          slide: 3,
          role: 'context',
          headline: 'A distribuição de conteúdo da Nike.',
          body_markdown: null,
          list: [
            '60% aspiracional (atletas, superação, lifestyle)',
            '25% produto em contexto (nunca catálogo)',
            '10% UGC e comunidade',
            '5% lançamento direto',
          ],
          image: false,
        },
        {
          slide: 4,
          role: 'content',
          headline: 'O padrão de hook que se repete.',
          body_markdown:
            'Frases curtas. Máximo 6 palavras no headline.\n\nSempre em segunda pessoa: "You", "Your".\n\nNunca descritivo. Sempre imperativo ou provocativo.',
          image: false,
          number_label: '01',
        },
        {
          slide: 5,
          role: 'content',
          headline: 'Consistência visual: a arma invisível.',
          body_markdown:
            'Paleta fixa. Tipografia fixa. Grid planejado.\n\nO feed da Nike parece um editorial — não um catálogo.\n\nIsso é engenharia de marca, não criatividade aleatória.',
          image: false,
          number_label: '02',
        },
        {
          slide: 6,
          role: 'content',
          headline: 'O que você pode replicar.',
          body_markdown: null,
          list: [
            'Ratio aspiracional vs produto: mínimo 3:1',
            'Hook em 6 palavras ou menos',
            'Consistência visual acima de tudo',
            'Nunca vender diretamente — posicionar',
          ],
          image: false,
          number_label: '03',
        },
        {
          slide: 7,
          role: 'content',
          headline: 'O erro fatal de copiar superficialmente.',
          body_markdown:
            'Copiar a estética sem copiar a estrutura não funciona.\n\nA Nike não é bonita por acaso. É bonita porque é planejada.\n\nSistema > estética.',
          image: false,
          number_label: '04',
        },
        {
          slide: 8,
          role: 'tension',
          headline: 'A Nike posta 4x por semana. Consistência militarmente executada.',
          body_markdown:
            'Sem gaps. Sem "estou sem inspiração". Sem semana de férias.\n\nEles têm uma equipe de 20 pessoas pra isso.\n\nVocê tem... você.',
          image: false,
        },
        {
          slide: 9,
          role: 'soft-cta',
          headline: 'A fórmula existe. A execução é o gargalo.',
          body_markdown:
            'Grandes marcas têm equipes dedicadas.\n\nVocê pode ter um sistema que executa a mesma fórmula.',
          image: false,
        },
        {
          slide: 10,
          role: 'cta',
          headline: 'Marca um amigo que precisa ver isso.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        'Nike não vende tênis no Instagram. Vende identidade.\n\n60% aspiracional. 25% produto em contexto. Nunca catálogo.\n\nA fórmula é replicável. A execução sem sistema, não.',
      hashtags: ['#shadowfeed', '#contentmachine', '#brandstrategy', '#marketingdigital', '#instagrambrasil'],
      cta_text: 'Marca um amigo que precisa ver isso.',
      best_posting_time: '14:00',
    },
  ],

  'proof-social': [
    {
      theme: 'ShadowFeed vs agência: a comparação em números reais',
      total_slides: 8,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Uma agência cobra R$ 3.500/mês por 5 posts/semana.',
          subtitle: 'O ShadowFeed entrega consistência diária por R$ 50.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'context',
          headline: 'O que a agência entrega pelo preço.',
          body_markdown: null,
          list: [
            '3-5 posts por semana',
            'Turnaround: 3-7 dias por peça',
            'Reuniões semanais de alinhamento',
            'Revisões até 2x por peça',
            'Humano com dia ruim pode afetar a entrega',
          ],
          image: false,
        },
        {
          slide: 3,
          role: 'context',
          headline: 'O que a máquina entrega pelo preço.',
          body_markdown: null,
          list: [
            'Até 140 posts/mês no plano Starter',
            'Turnaround: 4 minutos por carousel',
            'Zero reuniões',
            'Revisão? Regenera em 4 min',
            'A máquina não tem dia ruim',
          ],
          image: false,
        },
        {
          slide: 4,
          role: 'content',
          headline: 'Custo por post publicado.',
          body_markdown: null,
          list: [
            'Agência: R$ 175-700 por post',
            'Freelancer: R$ 50-200 por post',
            'ShadowFeed Starter: R$ 0,36 por carousel',
            'ShadowFeed Booster: R$ 0,07 por carousel',
          ],
          image: false,
        },
        {
          slide: 5,
          role: 'content',
          headline: '5 pilares. Postagem automática. Zero decisão sua.',
          body_markdown:
            'EDUCATIONAL VALUE → 09h\nWAKE-UP SLAP → 11h\nBRAND BREAKDOWN → 14h\nPROOF SOCIAL → 17h\nTHE OFFER → 20h\n\nRotação validada. Execução automática.',
          image: false,
        },
        {
          slide: 6,
          role: 'tension',
          headline: 'A agência escala adicionando pessoas. O sistema escala sozinho.',
          body_markdown:
            'Mais posts na agência = mais custo.\nMais posts no ShadowFeed = mesmo preço.\n\nEscalabilidade não é feature. É a diferença fundamental.',
          image: false,
        },
        {
          slide: 7,
          role: 'soft-cta',
          headline: 'Os números estão na tela.',
          body_markdown:
            'R$ 3.500 por 20 posts manuais.\nOu R$ 50 por 140 posts automáticos.\n\nA decisão é só matemática.',
          image: false,
        },
        {
          slide: 8,
          role: 'cta',
          headline: 'Link na bio para ver o sistema.',
          subtitle: 'shadowfeed.io',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        'R$ 3.500 vs R$ 50.\n\nMesmo trabalho. Volume incomparável.\n\nA diferença: um escala. O outro contrata mais gente.\n\nOs números estão na tela.',
      hashtags: ['#shadowfeed', '#contentmachine', '#iamarketing', '#marketingdeconteudo', '#instagrambrasil'],
      cta_text: 'Link na bio para ver o sistema.',
      best_posting_time: '17:00',
    },
  ],

  'the-offer': [
    {
      theme: 'O que você ganha com 160 tokens grátis no ShadowFeed',
      total_slides: 8,
      slides: [
        {
          slide: 1,
          role: 'hook',
          headline: 'Você está pagando R$ 1.500/mês pra agência ou perdendo 12h/mês criando sozinho.',
          subtitle: 'Existe uma terceira opção.',
          body_markdown: null,
          image: true,
        },
        {
          slide: 2,
          role: 'context',
          headline: 'O cenário atual de criação de conteúdo.',
          body_markdown:
            'Agência: R$ 1.500-5.000/mês. 3-7 dias por peça. Reuniões semanais.\n\nFreelancer: R$ 500-2.000/mês. Depende de uma pessoa. Sem escala.\n\nChatGPT sozinho: gera texto, mas não publica, não agenda, não tem pilares.',
          image: false,
        },
        {
          slide: 3,
          role: 'context',
          headline: 'O que o ShadowFeed faz diferente.',
          body_markdown: null,
          list: [
            'Gera carrosséis em 5 pilares de conteúdo validados',
            'Publica automaticamente via Instagram API',
            'Rotaciona temas, hashtags e estilos de caption',
            'Opera 24/7 sem intervenção manual',
            'Conteúdo 100% em PT-BR com persona definida',
          ],
          image: false,
        },
        {
          slide: 4,
          role: 'content',
          headline: 'Os planos.',
          body_markdown: null,
          list: [
            'Starter: R$ ~50/mês → 1.000 tokens (~140 posts)',
            'Micro-Op: R$ ~100/mês → 2.000 tokens (~280 posts)',
            'Booster: R$ ~200/mês → 4.000 tokens (~560 posts)',
            'Tokens extras: R$ 0,012 cada — nunca expiram',
          ],
          image: false,
        },
        {
          slide: 5,
          role: 'content',
          headline: 'A comparação honesta.',
          body_markdown: null,
          list: [
            'Agência: R$ 1.500-5.000/mês | 3-5 posts/semana',
            'Freelancer: R$ 500-2.000/mês | 2-4 posts/semana',
            'ChatGPT: texto sem publicação, sem pilares, sem agenda',
            'ShadowFeed Starter: R$ ~50/mês | até 140 posts/mês | automático',
          ],
          image: false,
        },
        {
          slide: 6,
          role: 'tension',
          headline: 'R$ 50/mês contra R$ 3.500/mês. Pelo mesmo resultado em volume.',
          body_markdown:
            'A agência cobra 70x mais.\nProduz 7x menos posts.\nE precisa de reuniões pra decidir o que fazer.\n\nA matemática é brutal.',
          image: false,
        },
        {
          slide: 7,
          role: 'soft-cta',
          headline: 'Se o objetivo é presença consistente, a escolha é aritmética.',
          body_markdown:
            'Não é pra todo mundo. Se você precisa de conteúdo altamente customizado por nicho ultra-específico, talvez precise de um humano.\n\nMas se você precisa de presença escalável e previsível — a máquina resolve.',
          image: false,
        },
        {
          slide: 8,
          role: 'cta',
          headline: 'Link na bio — planos a partir de R$ 50/mês.',
          subtitle: 'shadowfeed.io — 160 tokens grátis pra começar.',
          body_markdown: null,
          image: false,
        },
      ],
      caption:
        'R$ ~50/mês. 140 posts. Automático.\n\nIsso é o plano Starter do ShadowFeed.\n\n160 tokens grátis pra testar antes de decidir.\n\nSem pressão. Sem reunião. Sem brief.',
      hashtags: ['#shadowfeed', '#contentmachine', '#marketingdigital', '#instagrambrasil', '#automacao'],
      cta_text: 'Link na bio — planos a partir de R$ 50/mês.',
      best_posting_time: '20:00',
    },
  ],
};
