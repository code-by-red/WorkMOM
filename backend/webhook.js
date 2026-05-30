require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Inicializa Supabase com SERVICE_ROLE_KEY (chave master para operações administrativas)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Valida o token secreto da Kiwify
 */
function validateKiwifyToken(req, res, next) {
    const receivedToken = req.headers['x-kiwify-token'];
    
    if (!receivedToken || receivedToken !== process.env.KIWIFY_SECRET_TOKEN) {
        console.error('❌ Token inválido ou não fornecido');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
}

/**
 * Webhook para receber notificações da Kiwify
 */
app.post('/webhook/kiwify', validateKiwifyToken, async (req, res) => {
    try {
        const { order_status, customer_email, order_id } = req.body;
        
        console.log(`📩 Webhook recebido - Order: ${order_id}, Status: ${order_status}, Email: ${customer_email}`);
        
        // Verifica se o pagamento foi aprovado
        if (order_status === 'approved') {
            console.log(`✅ Pagamento aprovado para ${customer_email} - Atualizando status premium...`);
            
            // Busca o usuário pelo email
            const { data: user, error: userError } = await supabase
                .from('usuarios')
                .select('id, email, is_premium')
                .eq('email', customer_email)
                .single();
            
            if (userError || !user) {
                console.error(`❌ Usuário não encontrado com email: ${customer_email}`);
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Verifica se já é premium
            if (user.is_premium) {
                console.log(`⚠️ Usuário ${customer_email} já é premium`);
                return res.status(200).json({ message: 'User already premium' });
            }
            
            // Atualiza status para premium
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ 
                    is_premium: true,
                    updated_at: new Date().toISOString()
                })
                .eq('email', customer_email);
            
            if (updateError) {
                console.error('❌ Erro ao atualizar usuário:', updateError);
                return res.status(500).json({ error: 'Failed to update user' });
            }
            
            console.log(`🎉 Usuário ${customer_email} atualizado para PREMIUM com sucesso!`);
            return res.status(200).json({ message: 'User upgraded to premium' });
        }
        
        // Outros status (pending, canceled, etc.)
        console.log(`ℹ️ Status do pedido: ${order_status} - Nenhuma ação necessária`);
        return res.status(200).json({ message: 'Webhook received' });
        
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Rota de health check
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Inicia o servidor
 */
app.listen(PORT, () => {
    console.log(`🚀 Servidor webhook rodando na porta ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/kiwify`);
});
