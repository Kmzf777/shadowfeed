# Guia de Proteção de Setup e Correções

## 📋 Resumo das Mudanças

Esta atualização implementa **proteção de rotas** para usuários sem setup completo e **corrige o botão Finish** na página de setup.

---

## 🔒 Sistema de Proteção de Rotas

### Como Funciona

O sistema possui **dois níveis de proteção**:

#### 1. **SetupRequiredGuard** (Global)
Localizado em: [SetupRequiredGuard.tsx](src/components/SetupRequiredGuard.tsx)

- **Aplicado**: No layout principal (afeta todas as páginas)
- **Funciona**: Redireciona usuários logados sem setup completo para `/setup`
- **Rotas Isentas**: `/setup`, `/reception`, `/login`

**Como usar:**
Já está configurado automaticamente no [layout.tsx](src/app/layout.tsx):
```tsx
<AuthProvider>
  <SetupRequiredGuard>{children}</SetupRequiredGuard>
</AuthProvider>
```

#### 2. **useSetupProtection** Hook (Individual)
Localizado em: [useSetupProtection.ts](src/hooks/useSetupProtection.ts)

- **Aplicado**: Em páginas específicas que precisam de proteção adicional
- **Funciona**: Mostra loading e redireciona para `/setup` se necessário
- **Páginas protegidas**: Home, My Posts, My Account

**Como usar:**
```tsx
import { useSetupProtection } from '@/hooks/useSetupProtection';

export default function MyPage() {
  const { loading, shouldRedirect } = useSetupProtection();

  // Mostrar loading enquanto verifica
  if (loading || shouldRedirect) {
    return <LoadingScreen />;
  }

  // Renderizar página normalmente
  return <div>...</div>;
}
```

---

## 🔧 Correção do Botão "Finish" no Setup

### Problema Identificado

O botão "Finish" na última etapa do setup (`/setup`) **não estava funcionando** por dois motivos:

1. **Campos faltando**: Os campos `full_name`, `handle` e `avatar_url` não estavam sendo salvos, mas o `AuthContext` esperava esses campos
2. **Sem logs**: Não havia feedback visual/console para debug

### Solução Implementada

Arquivo modificado: [setup/page.tsx](src/app/setup/page.tsx)

#### Mudanças na função `handleSubmit`:

1. **Logs detalhados** em cada etapa:
```tsx
console.log('[SETUP] Starting submission...');
console.log('[SETUP] Uploading avatar...');
console.log('[SETUP] Profile updated successfully');
```

2. **Campos adicionados** ao update:
```tsx
const updateData = {
  // Campos existentes
  instagram_handle: data.instagramHandle || null,
  instagram_username: data.instagramUsername || null,
  ...

  // ✅ NOVOS CAMPOS (compatíveis com AuthContext)
  full_name: data.instagramHandle || null,
  handle: data.instagramUsername || null,
  avatar_url: avatarUrl || null,
};
```

3. **Alertas de erro** para o usuário:
```tsx
if (error) {
  alert(`Erro ao salvar: ${error.message}`);
  return;
}
```

---

## 🎯 Fluxo Completo de Setup

### Novo Fluxo Passo a Passo:

```
┌─────────────────────┐
│ Usuário cria conta  │
│ (setup_completed =  │
│      false)         │
└──────────┬──────────┘
           │
           ├──> Tenta acessar /
           │    ❌ SetupRequiredGuard redireciona para /setup
           │
           ├──> Tenta acessar /my-posts
           │    ❌ SetupRequiredGuard redireciona para /setup
           │
           ├──> Tenta acessar /my-account
           │    ❌ SetupRequiredGuard redireciona para /setup
           │
           ├──> Tenta acessar /criar-post
           │    ❌ SetupRequiredGuard redireciona para /setup
           │
           └──> Completa /setup (botão Finish)
                ✅ setup_completed = true
                ✅ Salvos: full_name, handle, avatar_url, etc.
                ✅ Redireciona para /
                ✅ Pode acessar todas as páginas
```

---

## 📁 Arquivos Modificados

### 1. **[web/src/app/setup/page.tsx](src/app/setup/page.tsx)**
**Mudanças:**
- ✅ Adicionado logs detalhados em `handleSubmit`
- ✅ Salvando `full_name`, `handle`, `avatar_url`
- ✅ Alertas de erro para o usuário

### 2. **[web/src/hooks/useSetupProtection.ts](src/hooks/useSetupProtection.ts)** (NOVO)
**Funcionalidade:**
- Hook customizado para proteção de rotas
- Retorna `loading`, `isSetupComplete`, `shouldRedirect`
- Usado em páginas específicas

### 3. **[web/src/app/page.tsx](src/app/page.tsx)** (Home)
**Mudanças:**
- ✅ Importado `useSetupProtection`
- ✅ Mostra loading durante verificação
- ✅ Redireciona se setup incompleto

### 4. **[web/src/app/my-posts/page.tsx](src/app/my-posts/page.tsx)**
**Mudanças:**
- ✅ Importado `useSetupProtection`
- ✅ Integrado com loading state existente

### 5. **[web/src/app/my-account/page.tsx](src/app/my-account/page.tsx)**
**Mudanças:**
- ✅ Importado `useSetupProtection`
- ✅ Proteção adicional contra acesso sem setup

