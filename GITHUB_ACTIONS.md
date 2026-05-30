# GitHub Actions - Raspador Automático

## Configuração dos Secrets

1. Acesse o repositório no GitHub
2. Vá em **Settings → Secrets and variables → Actions**
3. Clique em **"New repository secret"**
4. Adicione os seguintes secrets:

### Secrets Necessários:

**SUPABASE_URL**
```
https://ieuruanmrmewrdlcsepm.supabase.co
```

**SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldXJ1YW5tcm1ld3JkbGNzZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA5Mjc4MSwiZXhwIjoyMDk1NjY4NzgxfQ.U6zP5gXHV8PF3xsCsHZLbx068tqf3y3rK7h-FPJq67s
```

## Como Funciona

- **Execução Automática:** Diariamente às 6:00 UTC (3:00 da manhã horário de Brasília)
- **Execução Manual:** Vá em **Actions → Raspador de Vagas WorkMOM → Run workflow**
- **O que faz:** Instala dependências, executa o raspador Playwright, salva vagas no Supabase

## Vantagens sobre Task Scheduler:

✅ Roda na nuvem (não precisa do PC ligado)
✅ Gratuito para repositórios públicos
✅ Logs de execução disponíveis
✅ Pode ser executado manualmente a qualquer momento
✅ Histórico de execuções

## Solução Alternativa

Se preferir usar Task Scheduler local, siga as instruções em `TASK_SCHEDULER.md`.
