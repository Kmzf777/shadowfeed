# SHADOWFEED — PDR UPDATE 1.1 (High-Density Upgrade)

> **Foco:** Upgrade visual (Design Premium) e de Conteúdo (Densidade/Retenção).
> **Status:** Planejamento.

---

## 1. Objetivos da Atualização

Transformar o output do ShadowFeed de "informativo básico" para **"autoridade premium"**.
O conteúdo deve ser **denso** (alto valor por pixel) e o design deve ser **cinematográfico/tech**.

---

## 2. Diretrizes de Design (Visual System)

### 2.1. Tipografia de Alto Impacto
- **Headline (Título):** Fonte densa e compacta para permitir títulos maiores e mais longos sem quebrar o layout.
    - *Sugestão:* **"Inter Tight"**, **"Oswald"** ou **"Sora"** (Pesos: 700/800).
    - *Letter-spacing:* Levemente negativo (-0.02em a -0.04em) para sensação de "bloco".
    - *Highlighting:* Palavras-chave devem ter cor de destaque (Accent) ou fundo marcado.

- **Body (Corpo):** Alta legibilidade.
    - *Sugestão:* **"Inter"** ou **"DM Sans"**.
    - *Tamanho:* Reduzido levemente para permitir mais texto, mas com maior entrelinha (1.5).

### 2.2. Atmosfera e Cores
- **Tema Base:** "Deep Tech".
- **Backgrounds:** Não apenas cores sólidas. Uso de:
    - *Noise textures* (granulação suave) para evitar banding e dar textura.
    - *Glows* localizados (radial gradients) atrás de elementos chave.
    - *Glassmorphism* (fundo desfocado) para cartões sobrepostos.

### 2.3. Elementos Visuais (Images)
- Introdução de **Imagens Reais / Mistas**:
    - O sistema deve suportar placeholders de imagem.
    - *Tratamento:* Todas as imagens devem ter tratamento (dimmer, saturação ajustada) para não brigar com o texto.
    - *Bordas:* Rounded corners suaves (16px a 24px) + Border thin (1px) com opacidade.

---

## 3. Estrutura de Conteúdo (Content Engineering)

### 3.1. O conceito de "Densidade"
Densidade não é "parede de texto". É **informação estruturada**.
O novo prompt deve instruir o Gemini a:
- Usar **Listas com Ícones** em vez de parágrafos soltos.
- Criar **Mini-Tabelas** ou comparações (Antes vs Depois).
- Usar **Diagramas Mentais** (ex: "X leva a Y").

### 3.2. Novos Tipos de Slides (Layouts)

| Role | Layout Variant | Descrição |
|------|----------------|-----------|
| `hook` | `hero-image` | Título gigante sobreposto a imagem ou fundo complexo. |
| `content` | `split-left` | Texto à esquerda, Imagem/Mockup à direita. |
| `content` | `split-right` | Texto à direita, Imagem/Mockup à esquerda. |
| `showcase` | `bento-grid` | Grid estilo "Bento Box" (4 itens) para ferramentas ou features. |
| `tutorial` | `step-focus` | Imagem grande do passo + instrução flutuante. |
| `cta` | `profile-card` | Foto do perfil, Bio resumida e seta para "Seguir". |

---

## 4. Updates no Prompt (Engenharia)

O arquivo `system.prompt.ts` será reescrito para:

1.  **Format JSON Híbrido:** Suportar Markdown dentro das strings (`**negrito**`, `> quote`).
2.  **Explicit Image Prompts:** Para cada slide, gerar um `image_idea` (descrição para gerar a imagem depois).
3.  **Critical Review:** Instruir o modelo a criticar o próprio copy antes de finalizar ("Isso está chato? Melhore.").

---

## 5. Exemplo de Estrutura de Slide (Novo JSON)

```json
{
  "slide": 2,
  "role": "content",
  "layout_variant": "split-right",
  "headline": "O segredo é a **Estrutura**",
  "body_markdown": "- ❌ **Errado:** Texto corrido sem pausas.\n- ✅ **Certo:** Blocos visuais e *destaques*.\n\nIsso aumenta a retenção em 40%.",
  "image": {
    "type": "placeholder",
    "prompt": "Futuristic wireframe of a structured database vs chaotic data, neon style",
    "url": "null"
  },
  "highlight_color": "#00ff88"
}
```
# Design System — Homepage Galeria IA

