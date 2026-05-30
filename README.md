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
├── database/
│   └── schema.sql
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
└── backend/
    ├── package.json
    ├── scraper.js
    └── webhook.js
```

## 🔧 Configuração

1. Configure as variáveis de ambiente no arquivo `.env`
2. Execute o script SQL no Supabase: `database/schema.sql`
3. Instale as dependências do backend: `cd backend && npm install`
4. Inicie o webhook: `node backend/webhook.js`
5. Execute o raspador: `node backend/scraper.js`
6. Abra o frontend no navegador: `frontend/index.html`

## 💎 Planos

- **Gratuito**: Acesso a vagas com mais de 48 horas
- **Premium (R$ 14,90)**: Acesso imediato a todas as vagas, incluindo as mais recentes

## 🛡️ Segurança

- Frontend utiliza apenas SUPABASE_ANON_KEY
- Backend utiliza SUPABASE_SERVICE_ROLE_KEY para operações administrativas
- Webhook protegido com token secreto da Kiwify
