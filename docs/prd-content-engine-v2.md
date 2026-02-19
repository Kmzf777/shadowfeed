# PRD — Content Engine v2.0
## Strategic Setup + Content Types + Adaptive Depth

> **Epic Codename:** CONTENT-ENGINE-V2
> **Tipo:** Refactor Estratégico + Novas Features
> **Depende de:** Sistema base atual (forge-personalized, forge-smart, setup wizard)
> **Documento otimizado para execução via Claude Code com @dev.**
> **Versão:** 1.0 — Fevereiro 2026

---

## 1. Contexto e Problema

### 1.1 O Problema Central

O ShadowFeed gera carrosséis de Instagram, mas os posts produzidos atualmente sofrem de um problema fundamental: **o sistema não sabe o suficiente sobre o criador de conteúdo para gerar posts que realmente engajam, vendem ou ensinam.**

O setup atual coleta:
```
target_audience: "empreendedores"
main_pain_point: "falta de tempo"
voice_tone: "professional"
user_prompt: "sou coach de produtividade"
```

Isso é insuficiente para responder às perguntas que um copywriter de verdade precisa responder antes de escrever:
- **O que** exatamente esse criador vende ou oferece?
- **Qual transformação** ele entrega aos clientes?
- **Quais são os 3-5 temas** que ele cobre repetidamente?
- **O que o público tem medo** de comprar e por quê?
- **Qual é o CTA padrão** dele — DM, link, comentário?

Sem essas informações, a IA produz conteúdo genérico que poderia ter sido escrito para qualquer pessoa do nicho.

### 1.2 Segundo Problema: Ausência de Tipos de Conteúdo

O sistema atual tem dois "temas": `magazine` (carrossel editorial) e `twitter` (thread). Ambos são **estilos visuais**, não estratégias de conteúdo.

Um criador de Instagram de sucesso não publica "carrosséis". Ele publica:
- Posts que **ensinam** (educacional, tutorial, lista)
- Posts que **vendem** (AIDA, DM trigger, prova social)
- Posts que **posicionam** (autoridade, opinião forte, case)
- Posts que **engajam** (pergunta, controvérsia, relato)

Cada um desses tipos tem uma **estrutura narrativa diferente**, **gatilhos psicológicos diferentes** e **métricas de sucesso diferentes**. Um prompt genérico não consegue otimizar para todos eles simultaneamente.

### 1.3 Terceiro Problema: Profundidade Fixa

Hoje o schema permite 5-15 slides. O prompt diz "7-10 slides". Isso ignora uma realidade: **o volume de conteúdo que justifica um post varia enormemente**.

- Uma notícia simples merece 5-6 slides rápidos.
- Um guia completo de 7 passos merece 15-18 slides densos.
- Uma lista de 20 ferramentas pode justificar 20 slides.

A IA deve tomar essa decisão autonomamente com base na qualidade e quantidade do input — não receber um range arbitrário fixo.

---

## 2. Objetivo

Transformar o ShadowFeed em um sistema capaz de gerar posts que **realmente funcionam no Instagram** para qualquer nicho, independentemente de ser saúde, finanças, marketing, educação, lifestyle ou B2B.

**OKR desta entrega:**
- **O:** Criar o motor de conteúdo mais personalizável e estratégico de uma ferramenta de criação de carrosséis do mercado brasileiro.
- **KR1:** Posts gerados com tipo `educacional` recebem taxa de salvamento > 15x média.
- **KR2:** Posts gerados com tipo `vendas` geram CTA triggers mensuráveis.
- **KR3:** Setup completado por > 80% dos novos usuários (vs. atual estimado 60%).
- **KR4:** Diversidade de conteúdo: usuário ativo nunca repete o mesmo tipo de conteúdo em 3 posts consecutivos.

---

## 3. Escopo

### In Scope — v2.0

- [ ] Novo sistema de setup estratégico (5 camadas, multi-step)
- [ ] Schema de banco `users` ampliado com novos campos
- [ ] 7 Content Types com prompts especializados por tipo
- [ ] Sistema de profundidade adaptativa (Shallow / Balanced / Dense)
- [ ] Lógica de decisão: AI escolhe quantidade de slides baseado no input
- [ ] Rotação estratégica de content types (evita repetição)
- [ ] Forge Smart v2: decide content type antes de buscar fonte
- [ ] Forge Personalized v2: aceita `contentType` como parâmetro
- [ ] Atualização do schema Zod (`content-schema.ts`) para suportar 4-20 slides
- [ ] Atualização dos layouts do frontend para suportar novos roles de slide
- [ ] `/criar-post` v2: seleção de content type
- [ ] Fonte autoral (sem busca externa) para tipos que não precisam

### Out of Scope — v2.0

- [ ] Agendamento automático de posts
- [ ] Integração direta com Instagram API
- [ ] A/B testing de hooks
- [ ] Analytics de engajamento
- [ ] Novos temas visuais (épico separado: `prd-design-system-v3`)

---

## 4. Arquitetura Geral

### 4.1 Visão do Novo Fluxo

```
[SETUP v2 — 5 camadas]
        │
        v
[CRIAR POST — escolhe Content Type]
        │
        ├── Manual (URL) ──────────────────────────┐
        │                                           │
        └── Auto (Smart) ──────────────────────────┤
                                                    │
        [Rotação Estratégica] ──────────────────────┤
        (se auto, sugere o tipo ideal)              │
                                                    v
                              [FORGE ENGINE v2]
                              ├── Decide se precisa de fonte externa
                              ├── Busca fonte se necessário
                              ├── Determina profundidade (Shallow/Balanced/Dense)
                              ├── Seleciona template narrativo do content type
                              ├── Gera com prompt especializado
                              ├── Valida (Zod schema atualizado)
                              ├── Enriquece com imagens Pexels
                              └── Aplica tema visual
```

### 4.2 Componentes Afetados

| Componente | Ação | Prioridade |
|---|---|---|
| `users` table (Supabase) | Migration: adicionar 15+ novos campos | P0 |
| Setup wizard frontend | Refactor completo: 5 etapas estratégicas | P0 |
| `content-schema.ts` | Ampliar range: 4-20 slides, novos roles | P0 |
| `content-validator.ts` | Adaptar validações para novos tipos | P0 |
| `post-themes.library.ts` | Adicionar 7 content types com prompts | P0 |
| `forge-personalized.service.ts` | Aceitar `contentType`, novo prompt routing | P0 |
| `forge-personalized/prompt-builder.ts` | Refactor: prompt por content type | P0 |
| `forge-smart.service.ts` | Stage 0: seleção de content type | P1 |
| `forge-smart/smart-query-generator.ts` | Queries adaptadas ao content type | P1 |
| `/criar-post/page.tsx` | Step de seleção de content type | P1 |
| `forge-smart/smart-content-fetcher.ts` | Lógica: precisa fonte? qual tipo? | P1 |

---

## 5. FEATURE 1 — Setup Estratégico v2

### 5.1 Problema Atual

O setup atual é um formulário de 4 campos simples. Coleta informações demográficas básicas mas não estratégicas. O resultado é uma IA que sabe que o usuário atende "empreendedores com falta de tempo" mas não sabe que ele vende uma mentoria de R$3.000, que seu CTA padrão é "comenta MENTORIA", ou que seus pilares de conteúdo são produtividade, delegação e mentalidade.

### 5.2 Novo Fluxo de Setup (5 Etapas)

O setup passa a ser uma **consulta estratégica de marketing**, não um cadastro. Deve ter tom consultivo e educativo, explicando *por que* cada informação importa.

---

#### ETAPA 1 — Identidade do Negócio

**Objetivo:** Entender o que o criador faz e qual transformação entrega.

**Campos:**

```typescript
interface SetupStep1 {
  niche: string;                  // dropdown + campo livre
  expertise_statement: string;    // "Em uma frase, o que você ensina ou resolve?"
  transformation_before: string;  // "Qual é o ANTES de quem trabalha com você?"
  transformation_after: string;   // "Qual é o DEPOIS?"
}
```