> **Referência visual**: homepage do [Imagine.art](https://imagine.art)
> **Prompt-guia para Claude Code** — siga este documento como fonte de verdade para tokens, componentes e comportamento.

---

## 1. Visão Geral

A homepage é uma **galeria imersiva full-bleed** de imagens geradas por IA. O conteúdo visual É a interface — não há hero section, não há texto grande de boas-vindas. O usuário abre a página e já é recebido por um grid infinito de imagens. No meio do grid, um **CTA Card** convida o usuário a começar a criar.

### Arquitetura da página (top → bottom)

```
┌─────────────────────────────────────────────┐
│  NAVBAR (sticky, glassmorphism)             │
├─────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 4:5 │ │ 4:5 │ │ 4:5 │ │ 4:5 │ │ 4:5 │  │  ← Row 1
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌───────────────┐ ┌─────┐         │
│  │ 4:5 │ │   CTA CARD    │ │ 4:5 │         │  ← Row 2 (CTA ocupa 3 colunas centrais)
│  └─────┘ └───────────────┘ └─────┘         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 4:5 │ │ 4:5 │ │ 4:5 │ │ 4:5 │ │ 4:5 │  │  ← Row 3...N (infinite scroll)
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│              ... scroll infinito ...         │
└─────────────────────────────────────────────┘
```

---

## 2. Design Tokens

### 2.1 Cores

```css
:root {
  /* ── Superfícies ── */
  --bg-page:          #0a0a0a;    /* fundo principal */
  --bg-card:          #161616;    /* placeholder / shimmer das imagens */
  --bg-elevated:      #1a1a1a;    /* superfícies elevadas (dropdowns, modals) */

  /* ── Accent ── */
  --accent:           #8a00c4;    /* COR PRIMÁRIA — botões, CTA, links */
  --accent-light:     #b44cff;    /* hover, glows */
  --accent-dark:      #5c0082;    /* gradientes */
  --accent-deep:      #2a003d;    /* fim do gradiente */

  /* ── Texto ── */
  --text-primary:     #ffffff;
  --text-secondary:   rgba(255, 255, 255, 0.65);
  --text-muted:       rgba(255, 255, 255, 0.4);

  /* ── Bordas & Separadores ── */
  --border-subtle:    rgba(255, 255, 255, 0.06);
  --border-light:     rgba(255, 255, 255, 0.12);
  --border-accent:    rgba(138, 0, 196, 0.4);

  /* ── Overlay ── */
  --overlay-hover:    linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
  --glass-bg:         rgba(10, 10, 10, 0.8);
  --glass-blur:       blur(20px);
}
```

### 2.2 Tipografia

| Uso          | Família                         | Peso | Tamanho              | Tracking     |
| ------------ | ------------------------------- | ---- | -------------------- | ------------ |
| Logo / H1    | `'Sora', sans-serif`            | 700  | 18px (logo), 28px    | -0.02em      |
| H2 (CTA)     | `'Sora', sans-serif`            | 700  | clamp(20px, 2.5vw, 28px) | -0.02em |
| Body / UI    | `'DM Sans', sans-serif`         | 400–600 | 14–15px           | normal       |
| Botões       | `'DM Sans', sans-serif`         | 600  | 14–15px              | normal       |

**Importar do Google Fonts:**
```
https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap
```

### 2.3 Espaçamento & Raios

```
--spacing-xs:    8px
--spacing-sm:    12px     ← gap do grid
--spacing-md:    16px
--spacing-lg:    20px     ← padding lateral do grid
--spacing-xl:    24px     ← padding da navbar
--spacing-2xl:   40px
--spacing-3xl:   48px     ← padding interno do CTA card

--radius-sm:     8px      ← botões da nav
--radius-md:     12px     ← cards de imagem
--radius-lg:     16px     ← CTA card
```

### 2.4 Sombras & Glows

```css
/* CTA card — estado default */
box-shadow: 0 0 30px rgba(138, 0, 196, 0.15), 0 10px 30px rgba(0, 0, 0, 0.3);

/* CTA card — hover */
box-shadow: 0 0 60px rgba(138, 0, 196, 0.4), 0 20px 40px rgba(0, 0, 0, 0.5);

/* Botão primário — hover */
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
```

---

## 3. Componentes

### 3.1 Navbar

```
Comportamento:   position: sticky, top: 0, z-index: 100
Background:      var(--glass-bg) + backdrop-filter: var(--glass-blur)
Borda inferior:  1px solid var(--border-subtle)
Altura:          ~56px (padding 16px vertical)
Layout:          flex, space-between, align-center
```

**Conteúdo:**
- **Esquerda**: Ícone logo (32×32px, gradient accent, radius-sm) + "Imagine" (Sora 700 18px)
- **Direita**: Botão "Entrar" (outline, border-light) + Botão "Criar conta" (filled, accent)

**Botões da nav:**
```css
.nav-btn {
  font-family: 'DM Sans';
  font-size: 14px;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-btn:hover {
  transform: translateY(-1px);
}
```

### 3.2 Photo Card (célula do grid)

```
Aspect ratio:    4 / 5           ← OBRIGATÓRIO, todas as imagens
Border radius:   var(--radius-md) (12px)
Overflow:        hidden
Background:      var(--bg-card)   (placeholder enquanto carrega)
Cursor:          pointer
```

**Estados:**
1. **Loading** — shimmer animado (gradiente deslizando horizontalmente)
2. **Loaded** — imagem fade-in (opacity 0→1 em 0.4s)
3. **Hover** — overlay gradiente escuro de baixo para cima

**Animação de entrada (scroll):**
```css
/* Antes de entrar no viewport */
opacity: 0;
transform: translateY(30px);

/* Ao entrar (IntersectionObserver, threshold: 0.1) */
opacity: 1;
transform: translateY(0);
transition: opacity 0.6s ease, transform 0.6s ease;

/* Stagger: cada card na mesma row tem delay escalonado */
transition-delay: calc((index % colunas) * 0.08s);
```

**Shimmer:**
```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
background: linear-gradient(110deg, #161616 30%, #1e1e1e 50%, #161616 70%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

### 3.3 CTA Card — "Comece a criar gratuitamente"

> **Este componente substitui o input de texto da referência original.**

```
Posição no grid:     Row 2, colunas 2–4 (span 3 de 5)
Padding:             48px 40px
Border radius:       var(--radius-lg) (16px)
Background:          linear-gradient(135deg, #8a00c4 0%, #5c0082 50%, #2a003d 100%)
```

**Camadas visuais (de trás para frente):**

1. **Gradient base** — `linear-gradient(135deg, var(--accent), var(--accent-dark), var(--accent-deep))`
2. **Grain overlay** — SVG feTurbulence, opacity 0.06, pointerEvents: none
3. **Glow orbs** — 2 divs circulares com radial-gradient + blur(30–40px), animação `float` (translateY ±20px em 6s ease-in-out infinite)
4. **Conteúdo** (z-index: 1):
   - Ícone container (56×56px, radius 14px, bg rgba(255,255,255,0.12), backdrop-blur, border rgba(255,255,255,0.15)) com ícone "+" SVG branco 28px
   - H2: "Comece a criar gratuitamente" — Sora 700, clamp(20px, 2.5vw, 28px), branco
   - Subtítulo: "Transforme suas ideias em imagens incríveis com inteligência artificial" — DM Sans 15px, text-secondary, max-width 340px
   - Botão: "Criar agora →" — DM Sans 600, 15px, padding 12px 32px, bg branco 95%, cor #8a00c4, radius 10px

**Hover do CTA Card:**
```css
transform: scale(1.01);
transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
/* sombra muda para versão intensa */
```

**Hover do botão interno:**
```css
transform: translateY(-1px);
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
```

### 3.4 Loading Indicator (scroll infinito)

Três dots pulsantes na cor accent:
```css
width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
animation: pulse 1s ease-in-out infinite;
/* cada dot tem delay: 0s, 0.15s, 0.3s */

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}
```

---

## 4. Layout do Grid

### Grid Principal

```css
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);        /* 12px */
  padding: 0 var(--spacing-lg);  /* 20px lateral */
}
```

### Breakpoints Responsivos

| Viewport       | Colunas | CTA span              |
| -------------- | ------- | --------------------- |
| ≥ 1200px       | 5       | col 2 / span 3        |
| 900–1199px     | 4       | col 2 / span 2        |
| 600–899px      | 3       | col 1 / span 3 (full) |
| < 600px        | 2       | col 1 / span 2 (full) |

```css
@media (max-width: 1199px) { .grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 899px)  { .grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 599px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
```

---

## 5. Comportamento: Infinite Scroll

### Mecânica

```
1. Renderizar batch inicial (ex: 20 imagens)
2. Colocar um <div> sentinela (height: 1px) após o último card
3. IntersectionObserver no sentinela com rootMargin: "400px"
4. Quando sentinela entra no viewport expandido:
   a. Mostrar loading indicator (3 dots)
   b. Fazer fetch do próximo batch de imagens (API ou mock)
   c. Append novos cards ao grid
   d. Mover sentinela para depois do novo último card
5. Novos cards entram com a mesma animação de fade+slide (IntersectionObserver individual)
```

### Dados das imagens

Cada imagem no grid deve ter:
```typescript
interface GalleryImage {
  id: string;
  url: string;          // URL da imagem (4:5, mínimo 400×500px)
  prompt?: string;      // texto do prompt usado para gerar (exibir no hover, futuro)
  author?: string;      // nome do criador (exibir no hover, futuro)
}
```

Para desenvolvimento/mock, usar:
```
https://picsum.photos/seed/{uniqueSeed}/400/500
```

---

## 6. Animações

| Nome       | Uso                        | Definição                                                                  |
| ---------- | -------------------------- | -------------------------------------------------------------------------- |
| `shimmer`  | Placeholder dos cards      | Gradiente horizontal loop, 1.5s infinite                                   |
| `fadeDown`  | Entrada da navbar          | translateY(-10px) → 0, opacity 0→1, 0.5s ease                            |
| `fadeUp`   | Entrada dos cards no grid  | translateY(30px) → 0, opacity 0→1, 0.6s ease + stagger delay             |
| `float`    | Glow orbs no CTA           | translateY(0) → translateY(-20px) → 0, 6s ease-in-out infinite           |
| `pulse`    | Loading dots               | opacity 0.4 → 1 → 0.4, 1s ease-in-out infinite                          |

---

## 7. Scrollbar Customizada

```css
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
```

---

## 8. Checklist de Implementação

- [ ] Fundo da página `#0a0a0a`, sem margin/padding do body
- [ ] Google Fonts: Sora + DM Sans importados
- [ ] Navbar sticky com glassmorphism (blur 20px, bg 80% opacity)
- [ ] Grid 5 colunas, gap 12px, padding 20px
- [ ] **Todas** as imagens com `aspect-ratio: 4/5` — sem exceção
- [ ] Cards com border-radius 12px e overflow hidden
- [ ] Shimmer animado enquanto imagem carrega
- [ ] Fade-in com stagger ao entrar no viewport (IntersectionObserver)
- [ ] Hover nas imagens: overlay gradiente escuro de baixo para cima
- [ ] CTA Card na row 2, span 3 colunas centrais
- [ ] CTA com gradiente accent, glow orbs, grain, botão branco
- [ ] Infinite scroll com sentinela + IntersectionObserver (rootMargin 400px)
- [ ] Loading indicator: 3 dots pulsantes accent
- [ ] Breakpoints: 5 → 4 → 3 → 2 colunas
- [ ] Scrollbar customizada fina
- [ ] Nenhum texto hero — o grid começa imediatamente após a navbar

---

## 9. Stack Recomendado

| Camada       | Tecnologia                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js (App Router) ou React + Vite |
| Estilização  | CSS Modules ou Tailwind CSS          |
| Animações    | CSS nativo (keyframes + transitions) |
| Scroll       | IntersectionObserver API nativa      |
| Imagens      | `<img loading="lazy">` ou next/image |
| Fonte        | Google Fonts (Sora + DM Sans)        |

---

## 10. Notas para Claude Code

> **Ao gerar código a partir deste design system, siga estas regras:**
>
> 1. **Não invente componentes extras** — a página é APENAS: navbar + grid de imagens + CTA card no meio.
> 2. **aspect-ratio: 4/5 é inegociável** — é o formato padrão de todas as fotos.
> 3. **O CTA card NÃO é um modal/popup** — ele mora DENTRO do grid, como se fosse um card de imagem que ocupa mais espaço.
> 4. **Infinite scroll é obrigatório** — use IntersectionObserver, não scroll event listeners.
> 5. **A cor accent é `#8a00c4`** — use em: botão "Criar conta", CTA card, loading dots, glows.
> 6. **Dark mode only** — não há light mode.
> 7. **Sem bibliotecas de UI** — tudo feito com CSS nativo (ou Tailwind se o projeto já usar).
> 8. **Performance**: lazy loading em todas as imagens, IntersectionObserver para animações de entrada.