---

## 🧪 Como Testar

### Teste 1: Setup Completo
1. Criar nova conta (ou usar conta sem setup)
2. Abrir `/setup`
3. Preencher todas as 7 etapas
4. Na última etapa (Avatar), clicar em "Finish"
5. **Esperado**:
   - Console mostra logs: `[SETUP] Starting submission...`
   - Redireciona para `/` (Home)
   - Pode acessar `/my-posts`, `/my-account`, etc.

### Teste 2: Proteção de Rotas
1. Criar conta e NÃO completar setup
2. Tentar acessar `/` diretamente
3. **Esperado**: Redireciona para `/setup`
4. Tentar acessar `/my-posts` diretamente
5. **Esperado**: Redireciona para `/setup`
6. Tentar acessar `/my-account` diretamente
7. **Esperado**: Redireciona para `/setup`

### Teste 3: Rotas Isentas
1. Criar conta e NÃO completar setup
2. Acessar `/reception`
3. **Esperado**: Acesso permitido (sem redirecionamento)
4. Acessar `/login`
5. **Esperado**: Acesso permitido (sem redirecionamento)

### Teste 4: Debug do Finish
1. Abrir DevTools (F12) → Console
2. Ir para `/setup` e completar todas as etapas
3. Clicar em "Finish"
4. **Esperado no console**:
```
[SETUP] Starting submission...
[SETUP] Uploading avatar... (se houver avatar)
[SETUP] Avatar uploaded: https://...
[SETUP] Updating user profile with: {...}
[SETUP] Profile updated successfully
[SETUP] Refreshing user profile...
[SETUP] Redirecting to home...
```

### Teste 5: Erro no Setup
1. Desligar conexão com Supabase (simular erro)
2. Tentar completar setup
3. **Esperado**:
   - Alert com mensagem de erro
   - Não redireciona
   - Botão volta ao estado normal

---

## 🔑 Campos Salvos no Setup

Quando o usuário completa o setup, os seguintes campos são salvos na tabela `users`:

| Campo | Origem | Usado por |
|-------|--------|-----------|
| `instagram_handle` | Step 1 | Posts, Perfil |
| `instagram_username` | Step 2 | Posts, Perfil |
| `target_audience` | Step 3 | IA para gerar posts |
| `main_pain_point` | Step 4 | IA para gerar posts |
| `voice_tone` | Step 5 | IA para gerar posts |
| `user_prompt` | Step 6 | IA para gerar posts |
| `avatar_path` | Step 7 | Storage do Supabase |
| `highlight_color` | Step 7 | Personalização UI |
| `setup_completed` | Automático | `true` após finish |
| `full_name` | ← `instagram_handle` | AuthContext |
| `handle` | ← `instagram_username` | AuthContext |
| `avatar_url` | ← `avatar_path` | AuthContext, UI |

---

## 🚨 Possíveis Problemas e Soluções

### Problema 1: Botão "Finish" não faz nada
**Sintomas**: Clicar em Finish não mostra logs, não redireciona

**Soluções**:
1. Verificar console do browser (F12)
2. Verificar se há erros no Supabase
3. Verificar se `user` existe no contexto
4. Verificar permissões RLS na tabela `users`

### Problema 2: Redireciona infinitamente
**Sintomas**: Página fica em loop entre `/` e `/setup`

**Soluções**:
1. Verificar se `setup_completed` foi salvo corretamente no banco
2. Verificar se `refreshUserProfile()` está funcionando
3. Limpar cache do browser
4. Fazer logout e login novamente

### Problema 3: Upload de avatar falha
**Sintomas**: Console mostra erro no upload

**Soluções**:
1. Verificar se bucket `avatars` existe no Supabase Storage
2. Verificar permissões do bucket (public read, authenticated write)
3. Verificar tamanho do arquivo (< 5MB recomendado)
4. Verificar formato da imagem (PNG, JPG, WEBP)

---

## 📊 Estrutura de Proteção

```
┌─────────────────────────────────────────┐
│         Layout Global (Root)             │
│  ┌───────────────────────────────────┐  │
│  │      AuthProvider                  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  SetupRequiredGuard         │  │  │
│  │  │  (Proteção Global)          │  │  │
│  │  │                              │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  Páginas Individuais  │  │  │  │
│  │  │  │  - Home               │  │  │  │
│  │  │  │    + useSetupProtection│ │  │  │
│  │  │  │  - My Posts           │  │  │  │
│  │  │  │    + useSetupProtection│ │  │  │
│  │  │  │  - My Account         │  │  │  │
│  │  │  │    + useSetupProtection│ │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

- [x] Corrigir função `handleSubmit` no setup
- [x] Adicionar logs detalhados
- [x] Salvar campos `full_name`, `handle`, `avatar_url`
- [x] Criar hook `useSetupProtection`
- [x] Adicionar proteção na Home page
- [x] Adicionar proteção em My Posts
- [x] Adicionar proteção em My Account
- [x] Testar fluxo completo de setup
- [x] Documentação criada

---

**Autor**: Claude
**Data**: 2026-02-14
**Versão**: 1.0.0
