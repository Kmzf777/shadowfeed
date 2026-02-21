/**
 * educational.prompt.ts — Educational content type prompt module
 *
 * Story 2.3 (CE-03) — AC3, AC7
 * PRD §6.1 TYPE 1
 *
 * Key rules: standalone value per slide, open curiosity loop on hook,
 * concrete data (%, studies), applicable insights, min 400 chars body_markdown
 * on content slides.
 */

import type { UserProfile } from '../../../shared/types/post-themes.types.js';
import type { ContentDepth } from '../../../shared/types/content-types.types.js';

// ── System Prompt ─────────────────────────────────────────────

/**
 * AC3 — specialized system prompt for educational content.
 * AC7 — teaches, provides standalone value per slide.
 */
export function buildSystemPrompt(userProfile: UserProfile & { niche?: string | null }): string {
    const niche = userProfile.niche ?? userProfile.target_audience ?? 'o nicho do criador';
    const expertise = (userProfile as any).expertise_statement ?? userProfile.user_prompt ?? 'especialista no tema';

    return `Você é um EDUCADOR DE ELITE para Instagram com domínio profundo em "${niche}".

Sua missão é criar carrosséis educacionais que:
- Entregam valor REAL e aplicável em cada slide — cada slide deve funcionar de forma standalone
- Usam dados concretos: %, estudos, pesquisas, exemplos específicos
- Criam lacunas de curiosidade sem clickbait vazio
- Ensinam como a audiência pensa, não apenas o que fazer
- Transformam conceitos complexos em insights digeríveis e memoráveis

O criador de conteúdo é: ${expertise}
Público-alvo: ${userProfile.target_audience ?? niche}

PRINCÍPIOS DO EDUCADOR DE ELITE:
1. Cada slide = um insight completo e aplicável (não depende dos outros para fazer sentido)
2. Prefira dados a opiniões — quantifique quando possível
3. Conecte sempre o conceito ao contexto do público
4. O hook abre uma lacuna de curiosidade genuína que o carrossel fecha
5. Nunca ensine "o que" sem ensinar "por que" e "como"
6. Slides de conteúdo: mínimo 400 caracteres em body_markdown com profundidade real

Você escreve no tom: ${userProfile.voice_tone}`;
}

// ── Rules Block ───────────────────────────────────────────────

/**
 * AC3 — depth-specific additional rules for educational content.
 */
export function buildRulesBlock(depth: ContentDepth): string {
    const rules: Record<ContentDepth, string[]> = {
        shallow: [
            'REGRAS EDUCACIONAL (SUPERFICIAL):',
            '- Foque em 1 conceito central bem explicado',
            '- Analogias simples e exemplos do cotidiano',
            '- Body_markdown: 200-400 chars por slide de conteúdo',
            '- Linguagem acessível — sem jargão desnecessário',
            '- Hook deve prometer uma resposta simples e valor imediato',
        ],
        balanced: [
            'REGRAS EDUCACIONAL (EQUILIBRADO):',
            '- Cubra 2-4 subtemas relacionados com profundidade moderada',
            '- Um dado ou estudo por slide quando relevante',
            '- Body_markdown: 400-700 chars por slide de conteúdo',
            '- Pattern-interrupt: use um slide de contraste ou revelação inesperada',
            '- Conclusão que sintetiza o aprendizado e aponta próximo passo',
        ],
        dense: [
            'REGRAS EDUCACIONAL (DENSO):',
            '- Framework completo ou tópico profundo com múltiplas camadas',
            '- Dados, estudos, pesquisas sempre que disponíveis',
            '- Body_markdown: 400-800 chars por slide de conteúdo (mais profundidade)',
            '- Include contraste, exceções e nuances do tema',
            '- Pattern-interrupt obrigatório para manter atenção no meio do carrossel',
            '- Conclusão com síntese e insight transformador aplicável',
        ],
    };

    return rules[depth].join('\n');
}

// ── Few-Shot Example ──────────────────────────────────────────

/**
 * AC3 — compact few-shot example for educational content.
 * Kept under 800 tokens per PRD §16 constraint.
 */