**UI — Nicho (dropdown com busca):**
```
Marketing Digital | Vendas | Finanças Pessoais | Investimentos |
Saúde & Fitness | Nutrição | Psicologia | Espiritualidade |
Empreendedorismo | Gestão de Negócios | RH & Carreira |
Educação | Idiomas | Tecnologia | Design | Fotografia |
Lifestyle | Moda | Gastronomia | Viagem | Outro (livre)
```

**UI — Expertise Statement:**
```
Campo de texto livre, 1-2 frases.
Placeholder: "Ajudo designers freelancers a cobrar 4x mais sem trabalhar mais horas"
Helper: "Seja específico. 'Sou coach de vida' é fraco. 'Ajudo mulheres após divórcio a reconstruir sua identidade financeira' é forte."
```

**UI — Transformação (2 campos side-by-side):**
```
ANTES → DEPOIS
Freelancer sem agenda cheia → Agenda lotada com clientes premium
[Max 80 chars cada]
```

---

#### ETAPA 2 — Avatar do Público

**Objetivo:** Definir com precisão quem é o cliente ideal e suas motivações.

**Campos:**

```typescript
interface SetupStep2 {
  target_audience: string;        // Mantém do sistema atual
  audience_frustration: string;   // "O que mais frustra seu público?"
  audience_desire: string;        // "O que eles mais querem alcançar?"
  audience_objection: string;     // "Por que ainda não compraram de você?"
  awareness_level: AwarenessLevel; // Enum (ver abaixo)
}

type AwarenessLevel =
  | 'unaware'       // Não sabe que tem o problema
  | 'problem_aware' // Sabe o problema, não sabe a solução
  | 'solution_aware'// Sabe que existe solução, não te conhece
  | 'brand_aware'   // Te conhece, não confia ainda
  | 'most_aware';   // Já considera comprar
```

**UI — Awareness Level (cards explicativos):**
```
🌑 Não sabe que tem problema
  "Descobre meu conteúdo sem estar buscando solução"

🌒 Sabe o problema, não sabe a solução
  "Sabe que tem dificuldade, ainda não sabe como resolver"

🌓 Sabe que existe solução, não me conhece ainda
  "Já pesquisa sobre o tema, ainda não me seguiu"

🌔 Me conhece, mas não confia ainda
  "Segue meu perfil, ainda tem dúvidas sobre comprar"

🌕 Já está considerando comprar
  "Audiência quente, pronta para oferta direta"
```

---

#### ETAPA 3 — Pilares de Conteúdo

**Objetivo:** Definir os 3-4 temas recorrentes que o criador vai cobrir. Isso permite rotação inteligente.

**Campos:**

```typescript
interface SetupStep3 {
  content_pillars: ContentPillar[]; // 2-4 obrigatório
  primary_goal: PrimaryGoal;
  posting_frequency: PostingFrequency;
}

type ContentPillar = {
  id: string;
  label: string;
  custom?: string; // se 'outro'
}

type PrimaryGoal =
  | 'grow_audience'    // Crescer seguidores
  | 'generate_leads'   // Capturar leads
  | 'direct_sales'     // Vender diretamente
  | 'build_authority'  // Posicionamento
  | 'balanced';        // Equilibrado

type PostingFrequency =
  | '1_week'
  | '2-3_week'
  | '5+_week'
  | 'daily';
```

**UI — Pilares (checkboxes multi-select, max 4):**
```
Cada nicho tem sugestões customizadas. Exemplos para Marketing Digital:

□ Estratégias de Tráfego
□ Copywriting e Persuasão
□ Gestão de Redes Sociais
□ Funis de Venda
□ Ferramentas de Automação
□ Cases e Resultados de Clientes
□ Mentalidade Empreendedora
□ Bastidores do Negócio
+ Outro (campo livre)
```

**Lógica das sugestões de pilares por nicho:**

O backend deve ter um mapa de pilares sugeridos por nicho. Exemplo:

```typescript
const PILLAR_SUGGESTIONS: Record<string, string[]> = {
  'marketing_digital': [
    'Tráfego Pago', 'Copywriting', 'Social Media', 'Funil de Vendas',
    'Email Marketing', 'SEO', 'Automação', 'Cases e Resultados'
  ],
  'financas_pessoais': [
    'Investimentos', 'Controle de Gastos', 'Renda Extra', 'Dívidas',
    'Reserva de Emergência', 'Independência Financeira', 'Mentalidade Financeira'
  ],
  'saude_fitness': [
    'Treino', 'Alimentação', 'Perda de Peso', 'Ganho de Massa',
    'Suplementação', 'Saúde Mental', 'Hábitos Saudáveis'
  ],
  // ... etc para todos os nichos
};
```

---

#### ETAPA 4 — Oferta (Opcional mas Crítico)

**Objetivo:** Configurar o produto/serviço que será integrado nos posts de venda.

**Campos:**

```typescript
interface SetupStep4 {
  has_offer: boolean;
  offers: Offer[]; // Suporta múltiplas ofertas (até 3)
}

interface Offer {
  id: string;
  name: string;                        // "Mentoria Design Premium"
  type: OfferType;
  main_benefit: string;               // "Quem compra consegue..."
  price_range: PriceRange;
  purchase_method: PurchaseMethod;
  cta_keyword: string;                // "MENTORIA", "PREMIUM", "EU QUERO"
  is_primary: boolean;                // Oferta principal vs secundária
}

type OfferType =
  | 'digital_product'  // Produto digital (curso, ebook, template)
  | 'service'          // Serviço (consultoria, freelance)
  | 'mentoring'        // Mentoria / coaching
  | 'community'        // Comunidade / grupo
  | 'physical_product' // Produto físico
  | 'saas'             // Software / ferramenta
  | 'event';           // Evento / workshop

type PriceRange =
  | 'free'       // Gratuito / lead magnet
  | 'low'        // Até R$97
  | 'mid'        // R$97 - R$500
  | 'high'       // R$500 - R$2.000
  | 'premium';   // R$2.000+

type PurchaseMethod =
  | 'dm'          // DM no Instagram
  | 'link_bio'    // Link na bio
  | 'whatsapp'    // WhatsApp
  | 'site'        // Site / checkout
  | 'comment';    // Comentário com palavra-chave
```

**UI — Interface de Oferta:**
```
Você tem algo para divulgar nos seus posts?

[ Não, ainda não ]  [ Sim, tenho oferta(s) ]

Se sim:
+ Adicionar Oferta

Para cada oferta:
  Nome do produto/serviço: [___________]
  Tipo: [dropdown]
  Principal benefício: "Quem compra consegue ___" [___________]
  Faixa de preço: [radio buttons]
  Como as pessoas compram: [radio buttons]
  Palavra-chave do CTA: [___________]
    Preview: "Comenta [PALAVRA] que te mando no direct"
  [ ] Esta é minha oferta principal

[+ Adicionar outra oferta] (máx 3)
```

---

#### ETAPA 5 — Tom, Estilo e Referências

**Objetivo:** Capturar a voz, restrições e referências visuais/de estilo.

**Campos:**

```typescript
interface SetupStep5 {
  voice_tone: VoiceTone;         // Mantém do sistema atual
  content_depth: ContentDepth;   // NOVO: preferência de profundidade
  avoid_topics: string;          // O que NUNCA deve aparecer
  inspiration_accounts: string[]; // Até 3 perfis que admira
  brand_personality: string[];    // 3 adjetivos (multi-select)
}

type ContentDepth =
  | 'shallow'   // Rápido e direto: 4-8 slides
  | 'balanced'  // Equilibrado: 8-15 slides
  | 'dense';    // Denso e completo: 15-20 slides

// Nota: o usuário define a PREFERÊNCIA, mas a IA decide o número
// final baseada na qualidade/quantidade do input
```

