# GitHub Actions - Raspador Automático

## Configuração dos Secrets

1. Acesse o repositório no GitHub
2. Vá em **Settings → Secrets and variables → Actions**
3. Clique em **"New repository secret"**
4. Adicione os seguintes secrets:

### Secrets Necessários:

**SUPABASE_URL**
```
https://sua-url-aqui.supabase.co
```

**SUPABASE_SERVICE_ROLE_KEY**
```
sua-chave-secreta-master-aqui
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
