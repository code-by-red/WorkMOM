# Deployment na Vercel

## Configuração de Variáveis de Ambiente

1. Acesse o dashboard da Vercel
2. Vá em **Settings → Environment Variables**
3. Adicione as seguintes variáveis:

```
SUPABASE_URL=https://ieuruanmrmewrdlcsepm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldXJ1YW5tcm1ld3JkbGNzZXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTI3ODEsImV4cCI6MjA5NTY2ODc4MX0.xa8pyLwB96ePj_E9xkN3gyVS5AcV--7Ie3xw3939Mio
```

## Como Funciona

- **Desenvolvimento Local:** Usa `config.local.js` (não commitado no Git)
- **Produção (Vercel):** O script `build.js` substitui os placeholders pelas variáveis de ambiente configuradas no painel da Vercel

## Segurança

- As credenciais não estão expostas no código versionado
- `config.local.js` está no `.gitignore`
- Variáveis de ambiente são injetadas apenas durante o build na Vercel