**UI — Content Depth:**
```
Qual é o seu estilo de conteúdo?

🚀 Rápido e Direto (4-8 slides)
   Posts concisos, direto ao ponto.
   Ideal para dicas rápidas, fatos, quotes.

⚖️ Equilibrado (8-15 slides)
   Profundidade suficiente sem ser excessivo.
   Ideal para a maioria dos temas.

📚 Denso e Completo (15-20 slides)
   Conteúdo de referência, guias completos.
   Ideal para tutoriais, análises aprofundadas.

Nota: A IA sempre decide o número final de slides baseada
no conteúdo disponível. Sua escolha é a preferência padrão.
```

**UI — Personalidade da Marca (multi-select, máx 3):**
```
Educativo | Inspirador | Divertido | Provocador | Técnico |
Empático | Direto | Sofisticado | Acessível | Ousado |
Confiável | Criativo | Analítico | Humano | Premium
```

---

### 5.3 Schema de Banco — Migration Users

```sql
-- Migration: setup-v2-user-profile
ALTER TABLE users
  -- Pilares de conteúdo (array de strings)
  ADD COLUMN IF NOT EXISTS content_pillars TEXT[] DEFAULT '{}',

  -- Objetivo principal
  ADD COLUMN IF NOT EXISTS primary_goal TEXT DEFAULT 'balanced'
    CHECK (primary_goal IN ('grow_audience','generate_leads','direct_sales','build_authority','balanced')),

  -- Nível de consciência da audiência
  ADD COLUMN IF NOT EXISTS audience_awareness TEXT DEFAULT 'solution_aware'
    CHECK (audience_awareness IN ('unaware','problem_aware','solution_aware','brand_aware','most_aware')),

  -- Transformação entregue
  ADD COLUMN IF NOT EXISTS transformation_before TEXT,
  ADD COLUMN IF NOT EXISTS transformation_after TEXT,

  -- Frustração e desejo do público
  ADD COLUMN IF NOT EXISTS audience_frustration TEXT,
  ADD COLUMN IF NOT EXISTS audience_desire TEXT,
  ADD COLUMN IF NOT EXISTS audience_objection TEXT,

  -- Nicho categorizado
  ADD COLUMN IF NOT EXISTS niche TEXT,

  -- Expertise statement (1-2 frases)
  ADD COLUMN IF NOT EXISTS expertise_statement TEXT,

  -- Profundidade preferida
  ADD COLUMN IF NOT EXISTS content_depth TEXT DEFAULT 'balanced'
    CHECK (content_depth IN ('shallow','balanced','dense')),

  -- Frequência de postagem
  ADD COLUMN IF NOT EXISTS posting_frequency TEXT DEFAULT '2-3_week',

  -- Tópicos a evitar
  ADD COLUMN IF NOT EXISTS avoid_topics TEXT,

  -- Personalidade da marca (array)
  ADD COLUMN IF NOT EXISTS brand_personality TEXT[] DEFAULT '{}',

  -- Ofertas (JSONB array)
  ADD COLUMN IF NOT EXISTS offers JSONB DEFAULT '[]',

  -- Versão do setup
  ADD COLUMN IF NOT EXISTS setup_version INTEGER DEFAULT 1;

-- Coluna de controle de rotação (último content type gerado)
ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS depth_level TEXT;
```

---

## 6. FEATURE 2 — Content Types (7 Tipos com Prompts Especializados)

### 6.1 Definição dos 7 Content Types

Cada content type tem:
- **Objetivo primário** (o que o post quer alcançar)
- **Gatilhos psicológicos** (o que o leitor sente)
- **Estrutura narrativa** (sequência de slides)
- **Prompt especializado** (o que a IA recebe)
- **Profundidade compatível** (shallow/balanced/dense)
- **Precisa de fonte externa?** (sim/não)

---

#### TYPE 1 — EDUCACIONAL

```typescript
const EDUCATIONAL_TYPE: ContentTypeConfig = {
  id: 'educational',
  label: 'Educacional',
  emoji: '📚',
  description: 'Ensina algo útil e valioso para o público',
  primaryGoal: 'Salvamentos e compartilhamentos',
  psychologicalTriggers: ['curiosidade', 'valor antecipado', 'utilidade imediata'],
  compatibleDepths: ['shallow', 'balanced', 'dense'],
  needsExternalSource: true,
  bestFor: ['grow_audience', 'build_authority'],
  ctaStyle: 'engagement', // "Salva esse post!" ou "Manda pra quem precisa"

  narrativeTemplate: {
    shallow:  ['hook', 'content', 'content', 'content', 'pattern-interrupt', 'cta'],
    balanced: ['hook', 'content', 'content', 'content', 'content', 'content',
               'pattern-interrupt', 'conclusion', 'cta'],
    dense:    ['hook', 'content', 'content', 'content', 'content', 'content',
               'content', 'content', 'pattern-interrupt', 'content', 'content',
               'content', 'content', 'conclusion', 'cta'],
  },

  slideCountRange: {
    shallow:  { min: 4,  max: 8  },
    balanced: { min: 8,  max: 15 },
    dense:    { min: 15, max: 20 },
  },
};
```

**System Prompt Especializado:**
```
Você é um educador de elite para Instagram com domínio profundo em [NICHO].
Sua missão: transformar conteúdo-fonte em AULA COMPLETA em formato carrossel.

PRINCÍPIOS DO CONTEÚDO EDUCACIONAL:
- Cada slide deve entregar valor standalone (vale um post inteiro)
- Hook: abre um LOOP de curiosidade que só fecha no slide final
- Use dados concretos: %, pesquisas, estudos, nomes reais, números
- Nunca seja genérico: "pratique exercícios" é fraco, "30 min de caminhada 5x/semana reduz risco cardíaco em 35% (Harvard, 2023)" é forte
- Cada insight deve ser APLICÁVEL hoje, não apenas interessante
- NUNCA invente dados — se não tem fonte, escreva como princípio, não como estatística
- Body_markdown: mínimo 400 chars por slide de conteúdo (exceto hook e CTA)

ESTRUTURA NARRATIVA:
1. Hook: Dado surpreendente / Pergunta que provoca / Fato contraintuitivo
2. Slides de conteúdo: Desenvolvimento com profundidade crescente
3. Pattern-interrupt: Insight mais impactante do conteúdo (slide sem imagem, quote forte)
4. Conclusão: Sintetiza e dá perspectiva
5. CTA: Mecânico e claro ("Salva esse post" / "Manda pra quem precisa de ver isso")

CTA NUNCA deve pedir seguimento diretamente — isso parece desesperado.
CTA deve ser ação de valor: salvar, compartilhar, comentar o que aprendeu.
```

---

#### TYPE 2 — TUTORIAL / PASSO A PASSO

```typescript
const TUTORIAL_TYPE: ContentTypeConfig = {
  id: 'tutorial',
  label: 'Tutorial',
  emoji: '🎯',
  description: 'Ensina como fazer algo em passos específicos',
  primaryGoal: 'Salvamentos massivos (post de referência)',
  psychologicalTriggers: ['praticidade', 'completude', 'confiança no processo'],
  compatibleDepths: ['balanced', 'dense'],
  needsExternalSource: false, // Pode gerar do nicho do usuário
  bestFor: ['grow_audience', 'build_authority'],
  ctaStyle: 'engagement',

  narrativeTemplate: {
    balanced: ['hook', 'context', 'content', 'content', 'content',
               'content', 'content', 'conclusion', 'cta'],
    dense:    ['hook', 'context', 'content', 'content', 'content',
               'content', 'content', 'content', 'content', 'content',
               'content', 'content', 'content', 'conclusion', 'cta'],
  },

  slideCountRange: {
    balanced: { min: 8,  max: 15 },
    dense:    { min: 15, max: 20 },
  },
};
```

