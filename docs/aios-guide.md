# AIOS — Guia de Uso Prático

## Sumário

- [Fluxo geral](#fluxo-geral)
- [Agentes](#agentes)
- [Workflow paralelo: VS Code + Antigravity](#workflow-paralelo-vscode--antigravity)

---

## Fluxo geral

```
@analyst → @pm → @architect → @data-engineer → @sm → @dev → @qa → @devops
```

Você não precisa passar por todos. Use só os que a tarefa exige.

---

## Agentes

### `@analyst` — Pesquisa e descoberta

**Quando usar:** antes de qualquer nova feature, quando precisar entender o mercado, mapear o que o projeto já tem (brownfield), ou validar uma ideia.

**NÃO use para:** criar PRD → use `@pm`. Decisões técnicas → use `@architect`.

```
@analyst Mapeie todos os módulos existentes do projeto shadowfeed,
entenda o fluxo recon → forge → render e documente como o sistema
funciona hoje (brownfield discovery).
```

```
@analyst Pesquise as melhores APIs de distribuição de conteúdo para
LinkedIn e Twitter que funcionam com automação via Node.js em 2026.
```

---

### `@pm` — Estratégia de produto e PRD

**Quando usar:** para criar o documento PRD de uma feature, definir escopo, priorizar o que entra ou não, criar epics.

**NÃO use para:** criar stories → use `@sm`. Pesquisa → use `@analyst`.

```
@pm Crie o PRD para um módulo de distribuição automática de posts.
O sistema já gera posts com o forge. Preciso publicar automaticamente
no LinkedIn e Twitter após o render. Use docs/prd.md como destino.
```

```
@pm Defina os epics para implementar um sistema de agendamento
de publicações no shadowfeed, com fila e retry em caso de falha.
```

---

### `@architect` — Arquitetura técnica

**Quando usar:** para decidir como um novo módulo se encaixa na estrutura existente, escolher tecnologias, desenhar APIs, definir padrões de integração.

**NÃO use para:** implementar código → use `@dev`. Banco de dados → use `@data-engineer`.

```
@architect Preciso adicionar um módulo `distribute` ao shadowfeed.
Ele deve receber o output do render.service.ts e publicar via APIs
externas. Como ele deve se encaixar na estrutura src/modules/?
Quais contratos de interface com o pipeline.service.ts?
```

```
@architect Avalie se faz sentido adicionar uma fila (Bull/BullMQ)
para o pipeline de geração de posts ou se o node-cron atual é suficiente.
```

---

### `@data-engineer` — Banco de dados e Supabase

**Quando usar:** para criar ou alterar tabelas no Supabase, escrever migrations, definir RLS policies, otimizar queries.

**NÃO use para:** lógica de aplicação → use `@dev`.

```
@data-engineer Crie a migration para uma tabela `scheduled_posts`
no Supabase com campos: id, post_id (FK posts), platform (enum),
scheduled_at, status (pending/sent/failed), published_at.
Inclua as RLS policies para que o usuário só veja os próprios registros.
```

```
@data-engineer A query que busca posts do usuário com JOIN em slides
está lenta. Sugira índices e otimizações para a tabela posts no Supabase.
```

---

### `@sm` — Scrum Master / Criação de stories

**Quando usar:** depois do PRD pronto (`@pm`), para quebrar os epics em stories detalhadas que o `@dev` vai executar. As stories ficam em `docs/stories/`.

**NÃO use para:** implementar → use `@dev`. Criar PRD → use `@pm`.

```
@sm A partir do PRD em docs/prd.md, crie as stories do epic 1
(módulo distribute). Cada story deve incluir: contexto do sistema,
arquivos afetados, critérios de aceitação e instruções de implementação.
```

```
@sm Crie uma story para adicionar retry automático no forge.service.ts
quando a API da OpenAI retornar erro 429 (rate limit).
```

---

### `@dev` — Implementação

**Quando usar:** para escrever código. Sempre aponte para uma story específica em `docs/stories/` para que ele tenha contexto completo.

**NÃO use para:** criar stories → use `@sm`. Push/PR → use `@devops`.

```
@dev Implemente a story em docs/stories/story-01-distribute-module.md.
Siga os padrões dos módulos existentes em src/modules/forge/.
```

```
@dev Refatore o forge.service.ts para separar a lógica de prompt
building do service principal, seguindo o padrão já usado em
src/modules/forge-authority/prompt-builder.ts.
```

---

### `@qa` — Qualidade e testes

**Quando usar:** após o `@dev` finalizar uma implementação, para revisar qualidade, sugerir testes, identificar edge cases.

```
@qa Revise a implementação do módulo distribute em
src/modules/distribute/. Verifique tratamento de erros, edge cases
e sugira os testes unitários mais críticos para este módulo.
```

```
@qa O pipeline recon → forge → render não tem cobertura de testes.
Qual é a estratégia mínima de testes que faz sentido para este fluxo?
```

---

### `@devops` — Git, CI/CD e deploy

**Quando usar:** para criar branches, fazer push, abrir PRs, configurar pipelines. É o único agente autorizado a fazer push no remoto.

```
@devops Crie a branch feature/distribute-module, faça commit das
alterações em src/modules/distribute/ e abra um PR para main com
o resumo das mudanças.
```

```
@devops Configure um GitHub Actions workflow para rodar tsc --noEmit
em todo PR aberto para a branch main.
```

---

### `@po` — Product Owner / Backlog

**Quando usar:** para priorizar o backlog, refinar critérios de aceitação, decidir o que entra no próximo sprint.

```
@po Temos 3 features pendentes: módulo distribute, sistema de
agendamento e analytics de posts. Priorize com base no impacto
para o usuário vs esforço de implementação.
```

---

### `@ux-design-expert` — Design e UX

**Quando usar:** para criar wireframes, definir fluxos de usuário, especificar componentes do frontend (`web/src/`).

```
@ux-design-expert Desenhe o fluxo de usuário para a feature de
agendamento de posts no painel web. O usuário cria o post no
/criar-post e deve poder escolher publicar agora ou agendar.
```

---

### `@aios-master` — Orquestrador geral

**Quando usar:** quando a tarefa não é clara o suficiente para um agente específico, ou quando precisar coordenar múltiplos agentes numa sequência.

```
@aios-master Quero adicionar um sistema de agendamento de posts
ao shadowfeed. Orquestre o fluxo completo desde o PRD até as stories
prontas para implementação.
```

---

## Sequências práticas para o shadowfeed

### Nova feature completa
```
1. @analyst  → discovery e pesquisa
2. @pm       → PRD e epics
3. @architect → decisões técnicas
4. @sm       → stories detalhadas
5. @dev      → implementação story a story
6. @qa       → revisão e testes
7. @devops   → PR e merge
```

### Bug ou melhoria pontual
```
1. @dev  → corrige com contexto direto
2. @qa   → valida (opcional)
3. @devops → commit e PR
```

### Mudança de banco de dados
```
1. @data-engineer → migration + RLS
2. @dev           → adapta o service/controller
3. @qa            → valida contratos
```

---

## Workflow Paralelo: VS Code + Antigravity

### O que é possível

Você pode rodar **duas instâncias de Claude Code simultaneamente** — uma no VS Code e outra no Antigravity — apontando para o **mesmo repositório**. As ferramentas não conflitam entre si tecnicamente, mas exigem disciplina para evitar conflito de arquivos.

### Configuração

**VS Code:** Claude Code via extensão oficial da Anthropic (login com conta Anthropic/Max)

**Antigravity:**
1. Abra o projeto no Antigravity
2. `Ctrl+Shift+X` → pesquise "Claude Code" → instale a extensão
3. Autentique com `/log` → escolha API key ou conta

> Antigravity usa Gemini por padrão, mas suporta Claude como modelo alternativo. Você pode ter Claude Code rodando dentro do Antigravity com sua conta Anthropic.

---

### Estratégia 1 — Mesma tarefa, divisão de responsabilidade

Ideal para features grandes. Cada instância fica responsável por uma camada.

```
VS Code (Claude Code)          Antigravity (Claude Code)
────────────────────           ────────────────────────
@architect + @sm               @dev + @qa
Planejamento e stories    →    Implementação
docs/prd.md                    src/modules/distribute/
docs/stories/                  src/modules/distribute/
```

**Como coordenar:**
- VS Code gera as stories em `docs/stories/`
- Antigravity lê as stories e implementa
- Nenhuma instância toca nos mesmos arquivos ao mesmo tempo

---

### Estratégia 2 — Tarefas diferentes em paralelo (mais comum)

Cada instância trabalha em um módulo ou branch diferente.

```
VS Code (branch: feature/distribute)
  └─ @dev implementando src/modules/distribute/

Antigravity (branch: feature/analytics)
  └─ @dev implementando src/modules/analytics/
```

**Regra:** branches separadas, arquivos separados. Merge ao final.

---

### Estratégia 3 — Antigravity planeja, VS Code implementa

Aproveita o ponto forte de cada ferramenta.

```
Antigravity (Gemini nativo — gratuito)
  └─ @analyst, @pm, @architect
  └─ Gera PRD, epics, decisões de arquitetura
  └─ Economiza tokens do Claude

VS Code (Claude Code)
  └─ @sm, @dev, @qa
  └─ Implementação e revisão de código
  └─ Usa a superioridade do Claude em raciocínio de código
```

---

### O que evitar

| Situação | Problema |
|---|---|
| Duas instâncias editando o mesmo arquivo | Conflito de merge, perda de código |
| Duas instâncias na mesma branch sem sync | Git conflicts difíceis de resolver |
| Dar a mesma instrução para os dois | Trabalho duplicado |
| Deixar as duas rodando sem supervisão | Uma pode desfazer o que a outra fez |

---

### Fluxo recomendado para o shadowfeed

```
Terminal 1 — VS Code
  git checkout -b feature/distribute
  @dev Implemente docs/stories/story-01.md

Terminal 2 — Antigravity (outra janela)
  git checkout -b feature/analytics
  @dev Implemente docs/stories/story-02.md

Ao finalizar:
  git checkout main
  git merge feature/distribute
  git merge feature/analytics
```

---

> **Dica:** Use o `@devops` no VS Code para gerenciar os merges ao final. Ele é o agente com permissão de push e sabe resolver conflitos dentro do contexto do AIOS.
