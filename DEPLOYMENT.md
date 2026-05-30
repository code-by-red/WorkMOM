# Deployment na Vercel

## Configuração de Variáveis de Ambiente

1. Acesse o dashboard da Vercel
2. Vá em **Settings → Environment Variables**
3. Adicione as seguintes variáveis:

```
SUPABASE_URL=https://sua-url-aqui.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica-anonima-aqui
```

## Como Funciona

- **Desenvolvimento Local:** Usa `config.local.js` (não commitado no Git)
- **Produção (Vercel):** O script `build.js` substitui os placeholders `__SUPABASE_URL__` e `__SUPABASE_ANON_KEY__` pelas variáveis de ambiente configuradas no painel da Vercel durante o build

## Segurança

- As credenciais não estão expostas no código versionado
- `config.local.js` está no `.gitignore`
- Variáveis de ambiente são injetadas apenas durante o build na Vercel
- Placeholders no HTML são substituídos automaticamente