**System Prompt Especializado:**
```
Você é um especialista prático em [NICHO] criando um guia passo a passo definitivo.
Sua missão: criar o carrossel que a pessoa vai SALVAR e consultar sempre que precisar.

PRINCÍPIOS DO TUTORIAL:
- Cada passo deve ser 100% acionável — o leitor executa HOJE
- Use number_label para numerar cada passo (Passo 1, Passo 2...)
- Seja hiper-específico: ferramentas, tempos, quantidades, plataformas reais
- Antecipe erros comuns em cada passo ("Erro comum aqui: ...")
- O resultado final deve ser claro desde o Hook
- Use listas estruturadas (campo list) para sub-etapas de um passo complexo

ESTRUTURA OBRIGATÓRIA:
1. Hook: Resultado que a pessoa VAI conseguir ao terminar
2. Contexto: Por que essa abordagem funciona (2 slides max)
3. Passos numerados: 1 passo por slide com detail suficiente
4. Erros comuns: Pelo menos 1 slide sobre o que NÃO fazer
5. Conclusão: Checklist do processo completo
6. CTA: "Salva pra não perder" / "Testa agora e me conta"

Body_markdown por slide de passo: 300-600 chars.
Seja técnico e preciso — vaguidez arruína tutoriais.
```

---

#### TYPE 3 — VENDAS / PRODUTO

```typescript
const SALES_TYPE: ContentTypeConfig = {
  id: 'sales',
  label: 'Venda de Produto',
  emoji: '💰',
  description: 'Apresenta e vende diretamente um produto ou serviço',
  primaryGoal: 'DM triggers, leads, vendas diretas',
  psychologicalTriggers: ['dor', 'desejo', 'prova social', 'urgência', 'autoridade'],
  compatibleDepths: ['shallow', 'balanced'],
  needsExternalSource: false, // Usa dados da oferta configurada
  bestFor: ['generate_leads', 'direct_sales'],
  requiresOffer: true, // Obrigatório ter oferta configurada
  ctaStyle: 'product', // Usa cta_keyword da oferta

  narrativeTemplate: {
    shallow:  ['hook', 'problem', 'solution', 'proof', 'offer', 'cta'],
    balanced: ['hook', 'problem', 'agitate', 'solution', 'proof',
               'social_proof', 'offer', 'faq', 'cta'],
  },

  slideCountRange: {
    shallow:  { min: 5,  max: 8  },
    balanced: { min: 8,  max: 12 },
  },
};
```

**System Prompt Especializado:**
```
Você é um copywriter especialista em conversão para Instagram.
Sua missão: criar um carrossel de VENDA que guia o leitor pela jornada emocional
RECONHECER DOR → DESEJAR SOLUÇÃO → CONFIAR → AGIR.

PRINCÍPIOS DO COPY DE VENDA:
- NUNCA mencione preço nos slides (preço é negociado no DM/site)
- Use 'você' em todo o texto — nunca 'a pessoa' ou 'o cliente'
- Um benefício por slide, NUNCA lista de features ("você vai conseguir X", não "inclui: Y, Z, W")
- O hook deve fazer a pessoa pensar "isso sou eu exatamente"
- Prova social: use números concretos ("15 alunos já conseguiram X em 30 dias")
- Não seja agressivo — seja como um amigo que encontrou algo que mudou sua vida

ESTRUTURA AIDA ADAPTADA:
1. Hook: A DOR do público em forma de pergunta ou afirmação de identificação
2. Agitar: Aprofunde o problema — as consequências de não resolver
3. Solução: O que muda com seu produto (benefício, não feature)
4. Prova: Resultado tangível, número, depoimento, case
5. Oferta: O que é, pra quem é, como funciona (direto e simples)
6. CTA: "Comenta [PALAVRA-CHAVE] que te mando como funciona"

Body_markdown por slide: 200-500 chars. Seja direto — copy de venda é objetivo.
O CTA deve conter a palavra-chave em NEGRITO: **[PALAVRA]**.
```

---

#### TYPE 4 — AUTORIDADE / POSICIONAMENTO

```typescript
const AUTHORITY_TYPE: ContentTypeConfig = {
  id: 'authority',
  label: 'Autoridade',
  emoji: '🏆',
  description: 'Posiciona o criador como referência no nicho',
  primaryGoal: 'Confiança, seguimento, DMs espontâneos',
  psychologicalTriggers: ['credibilidade', 'expertise', 'contrariedade', 'perspectiva única'],
  compatibleDepths: ['balanced', 'dense'],
  needsExternalSource: true,
  bestFor: ['build_authority', 'generate_leads'],
  ctaStyle: 'follow', // "Segue para mais" ou "Me manda mensagem"

  narrativeTemplate: {
    balanced: ['hook', 'claim', 'content', 'content', 'content',
               'pattern-interrupt', 'conclusion', 'cta'],
    dense:    ['hook', 'claim', 'content', 'content', 'content',
               'content', 'content', 'content', 'pattern-interrupt',
               'content', 'content', 'conclusion', 'cta'],
  },

  slideCountRange: {
    balanced: { min: 8,  max: 15 },
    dense:    { min: 12, max: 18 },
  },
};
```

**System Prompt Especializado:**
```
Você é o [EXPERTISE_STATEMENT] e está compartilhando sua perspectiva única.
Sua missão: criar um carrossel que faz o leitor pensar "eu preciso seguir essa pessoa".

PRINCÍPIOS DE AUTORIDADE:
- Compartilhe perspectiva que APENAS quem tem experiência real teria
- Contrarie o senso comum do nicho quando você tiver razão para isso
- Use dados para sustentar afirmações, mas filtre pela sua perspectiva
- Evite o óbvio — qualquer um pode falar o óbvio
- Mostre processo de pensamento, não apenas conclusões
- Erro comum de autoridade: SER ARROGANTE. Tom = expert compartilhando, não pregando

ESTRUTURA:
1. Hook: Afirmação forte / Dado surpreendente / Perspectiva contraintuitiva
2. Por que a maioria pensa diferente (contexto)
3. Desenvolvimento da sua tese com evidências
4. O que isso significa na prática
5. Conclusão com perspectiva única sua
6. CTA: "Segue pra mais" ou "O que você acha? Comenta"

Body_markdown: 400-700 chars por slide. Seja profundo — autoridade é demonstrada por profundidade.
```

---

#### TYPE 5 — STORYTELLING / CASO

```typescript
const STORY_TYPE: ContentTypeConfig = {
  id: 'story',
  label: 'Storytelling',
  emoji: '✍️',
  description: 'Conta uma história real para criar conexão emocional',
  primaryGoal: 'Engajamento emocional, comentários, DMs',
  psychologicalTriggers: ['identificação', 'emoção', 'jornada', 'superação'],
  compatibleDepths: ['shallow', 'balanced'],
  needsExternalSource: false, // História gerada baseada no avatar do público
  bestFor: ['grow_audience', 'generate_leads', 'build_authority'],
  ctaStyle: 'engagement',

  narrativeTemplate: {
    shallow:  ['hook', 'situation', 'conflict', 'decision', 'result', 'cta'],
    balanced: ['hook', 'situation', 'conflict', 'decision', 'struggle',
               'turning_point', 'result', 'lesson', 'cta'],
  },

  slideCountRange: {
    shallow:  { min: 5,  max: 8  },
    balanced: { min: 8,  max: 13 },
  },
};
```

**System Prompt Especializado:**
```
Você é um contador de histórias para Instagram com domínio em [NICHO].
Sua missão: criar uma história real (baseada em casos típicos do nicho) que faça o
leitor comentar "isso acontece comigo!" ou "isso foi eu!".

PRINCÍPIOS DO STORYTELLING:
- Use nomes fictícios mas plausíveis ("Maria, 34 anos, designer")
- Seja específico com detalhes: situação, data, lugar, decisão exata
- A história deve ter ARCO COMPLETO: Situação → Conflito → Decisão → Resultado
- Nunca moralize — deixe o leitor tirar as conclusões
- A lição deve emergir da história, não ser declarada diretamente
- O leitor deve se ver no personagem desde o slide 1

ESTRUTURA HERO'S JOURNEY COMPRIMIDA:
1. Hook: O momento de crise ou a situação-gatilho
2. Situação: Contexto de quem é o personagem (identificação)
3. Conflito: O problema que surgiu
4. Decisão: A escolha que fez
5. Luta / Processo: O que foi difícil no caminho
6. Virada: O momento que mudou tudo
7. Resultado: Onde chegou (concreto, não vago)
8. Lição implícita + CTA: "Você já viveu isso? Comenta"

Body_markdown por slide: 250-500 chars. Tom narrativo, pessoal, direto.
```

