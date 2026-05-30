# Edge Function Kiwify Webhook

Esta Edge Function do Supabase processa webhooks da Kiwify para atualizar automaticamente o status premium dos usuários.

## Configuração

### 1. Instalar o CLI do Supabase

```bash
npm install -g supabase
```

### 2. Fazer login no Supabase

```bash
supabase login
```

### 3. Linkar com seu projeto

```bash
supabase link --project-ref ieuruanmrmewrdlcsepm
```

### 4. Configurar variáveis de ambiente

No dashboard do Supabase, vá em:
- Settings → Edge Functions → Environment Variables

Adicione as seguintes variáveis:
```
SUPABASE_URL=https://ieuruanmrmewrdlcsepm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
KIWIFY_SECRET_TOKEN=seu-token-secreto-da-kiwify-aqui
```

### 5. Deploy da Edge Function

```bash
supabase functions deploy kiwify-webhook
```

## URL do Webhook

Após o deploy, o webhook estará disponível em:
```
https://ieuruanmrmewrdlcsepm.supabase.co/functions/v1/kiwify-webhook
```

## Configuração na Kiwify

1. Acesse o painel da Kiwify
2. Vá em Configurações → Webhooks
3. Adicione um novo webhook com a URL:
   ```
   https://ieuruanmrmewrdlcsepm.supabase.co/functions/v1/kiwify-webhook
   ```
4. Configure o header `x-kiwify-token` com seu token secreto
5. Selecione os eventos que deseja receber (pelo menos "order_status")

## Como obter o Kiwify Secret Token

1. Acesse o painel da Kiwify
2. Vá em Configurações → Webhooks
3. Crie um novo webhook
4. O token será gerado automaticamente
5. Copie o token e adicione nas variáveis de ambiente do Supabase

## Teste Local

Para testar localmente:

```bash
supabase functions serve kiwify-webhook
```

A função estará disponível em:
```
http://localhost:54321/functions/v1/kiwify-webhook
```

## Payload Esperado

A função espera o seguinte payload da Kiwify:

```json
{
  "order_status": "approved",
  "customer_email": "cliente@email.com",
  "order_id": "12345"
}
```

## Status de Pedido

- `approved`: Usuário é atualizado para premium
- `pending`: Nenhuma ação
- `canceled`: Nenhuma ação
- `refunded`: Nenhuma ação (pode ser implementado no futuro)
