# WorkMOM - Micro-SaaS de Vagas Home Office para Mães Solo

Plataforma exclusiva de vagas home office para mães solo com automação de pagamentos e raspador de vagas inteligente.

## 🚀 Funcionalidades

- **Raspador Inteligente**: Busca automática de vagas home office com classificação premium
- **Paywall Dinâmico**: Vagas recentes (< 48h) bloqueadas para usuários gratuitos
- **Automação de Pagamentos**: Webhook Kiwify para liberação automática do acesso premium
- **Dashboard de Vagas**: Interface responsiva e intuitiva para busca e candidatura

## 📁 Estrutura do Projeto

```
├── .gitignore
├── .env
├── README.md
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── server.js
├── database/
│   └── schema.sql
├── backend/
│   ├── package.json
│   ├── scraper.js
│   └── webhook.js
└── supabase/
    └── functions/
        └── kiwify-webhook/
            ├── index.ts
            └── README.md
```

## 🔧 Configuração

1. Configure as variáveis de ambiente no arquivo `.env`
2. Execute o script SQL no Supabase: `database/schema.sql`
3. Instale as dependências do backend: `cd backend && npm install`
4. Configure a Edge Function do Supabase (veja `supabase/functions/kiwify-webhook/README.md`)
5. Configure automação do raspador (GitHub Actions ou Task Scheduler - veja `GITHUB_ACTIONS.md` ou `TASK_SCHEDULER.md`)
6. Abra o frontend no navegador: `index.html` ou use `node server.js`

## 🤖 Raspador de Vagas

O projeto inclui dois raspadores:

- **simple-scraper.js**: Raspador simples que usa RSS feeds (recomendado para produção)
- **scraper.js**: Raspador avançado com Playwright (requer mais configuração)

O GitHub Actions usa o raspador simples por padrão para evitar bloqueios anti-bot.

## � Links Kiwify

- **Sales Page:** https://kiwify.app/OqYoemT
- **Assinatura WorkMOM:** https://pay.kiwify.com.br/BFdGdnt

## �💎 Planos

- **Gratuito**: Acesso a vagas com mais de 48 horas
- **Premium (R$ 14,90)**: Acesso imediato a todas as vagas, incluindo as mais recentes

## 🛡️ Segurança

- Frontend utiliza apenas SUPABASE_ANON_KEY
- Backend utiliza SUPABASE_SERVICE_ROLE_KEY para operações administrativas
- Webhook protegido com token secreto da Kiwify