---

#### TYPE 6 — LISTA / CURADORIA

```typescript
const LIST_TYPE: ContentTypeConfig = {
  id: 'list',
  label: 'Lista / Curadoria',
  emoji: '📋',
  description: 'Lista curada de ferramentas, dicas, recursos ou exemplos',
  primaryGoal: 'Salvamentos massivos, compartilhamentos',
  psychologicalTriggers: ['completude', 'descoberta', 'utilidade', 'FOMO'],
  compatibleDepths: ['shallow', 'balanced', 'dense'],
  needsExternalSource: true,
  bestFor: ['grow_audience'],
  ctaStyle: 'engagement',

  narrativeTemplate: {
    shallow:  ['hook', 'item', 'item', 'item', 'item', 'cta'],
    balanced: ['hook', 'item', 'item', 'item', 'item', 'item',
               'item', 'item', 'bonus', 'cta'],
    dense:    ['hook', 'item', 'item', 'item', 'item', 'item',
               'item', 'item', 'item', 'item', 'item', 'item',
               'item', 'bonus', 'conclusion', 'cta'],
  },

  slideCountRange: {
    shallow:  { min: 5,  max: 8  },
    balanced: { min: 8,  max: 13 },
    dense:    { min: 13, max: 20 },
  },
};
```

**System Prompt Especializado:**
```
Você é o curador definitivo de [NICHO].
Sua missão: criar a lista mais completa e útil que o leitor já viu sobre o tema.

PRINCÍPIOS DA LISTA:
- Cada item deve ter nome + explicação de por que está na lista (não só listar)
- Inclua pelo menos 1 item surpreendente / menos conhecido
- Organize por relevância, não por ordem aleatória
- O número da lista deve estar no hook ("7 ferramentas que designers premium usam")
- Não repita o óbvio — o leitor já sabe das opções mais populares

ESTRUTURA:
1. Hook: "X [coisas/ferramentas/estratégias] que [benefício concreto]"
2. Um slide por item (ou 2-3 itens em slides de lista se lista for longa)
3. Item bônus: O mais surpreendente/menos conhecido
4. CTA: "Qual você já conhecia? Comenta o número"

Use número_label para numerar cada item (1, 2, 3...).
Body_markdown por item: 150-350 chars (conciso, direto, com contexto).
```

---

#### TYPE 7 — CONTROVÉRSIA / OPINIÃO FORTE

```typescript
const CONTROVERSY_TYPE: ContentTypeConfig = {
  id: 'controversy',
  label: 'Opinião Forte',
  emoji: '🔥',
  description: 'Opinião contraintuitiva ou polêmica sobre o nicho',
  primaryGoal: 'Comentários, debate, compartilhamentos',
  psychologicalTriggers: ['discordância', 'curiosidade', 'indignação', 'concordância forte'],
  compatibleDepths: ['shallow', 'balanced'],
  needsExternalSource: false,
  bestFor: ['grow_audience', 'build_authority'],
  ctaStyle: 'debate', // "Concorda ou discorda? Comenta!"

  narrativeTemplate: {
    shallow:  ['hook', 'claim', 'argument', 'argument', 'conclusion', 'cta'],
    balanced: ['hook', 'claim', 'why_most_disagree', 'argument', 'argument',
               'argument', 'reframe', 'conclusion', 'cta'],
  },

  slideCountRange: {
    shallow:  { min: 5,  max: 8  },
    balanced: { min: 8,  max: 12 },
  },
};
```

**System Prompt Especializado:**
```
Você é um pensador ousado de [NICHO] que não tem medo de dizer o que pensa.
Sua missão: criar um carrossel com uma opinião forte que provoca reflexão e debate.

PRINCÍPIOS DA CONTROVÉRSIA INTELIGENTE:
- NÃO seja apenas provocador — tenha argumentos sólidos por trás
- A opinião deve ser contraintuitiva mas defensável com evidências
- Formato ideal: "A maioria faz X. Isso está errado. Eis por quê."
- Reconheça o lado oposto antes de rebater — isso é intelectualmente honesto
- Nunca ataque pessoas ou marcas pelo nome (opine sobre práticas, não pessoas)
- A controvérsia deve ser sobre o nicho, não genérica

ESTRUTURA:
1. Hook: A afirmação polêmica de forma direta e ousada
2. Por que a maioria discorda (contexto / visão convencional)
3. Seus argumentos com evidências (2-4 slides)
4. Reframe: A nova forma de ver o problema
5. Conclusão: O que você defende e por quê
6. CTA: "Concorda ou discorda? Me conta nos comentários"

Body_markdown: 300-600 chars. Tom seguro, argumentativo, nunca defensivo.
```

---

### 6.2 ContentTypeConfig — TypeScript Interface

```typescript
// src/shared/types/content-types.types.ts

export type ContentTypeId =
  | 'educational'
  | 'tutorial'
  | 'sales'
  | 'authority'
  | 'story'
  | 'list'
  | 'controversy';

export type ContentDepth = 'shallow' | 'balanced' | 'dense';

export type CtaStyle = 'engagement' | 'product' | 'follow' | 'debate';

export interface SlideRange {
  min: number;
  max: number;
}

export interface NarrativeTemplate {
  shallow?: string[];
  balanced?: string[];
  dense?: string[];
}

export interface ContentTypeConfig {
  id: ContentTypeId;
  label: string;
  emoji: string;
  description: string;
  primaryGoal: string;
  psychologicalTriggers: string[];
  compatibleDepths: ContentDepth[];
  needsExternalSource: boolean;
  bestFor: string[];
  ctaStyle: CtaStyle;
  requiresOffer?: boolean;
  narrativeTemplate: NarrativeTemplate;
  slideCountRange: Partial<Record<ContentDepth, SlideRange>>;
}

export const CONTENT_TYPES: ContentTypeConfig[] = [
  // ... (definições acima)
];

export function getContentType(id: ContentTypeId): ContentTypeConfig {
  const type = CONTENT_TYPES.find(t => t.id === id);
  if (!type) throw new Error(`[CONTENT-TYPES] Unknown content type: ${id}`);
  return type;
}
```

---

## 7. FEATURE 3 — Sistema de Profundidade Adaptativa

### 7.1 Lógica de Decisão de Profundidade

A profundidade final (número de slides) é **sempre decidida pela IA** com base em dois fatores:
1. **Preferência do usuário** (`content_depth` do perfil: shallow/balanced/dense)
2. **Qualidade e quantidade do input** (quão rico é o conteúdo-fonte)

A IA recebe o range correspondente e instrução explícita de como calibrar:

```
RANGE PARA DECISÃO DE SLIDES:
- Shallow:  4 a 8 slides
- Balanced: 8 a 15 slides
- Dense:    15 a 20 slides

REGRA DE DECISÃO (a IA deve seguir isto):
- Use o MÍNIMO do range se: input é simples, poucas evidências, tema direto
- Use o MÁXIMO do range se: input é rico, muitos dados/passos/itens, tema complexo
- Nunca force slides artificiais para atingir o máximo — cada slide deve ter conteúdo real
- Nunca comprima conteúdo valioso para ficar abaixo do máximo — expanda se necessário
- A qualidade por slide é mais importante que a quantidade total
```

### 7.2 Schema Atualizado — content-schema.ts