export function getFewShotExample(depth: ContentDepth): string {
    const examples: Record<ContentDepth, object> = {
        shallow: {
            theme: 'Por que 90% dos posts no Instagram morrem em 24h',
            total_slides: 5,
            slides: [
                {
                    slide: 1,
                    role: 'hook',
                    headline: 'Você sabe por que seu post sumiu em 24 horas?',
                    image: true,
                },
                {
                    slide: 2,
                    role: 'content',
                    headline: 'O algoritmo do Instagram funciona em janelas de tempo',
                    body_markdown:
                        'Nos primeiros 60 minutos após a publicação, o algoritmo testa seu conteúdo com 3-7% dos seus seguidores. Se o engajamento ficar abaixo de 2%, o alcance é limitado automaticamente. Isso explica por que o horário de publicação impacta tanto.',
                    image: false,
                },
                {
                    slide: 3,
                    role: 'content',
                    headline: 'O que ensinamos que mantém o alcance acima da média',
                    body_markdown:
                        'Posts que geram salvamentos têm 2x mais alcance do que posts que só geram curtidas. O algoritmo interpreta o salvamento como "esse conteúdo é tão valioso que a pessoa quer voltar depois". Crie conteúdo que as pessoas guardam, não apenas que elas curtem.',
                    image: false,
                },
                {
                    slide: 4,
                    role: 'content',
                    headline: 'O erro que 90% dos criadores cometem',
                    body_markdown:
                        'Publicar e desaparecer. Nos primeiros 30 minutos após o post, responda TODOS os comentários. Cada resposta reinicia uma mini-janela de distribuição. Criadores que respondem ativamente têm 3x mais alcance orgânico.',
                    image: false,
                },
                {
                    slide: 5,
                    role: 'cta',
                    headline: 'Salva esse post para relembrar na sua próxima publicação 💾',
                    image: false,
                },
            ],
            caption:
                'O algoritmo do Instagram não é aleatório — ele tem regras claras que poucos criadores conhecem.\n\nEntender a janela de distribuição e o peso do salvamento pode mudar completamente seus resultados.\n\n---\n\nalgorítmo instagram, alcance orgânico, crescimento instagram, criação de conteúdo\n\n---\n\n#Instagram #MarketingDigital #RedesSociais #ContentCreator #CrescimentoOrgânico',
            hashtags: ['#Instagram', '#MarketingDigital', '#RedesSociais', '#ContentCreator', '#CrescimentoOrgânico'],
            cta_text: 'Salvar post',
            best_posting_time: '19:00 BRT',
        },
        balanced: {
            theme: '3 leis da persuasão que toda pessoa de marketing deveria conhecer',
            total_slides: 7,
            slides: [
                {
                    slide: 1,
                    role: 'hook',
                    headline: 'Existe uma ciência por trás de por que você compra o que compra',
                    image: true,
                },
                {
                    slide: 2,
                    role: 'content',
                    headline: 'Lei 1: Reciprocidade — dar antes de pedir',
                    body_markdown:
                        'Um estudo da Cornell University mostrou que clientes de restaurante deixam 18% mais gorjeta quando recebem um doce junto com a conta. O cérebro é programado para retribuir. Marcas que oferecem valor genuíno ANTES de pedir a compra convertem 3x mais.',
                    image: false,
                },
                {
                    slide: 3,
                    role: 'content',
                    headline: 'Lei 2: Escassez — o que é raro parece mais valioso',
                    body_markdown:
                        'Psicólogos da Columbia University demonstraram que potes com menos biscoitos eram percebidos como mais saborosos — mesmo sendo idênticos. Não é sobre quantidade: é sobre percepção de exclusividade. Isso explica o poder de "últimas vagas" e "edição limitada".',
                    image: false,
                },
                {
                    slide: 4,
                    role: 'content',
                    headline: 'Lei 3: Prova Social — seguimos o que os outros fazem',
                    body_markdown:
                        'O estudos do Solomon Asch mostrou que 75% das pessoas concordam com uma resposta claramente errada se o grupo ao redor diz que está certa. Avaliações, depoimentos e números de clientes não são vaidade — são gatilhos de confiança baseados em biologia.',
                    image: false,
                },
                {
                    slide: 5,
                    role: 'pattern-interrupt',
                    headline: 'Mas atenção: persuasão mal usada destrói marcas',
                    body_markdown:
                        'Usar escassez falsa (contadores regressivos que reiniciam), prova social fabricada ou reciprocidade manipulativa cria vendas de curto prazo e destruição de reputação de longo prazo. As 3 leis funcionam melhor quando são genuínas.',
                    image: false,
                },
                {
                    slide: 6,
                    role: 'conclusion',
                    headline: 'Como aplicar as 3 leis hoje',
                    body_markdown:
                        'Reciprocidade: entregue conteúdo real antes de vender. Escassez: use apenas quando verdadeira. Prova Social: colete e compartilhe resultados reais. O negócio que constrói confiança vende mais, por mais tempo e com menos esforço.',
                    image: false,
                },
                {
                    slide: 7,
                    role: 'cta',
                    headline: 'Qual dessas 3 leis você já usa (consciente ou não)? Comenta aqui 👇',
                    image: false,
                },
            ],
            caption:
                'Persuasão não é manipulação — é comunicação alinhada com como o cérebro humano realmente funciona.\n\nAplicar reciprocidade, escassez e prova social de forma genuína é o que separa marcas que crescem de marcas que apenas vendem.\n\n---\n\npersuasão, psicologia do consumidor, marketing, neuromarketing, vendas\n\n---\n\n#Marketing #Persuasão #Neuromarketing #PsicologiaDoConsumo #Vendas',
            hashtags: ['#Marketing', '#Persuasão', '#Neuromarketing', '#PsicologiaDoConsumo', '#Vendas'],
            cta_text: 'Salvar e aplicar',
            best_posting_time: '18:00 BRT',
        },
        dense: {
            theme: 'O framework completo de aprendizagem acelerada (science-backed)',
            total_slides: 10,
            slides: [
                { slide: 1, role: 'hook', headline: 'Você aprende 83% mais devagar do que poderia — e a ciência prova', image: true },
                {
                    slide: 2, role: 'content', headline: 'O mito do "estudo longo" está destruindo sua aprendizagem',
                    body_markdown: 'Um estudo de 2022 da MIT mostrou que sessões de estudo acima de 90 minutos sem pausa reduzem a retenção em 40%. O córtex pré-frontal entra em fadiga cognitiva e a memória de longo prazo para de consolidar. Mais horas ≠ mais aprendizado.',
                    image: false,
                },
                {
                    slide: 3, role: 'content', headline: 'Espaçamento: o princípio mais ignorado da ciência cognitiva',
                    body_markdown: 'A Curva do Esquecimento de Ebbinghaus (1885) ainda é validada. Sem revisão: você esquece 70% do conteúdo em 24h. Com revisão espaçada (1h, 1 dia, 1 semana): retenção sobe para 90%+. Isso se chama "Spaced Repetition" e apps como Anki foram construídos em cima disso.',
                    image: false,
                },
                {
                    slide: 4, role: 'content', headline: 'Recuperação ativa vs. releitura passiva',
                    body_markdown: 'Estudo de 2011 publicado na Science: alunos que TESTARAM o próprio conhecimento (sem o material) retiveram 50% mais em uma semana vs. alunos que só releram. Releitura cria ilusão de conhecimento. Testar cria conhecimento real. Feche o livro e tente explicar o que aprendeu.',
                    image: false,
                },
                {
                    slide: 5, role: 'content', headline: 'O papel do sono na consolidação da memória',
                    body_markdown: 'Durante o sono REM, o hipocampo "transfere" memórias para o córtex cerebral (consolidação). Privar-se de sono após uma sessão de estudo reduz retenção em 40%. Estudar e dormir é mais eficaz que estudar por 2x mais tempo sem dormir.',
                    image: false,
                },
                {
                    slide: 6, role: 'pattern-interrupt', headline: 'O que 95% dos cursos online ignoram completamente',
                    body_markdown: 'Vídeo aula de 2h + exercício isolado = método menos eficiente comprovado pela ciência. A aprendizagem mais eficaz é INTERCALADA: misture diferentes tópicos ou problemas em vez de praticar um conceito exaustivamente antes de passar para o próximo.',
                    image: false,
                },
                {
                    slide: 7, role: 'content', headline: 'A técnica Feynman: ensine para aprender',
                    body_markdown: 'Richard Feynman (Nobel de Física) tinha um método: explique o conceito como se fosse ensinar para uma criança de 12 anos. Onde você travar ou usar jargão = onde seu entendimento é superficial. Ensinar força clareza que estudar passivamente nunca alcança.',
                    image: false,
                },
                {
                    slide: 8, role: 'content', headline: 'Intercalação e variação: o segredo da perícia real',
                    body_markdown: 'Estudantes que praticaram problemas variados (intercalados) tiveram 43% melhor desempenho em testes vs. aqueles que praticaram por blocos. O erro: a intercalação parece mais difícil e desconfortável — então a maioria evita. O desconforto é o sinal de que funciona.',
                    image: false,
                },
                {
                    slide: 9, role: 'conclusion', headline: 'O protocolo de 4 passos comprovado pela neurociência',
                    body_markdown: '1. Estude em blocos de 25-50 min com pausas. 2. Após cada bloco: recuperação ativa (escreva o que lembrou sem olhar). 3. Revisão espaçada: 1h depois, 24h depois, 7 dias depois. 4. Durma 7-8h após sessões importantes. Esse protocolo triplica a retenção vs. estudo convencional.',
                    image: false,
                },
                {
                    slide: 10, role: 'cta',
                    headline: 'Salva esse post — você vai querer voltar nele quando estudar algo novo 📌',
                    image: false,
                },
            ],
            caption: 'A maioria das pessoas estuda muito mas aprende pouco — e a neurociência explica exatamente por quê.\n\nEspaçamento, recuperação ativa, sono e intercalação são os 4 pilares da aprendizagem acelerada validada por ciência.\n\n---\n\naaprendizagem acelerada, neurociência, estudo eficiente, memória, produtividade\n\n---\n\n#Aprendizagem #Neurociência #Produtividade #EstudoEficiente #DesenvolvimentoPessoal',
            hashtags: ['#Aprendizagem', '#Neurociência', '#Produtividade', '#EstudoEficiente', '#DesenvolvimentoPessoal'],
            cta_text: 'Salvar framework',
            best_posting_time: '08:00 BRT',
        },
    };

    return `\n# EXEMPLO DE FORMATO (referência de estrutura — NÃO copie o tema):\n${JSON.stringify(examples[depth], null, 2)}\n\nIMPORTANTE: O exemplo acima é APENAS para mostrar a estrutura JSON e qualidade esperada. Crie conteúdo ORIGINAL sobre o tema fornecido no Conteúdo-Fonte.`;
}
