# Scripts de Limpeza de Portas

Este diretório contém scripts para resolver problemas de conflito de portas no desenvolvimento Next.js.

## Scripts Disponíveis

### `cleanup-ports.bat`
Script Windows que mata todos os processos Node.js/Next.js usando as portas 3000-3005.

### `dev-clean.bat`
Script wrapper que:
1. Executa a limpeza de portas
2. Inicia o Next.js na porta 3000
3. **Recomendado para uso no Windows (PowerShell e CMD)**

## Scripts npm no package.json

### `npm run dev:safe`
Inicia o Next.js na porta 3000 sem limpeza automática
- Se 3000 estiver ocupada, Next.js automaticamente tenta 3001, 3002, etc.

### `npm run kill-server`
Mata todos os processos de desenvolvimento sem iniciar o servidor
- Útil para limpar processos zombis
- Pode ser usado antes de iniciar manualmente outro serviço

## Como Usar no Windows

### Opção 1: Script direto (Recomendado)
```powershell
# No diretório raiz do projeto
web\scripts\dev-clean.bat
```

Isso limpa as portas e inicia o servidor automaticamente.

### Opção 2: Passo a passo
```powershell
# 1. Limpar as portas
web\scripts\cleanup-ports.bat

# 2. Iniciar o servidor
cd web
npm run dev:safe
```

### Opção 3: Manual via PowerShell/CMD
```powershell
# Limpar portas
npm run kill-server

# Iniciar servidor
cd web
npm run dev:safe
```

## Resolvendo Problemas Comuns

### "EADDRINUSE: address already in use :::3000"
Isso acontece quando há outro processo usando a porta 3000. Solução:

```powershell
web\scripts\dev-clean.bat
```

Ou manualmente:
```powershell
web\scripts\cleanup-ports.bat
cd web
npm run dev:safe
```

### Processos zombis mantendo as portas ocupadas
Se você fechou o terminal mas o processo continua rodando:

```powershell
npm run kill-server
```

### Múltiplos servidores rodando
Se você iniciou vários servidores em diferentes terminais:

```powershell
npm run kill-server
```

Depois execute apenas um servidor:
```powershell
web\scripts\dev-clean.bat
```

## Notas Técnicas

- O script verifica portas 3000 a 3005 para cobrir cenários com múltiplas instâncias
- Usa `netstat` para identificar processos nas portas
- Usa `taskkill /F` para forçar encerramento dos processos
- Erros são suprimidos silenciosamente quando não há processos para matar