```typescript
// src/shared/schemas/content-schema.ts

// Roles expandidos para suportar todos os content types
export const UniversalRoleEnum = z.enum([
  // Estruturais (todo tipo tem)
  'hook',
  'cta',
  // Conteúdo editorial
  'content',
  'pattern-interrupt',
  'conflict',
  'conclusion',
  // Autoridade
  'engagement',
  'claim',
  // Narrativa
  'situation',
  'turning_point',
  'lesson',
  // Tutorial
  'context',
  'step',
  // Vendas
  'problem',
  'agitate',
  'solution',
  'proof',
  'offer',
  'faq',
  'social_proof',
  // Lista
  'item',
  'bonus',
  // Controvérsia
  'why_most_disagree',
  'argument',
  'reframe',
]);

export const ContentSlideSchema = z.object({
  slide: z.number().int().min(1).max(20),    // Expandido de 15 para 20
  role: z.string().min(1),
  headline: z.string().min(2).max(300),
  subtitle: z.string().max(300).nullable().optional(),
  body_markdown: z.string().max(3000).nullable().optional(), // Expandido para dense
  image: z.boolean().default(false),
  list: z.array(z.string()).nullable().optional(),
  number_label: z.string().nullable().optional(),
  category_label: z.string().max(100).nullable().optional(),
  engagement_text: z.string().max(200).nullable().optional(),
  image_keyword: z.string().optional(),
  image_url: z.string().url().optional(),
  image_credit: z.string().optional(),
});

export const ContentCarouselSchema = z.object({
  theme: z.string().min(5).max(200),
  content_type: z.string().optional(),        // NOVO: content type id
  depth_level: z.string().optional(),         // NOVO: shallow/balanced/dense
  total_slides: z.number().int().min(4).max(20), // Expandido: 4-20
  slides: z.array(ContentSlideSchema).min(4).max(20),
  caption: z.string().min(50).max(2200),
  hashtags: z.array(z.string().startsWith('#')).min(3).max(5),
  cta_text: z.string().min(3),
  best_posting_time: z.string(),
});
```

### 7.3 Validação Atualizada — content-validator.ts

```typescript
// Validação específica por range de profundidade
function validateDepthRange(
  slides: number,
  depth: ContentDepth,
  contentType: ContentTypeId
): void {
  const type = getContentType(contentType);
  const range = type.slideCountRange[depth];

  if (!range) return; // Tipo não suporta esta profundidade

  if (slides < range.min) {
    logger.warn(
      { slides, expected_min: range.min, depth, contentType },
      '[CONTENT-VALIDATOR] Slide count below minimum for depth'
    );
    // Warning apenas, não erro — a IA pode ter decidido conteúdo é escasso
  }

  if (slides > range.max) {
    throw new Error(
      `[CONTENT-VALIDATOR] Slide count ${slides} exceeds max ${range.max} for ${contentType}/${depth}`
    );
  }
}
```

---

## 8. FEATURE 4 — Novo Prompt Builder por Content Type

### 8.1 Arquitetura do Prompt

O prompt builder atual é um único arquivo monolítico que gera um prompt genérico. O novo sistema é modular:

```
src/modules/forge-personalized/
├── prompt-builder.ts           # Orquestrador (mantém interface)
├── prompts/
│   ├── base.prompt.ts          # Blocos compartilhados (data, perfil, CTA)
│   ├── educational.prompt.ts   # System prompt + few-shot educacional
│   ├── tutorial.prompt.ts      # System prompt + few-shot tutorial
│   ├── sales.prompt.ts         # System prompt + few-shot vendas
│   ├── authority.prompt.ts     # System prompt + few-shot autoridade
│   ├── story.prompt.ts         # System prompt + few-shot storytelling
│   ├── list.prompt.ts          # System prompt + few-shot lista
│   └── controversy.prompt.ts   # System prompt + few-shot controvérsia
```

### 8.2 Interface do Novo Prompt Builder

```typescript
// src/modules/forge-personalized/prompt-builder.ts

export interface PromptBuildResult {
  systemPrompt: string;
  userPrompt: string;
}

export function buildForgePrompt(ctx: PersonalizedForgeContext): PromptBuildResult {
  const { contentType, depth, userProfile, source, product } = ctx;

  // 1. Seleciona o módulo de prompt correto
  const promptModule = getPromptModule(contentType);

  // 2. Constrói o system prompt especializado
  const systemPrompt = promptModule.buildSystemPrompt(userProfile, contentType);

  // 3. Constrói o user prompt com todos os blocos
  const userPrompt = buildUserPrompt({
    dateBlock: buildDateBlock(),
    profileBlock: buildProfileBlock(userProfile),
    depthBlock: buildDepthBlock(depth, contentType),
    sourceBlock: buildSourceBlock(source),
    productBlock: product?.enabled ? buildProductBlock(product) : '',
    narrativeBlock: buildNarrativeBlock(contentType, depth),
    rulesBlock: promptModule.buildRulesBlock(depth),
    fewShotBlock: promptModule.getFewShotExample(depth),
    outputInstructions: buildOutputInstructions(),
  });

  return { systemPrompt, userPrompt };
}
```

### 8.3 Bloco de Profundidade (Novo)

```typescript
function buildDepthBlock(depth: ContentDepth, contentType: ContentTypeId): string {
  const type = getContentType(contentType);
  const range = type.slideCountRange[depth]!;

  const depthDescriptions: Record<ContentDepth, string> = {
    shallow:  'RÁPIDO E DIRETO — posts concisos, sem enrolação, máximo impacto por slide',
    balanced: 'EQUILIBRADO — profundidade suficiente para entregar valor real sem ser excessivo',
    dense:    'DENSO E COMPLETO — conteúdo de referência, máximo valor, guia definitivo do tema',
  };

  return `
# PROFUNDIDADE DO CONTEÚDO
Nível: ${depthDescriptions[depth]}
Range de slides: ${range.min} a ${range.max} slides

REGRA DE DECISÃO — VOCÊ DECIDE O NÚMERO FINAL:
- Use slides próximos ao MÍNIMO (${range.min}) se: o input é simples, poucas evidências disponíveis
- Use slides próximos ao MÁXIMO (${range.max}) se: input rico, muitos dados, tema complexo
- NUNCA force slides artificiais — cada slide deve ter conteúdo real e valioso
- NUNCA comprima conteúdo valioso — expanda se o tema justificar
- Qualidade por slide > quantidade total de slides
- Se em dúvida, prefira MENOS slides com MAIS qualidade a MAIS slides com rellotagem
`;
}
```

### 8.4 Bloco Narrativo por Content Type

```typescript
function buildNarrativeBlock(contentType: ContentTypeId, depth: ContentDepth): string {
  const type = getContentType(contentType);
  const template = type.narrativeTemplate[depth] ?? type.narrativeTemplate.balanced!;

  const roleDescriptions: Record<string, string> = {
    'hook':              'Abre o carrossel. Para o scroll. Cria expectativa imediata.',
    'content':           'Slide de desenvolvimento. Entrega valor concreto.',
    'pattern-interrupt': 'Acorda o leitor. Citação forte, dado impactante. SEM imagem.',
    'conflict':          'Apresenta a tensão ou o problema central.',
    'conclusion':        'Sintetiza e dá perspectiva. Fecha os loops abertos.',
    'cta':               'Ação mecânica clara. Último slide.',
    'engagement':        'Provocação de engajamento. Box de destaque com pergunta/resumo.',
    'claim':             'Afirmação de autoridade. A tese do post.',
    'situation':         'Contexto da história. Quem, onde, quando.',
    'turning_point':     'O momento que mudou tudo na história.',
    'lesson':            'A lição que emerge da história (implícita, não moralista).',
    'context':           'Por que esse tutorial funciona. Contexto técnico/teórico.',
    'step':              'Um passo do tutorial. Acionável, específico, com erros comuns.',
    'problem':           'A dor do público em forma concreta.',
    'agitate':           'Aprofunda o problema. Consequências de não resolver.',
    'solution':          'O que muda com o produto/serviço.',
    'proof':             'Evidência: resultado, número, case, depoimento.',
    'offer':             'O que é o produto, pra quem é, como funciona.',
    'faq':               'Objeções comuns respondidas.',
    'social_proof':      'Prova social com números e resultados concretos.',
    'item':              'Um item da lista com nome + por que está aqui.',
    'bonus':             'O item surpresa, menos conhecido.',
    'why_most_disagree': 'Por que a maioria tem a perspectiva oposta.',
    'argument':          'Um argumento que sustenta a posição polêmica.',
    'reframe':           'A nova forma de ver o problema apresentado.',
  };

  const templateStr = template
    .map((role, i) => `  Slide ${i + 1}: [${role}] — ${roleDescriptions[role] ?? role}`)
    .join('\n');

  return `
# ESTRUTURA NARRATIVA
Sequência de slides para este content type (${type.label}):
${templateStr}

IMPORTANTE: Esta é a estrutura sugerida. Você pode ajustar o número
de slides de conteúdo intermediários dentro do range definido acima.
Os slides de ABERTURA (hook) e FECHAMENTO (cta) são fixos e obrigatórios.
`;
}
```

---

## 9. FEATURE 5 — Rotação Estratégica de Content Types

### 9.1 Lógica de Rotação

O sistema evita que o usuário gere o mesmo tipo de conteúdo consecutivamente.

```typescript
// src/modules/forge-smart/content-type-selector.ts

interface RotationContext {
  userId: string;
  primaryGoal: PrimaryGoal;
  recentPosts: { content_type: ContentTypeId; created_at: string }[];
  hasOfferConfigured: boolean;
}

export async function selectContentType(
  ctx: RotationContext,
  userRequest?: ContentTypeId // Se usuário escolheu manualmente
): Promise<ContentTypeId> {

  // 1. Se usuário escolheu, respeitar
  if (userRequest) return userRequest;

  // 2. Regras de distribuição por objetivo
  const distribution = GOAL_DISTRIBUTIONS[ctx.primaryGoal];

  // 3. Identificar tipos usados nos últimos N posts
  const recentTypes = ctx.recentPosts
    .slice(0, 5)
    .map(p => p.content_type)
    .filter(Boolean);

  // 4. Aplicar rotação: priorizar tipos não usados recentemente
  const available = Object.entries(distribution)
    .filter(([typeId]) => {
      // Não repetir o mesmo tipo nos últimos 2 posts
      return !recentTypes.slice(0, 2).includes(typeId as ContentTypeId);
    })
    .filter(([typeId]) => {
      // Vendas só se tem oferta configurada
      if (typeId === 'sales') return ctx.hasOfferConfigured;
      return true;
    });

  // 5. Selecionar com peso probabilístico
  return weightedRandom(available);
}

// Distribuição por objetivo principal
const GOAL_DISTRIBUTIONS: Record<PrimaryGoal, Partial<Record<ContentTypeId, number>>> = {
  grow_audience: {
    educational: 35, list: 20, tutorial: 20,
    story: 15, controversy: 10,
  },
  generate_leads: {
    authority: 30, educational: 25, story: 20,
    sales: 15, tutorial: 10,
  },
  direct_sales: {
    sales: 30, authority: 25, educational: 20,
    story: 15, list: 10,
  },
  build_authority: {
    authority: 35, educational: 30, controversy: 20,
    tutorial: 10, story: 5,
  },
  balanced: {
    educational: 20, authority: 15, tutorial: 15,
    sales: 15, story: 15, list: 10, controversy: 10,
  },
};
```

### 9.2 Busca de Histórico de Posts

```typescript
async function getRecentPostTypes(userId: string): Promise<ContentTypeId[]> {
  const { data } = await supabase
    .from('sf_posts')
    .select('content_type')
    .eq('user_id', userId)
    .not('content_type', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? [])
    .map(p => p.content_type as ContentTypeId)
    .filter(Boolean);
}
```

---

## 10. FEATURE 6 — Forge Smart v2

### 10.1 Novo Stage 0 — Content Type Selection

O Forge Smart agora tem um stage adicional **antes** de buscar conteúdo:

```
STAGE 0: Selecionar content type (rotação estratégica)
    │
    ├── Se tipo precisa de fonte externa:
    │   └── STAGE 1: Gerar queries adaptadas ao tipo
    │       │
    │       └── STAGE 2: Buscar candidatos
    │           │
    │           └── STAGE 3: Scoring
    │               │
    │               └── STAGE 2.5: Enriquecer winner
    │                   │
    │                   └── STAGE 4: Forge personalizado
    │
    └── Se tipo NÃO precisa de fonte externa:
        └── STAGE 4: Forge personalizado (gera do perfil)
```

**Tipos que não precisam de fonte externa:**
- `sales` — usa dados da oferta configurada
- `story` — gera narrativa baseada no avatar
- `controversy` — gera do conhecimento do nicho
- `tutorial` — pode gerar do nicho do usuário sem fonte

**Tipos que precisam de fonte:**
- `educational` — precisa de dados/pesquisas reais
- `authority` — sustenta posição com evidências externas
- `list` — precisa de exemplos/ferramentas reais

### 10.2 Queries Adaptadas ao Content Type

```typescript
// smart-query-generator.ts — atualizado

const TYPE_QUERY_ANGLES: Record<ContentTypeId, string[]> = {
  educational: [
    'research findings statistics',
    'expert insights data',
    'case study results',
    'common mistakes mistakes to avoid',
    'new trends update',
  ],
  authority: [
    'controversial opinion expert',
    'industry misconception truth',
    'data challenges common belief',
    'research contradicts mainstream',
    'insider perspective professional',
  ],
  list: [
    'best tools resources list',
    'top examples curated',
    'complete guide resources',
    'must-know tips collection',
    'underrated hidden gems',
  ],
  tutorial: [
    'step by step how to',
    'beginner guide tutorial',
    'complete process walkthrough',
    'practical implementation guide',
    'common pitfalls how to avoid',
  ],
  // Tipos sem fonte não geram queries
  sales: [],
  story: [],
  controversy: [],
};
```

---

## 11. FEATURE 7 — Frontend /criar-post v2

### 11.1 Novo Fluxo de Steps

```
MODO MANUAL:
Step 1: URL Input
Step 2: Content Type (NOVO)
Step 3: Profundidade (NOVO — se não configurada no perfil)
Step 4: Tema Visual (magazine / twitter)
Step 5: Produto/CTA (se tipo for 'sales' ou 'educational' com produto)

MODO AUTO:
Step 1: Content Type (NOVO — com sugestão da rotação)
Step 2: Tema Visual
Step 3: Produto/CTA (se tipo for 'sales')
```

### 11.2 UI de Seleção de Content Type

```
Que tipo de post você quer criar?

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📚 Educacional  │  │ 🎯 Tutorial     │  │ 💰 Vendas       │
│ Ensine algo     │  │ Passo a passo   │  │ Venda seu       │
│ valioso         │  │ prático         │  │ produto         │
│                 │  │                 │  │                 │
│ Meta: salvamentos│  │ Meta: referência│  │ Meta: leads/DM  │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🏆 Autoridade   │  │ ✍️ Storytelling │  │ 📋 Lista        │
│ Posicione-se    │  │ Conte uma       │  │ Curadoria de    │
│ como expert     │  │ história real   │  │ recursos/dicas  │
│                 │  │                 │  │                 │
│ Meta: confiança │  │ Meta: conexão   │  │ Meta: saves     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐
│ 🔥 Opinião      │
│ Forte           │
│ Provoque debate │
│                 │
│ Meta: comentários│
└─────────────────┘

[IA sugere: Educacional (não postou em 3 dias)]
```

### 11.3 Indicador de Sugestão da IA

No modo Auto, mostrar a sugestão da rotação estratégica:

```
💡 Sugestão baseada no seu histórico:
   Você não posta conteúdo Educacional há 4 dias.
   Seu objetivo é "Crescer audiência" — educacional é ideal agora.

   [ Usar sugestão: Educacional ] [ Escolher outro tipo ]
```

### 11.4 Indicador de Profundidade

Novo step (ou inline se o perfil já tem preferência configurada):

```
Qual a profundidade deste post?
(Preferência padrão: Equilibrado — configurada no seu perfil)

🚀 Rápido (4-8 slides)        ← ideal para dicas, fatos, quotes
⚖️ Equilibrado (8-15 slides)  ← padrão para maioria dos temas  ✓
📚 Denso (15-20 slides)       ← guias, tutoriais completos
```

### 11.5 Alterações no handleGenerate

```typescript
// /criar-post/page.tsx — handleGenerate atualizado

const body = {
  userId: user.id,
  themeId: selectedTheme,
  contentType: selectedContentType, // NOVO
  depthPreference: selectedDepth,   // NOVO
  productMode: productMode,
  productDescription: productDescription,
  ctaText: ctaText,
  ...(creationMode === 'manual' ? { url: url.trim() } : {}),
};

// Fixes do handleGenerate atual:
setIsGenerating(true); // FIX: setLoading nunca era chamado

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    setGenerationError(error.message || 'Erro ao iniciar geração');
    setIsGenerating(false);
    return; // FIX: não redirecionar em caso de erro
  }

  router.push('/my-posts?generating=true');
} catch (err) {
  setGenerationError('Falha de conexão. Tente novamente.');
  setIsGenerating(false);
}
```

---

## 12. FEATURE 8 — Fixes Críticos Incluídos

Esta entrega também resolve os bugs críticos identificados no audit:

### Fix 1 — setLoading Bug (criar-post)
```typescript
// ANTES: setLoading(true) nunca chamado
// DEPOIS: usar setIsGenerating(true) antes do fetch
```

### Fix 2 — Erro da Generation sem Feedback
```typescript
// ANTES: erros ignorados, usuário nunca soube
// DEPOIS: toast/alert de erro antes de redirecionar
```

### Fix 3 — System Prompt Bug
```typescript
// ANTES: "resolver ${voiceTone} para o público-alvo" — sem sentido
// DEPOIS: "comunicar com tom ${voiceTone} para o público-alvo"
```

### Fix 4 — Few-shot Errado no Tema Twitter
```typescript
// ANTES: sempre usava fewshot editorial, mesmo no tema twitter
// DEPOIS: cada content type tem seu próprio few-shot
```

### Fix 5 — Schema Zod max 15 slides
```typescript
// ANTES: max 15 slides hardcoded
// DEPOIS: max 20 slides, com validação por content type
```

---

## 13. Modelo de Dados — Summary das Migrations

### 13.1 Migration 1 — users table
```sql
-- Ver seção 5.3 para SQL completo
-- ~15 novos campos: niche, expertise_statement, transformation_*,
--   audience_*, content_pillars, primary_goal, content_depth,
--   posting_frequency, avoid_topics, brand_personality, offers,
--   setup_version
```

### 13.2 Migration 2 — sf_posts table
```sql
ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS depth_level TEXT
    CHECK (depth_level IN ('shallow', 'balanced', 'dense'));
```

### 13.3 Backward Compatibility

Posts existentes (`content_type = NULL`) continuam funcionando. O sistema trata `NULL` como behavior legado e não aplica validações de rotação.

---

## 14. Estrutura de Arquivos — Novos e Modificados

### Novos Arquivos

```
src/
├── shared/
│   └── types/
│       └── content-types.types.ts          # ContentTypeConfig, CONTENT_TYPES[]
│
└── modules/
    ├── forge-personalized/
    │   └── prompts/
    │       ├── base.prompt.ts               # Blocos compartilhados
    │       ├── educational.prompt.ts
    │       ├── tutorial.prompt.ts
    │       ├── sales.prompt.ts
    │       ├── authority.prompt.ts
    │       ├── story.prompt.ts
    │       ├── list.prompt.ts
    │       └── controversy.prompt.ts
    │
    └── forge-smart/
        └── content-type-selector.ts         # Lógica de rotação

web/src/
└── app/
    └── criar-post/
        └── components/
            ├── ContentTypeSelector.tsx       # UI de seleção de tipo
            └── DepthSelector.tsx             # UI de seleção de profundidade
```

### Arquivos Modificados

```
src/
├── shared/
│   └── schemas/
│       ├── content-schema.ts               # Max 20, novos roles
│       └── content-validator.ts            # Validação por content type
│
└── modules/
    ├── forge-personalized/
    │   ├── forge-personalized.types.ts      # + contentType, depthPreference
    │   ├── forge-personalized.service.ts    # Novo routing de prompt
    │   └── prompt-builder.ts               # Refactor completo
    │
    └── forge-smart/
        ├── forge-smart.types.ts             # + contentType, depth
        ├── forge-smart.service.ts           # + Stage 0
        └── smart-query-generator.ts         # Queries por content type

web/src/
└── app/
    └── criar-post/
        └── page.tsx                         # Novo flow + fixes
```

---

## 15. Critérios de Aceite — Por Feature

### Setup v2
- [ ] Setup tem 5 etapas com validação por step
- [ ] Migration `users` executada sem quebrar usuários existentes
- [ ] Usuários com `setup_version = 1` (antigo) são convidados a completar o novo setup, mas não bloqueados
- [ ] Todos os novos campos são persistidos corretamente

### Content Types
- [ ] 7 content types implementados com prompts distintos
- [ ] Cada tipo gera conteúdo notavelmente diferente dos outros
- [ ] Tipo `sales` falha com erro claro se usuário não tem oferta configurada
- [ ] Tipos que não precisam de fonte externa geram sem buscar URL ou RSS

### Profundidade Adaptativa
- [ ] Schema aceita 4-20 slides sem erros de validação
- [ ] Posts shallow têm entre 4-8 slides
- [ ] Posts balanced têm entre 8-15 slides
- [ ] Posts dense têm entre 15-20 slides
- [ ] IA nunca gera slides artificiais ("Resumo do que vimos acima" em slides de padding)
- [ ] Prompt instrui claramente a IA sobre quando usar min vs max

### Rotação Estratégica
- [ ] Mesmo tipo não repete nos últimos 2 posts consecutivos
- [ ] Distribuição por objetivo é respeitada estatisticamente
- [ ] Auto mode mostra sugestão com explicação

### Fixes Críticos
- [ ] Botão de geração mostra loading state
- [ ] Erros de API são exibidos ao usuário antes do redirect
- [ ] System prompt não tem o bug "resolver ${voiceTone}"

### Frontend /criar-post
- [ ] Seleção de content type é obrigatória
- [ ] Seleção de profundidade é opcional (usa padrão do perfil)
- [ ] Auto mode sugere o tipo ideal com explicação
- [ ] Modo manual continua funcionando para URL

---

## 16. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Posts densos (15-20 slides) excedem max_completion_tokens | Alta | Aumentar de 8192 para 16384 tokens para posts densos |
| IA ignora range de slides | Média | Validação Zod rejeita fora do range; retry automático |
| Usuários com setup antigo têm campos NULL | Alta | Fallback: usar `main_pain_point` como `audience_frustration` se null |
| Tipo `sales` sem oferta configurada | Média | Bloquear seleção na UI; erro claro na API |
| Posts de storytelling parecem genéricos | Média | Few-shot obrigatório com exemplo altamente específico |
| Prompts por tipo excedem context window | Baixa | Manter prompts concisos; few-shot < 800 tokens |

---

## 17. Dependências e Ordem de Execução

```
FASE 1 (P0 — Bloqueante):
1. Migration SQL (users + sf_posts) — @devops
2. content-schema.ts atualizado (4-20 slides, novos roles)
3. content-validator.ts atualizado
4. content-types.types.ts criado

FASE 2 (P0 — Independente, pode ser paralelo):
5. Setup wizard v2 (frontend) — @dev
6. 7 prompt modules (backend) — @dev
7. prompt-builder.ts refactor — @dev

FASE 3 (P1 — Depende de Fase 2):
8. forge-personalized.service.ts (aceita contentType)
9. content-type-selector.ts (rotação)
10. forge-smart.service.ts v2 (Stage 0)
11. /criar-post/page.tsx v2 (novo flow)

FASE 4 (P2 — Fixes e polish):
12. Fixes críticos do audit (loading, erros, system prompt)
13. smart-query-generator queries por content type
14. Validações de depth por content type
```

---

*PRD — Content Engine v2.0*
*ShadowFeed — Canastra Inteligência*
*Versão 1.0 — Fevereiro 2026*
