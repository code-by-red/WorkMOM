import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const kiwifySecretToken = Deno.env.get('KIWIFY_SECRET_TOKEN')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Valida método HTTP
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Valida token secreto da Kiwify
  const receivedToken = req.headers.get('x-kiwify-token')
  if (!receivedToken || receivedToken !== kiwifySecretToken) {
    console.error('❌ Token inválido ou não fornecido')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json()
    const { order_status, customer_email, order_id } = body

    console.log(`📩 Webhook recebido - Order: ${order_id}, Status: ${order_status}, Email: ${customer_email}`)

    // Verifica se o pagamento foi aprovado
    if (order_status === 'approved') {
      console.log(`✅ Pagamento aprovado para ${customer_email} - Atualizando status premium...`)

      // Busca o usuário pelo email
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, is_premium')
        .eq('email', customer_email)
        .single()

      if (userError || !user) {
        console.error(`❌ Usuário não encontrado com email: ${customer_email}`)
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Verifica se já é premium
      if (user.is_premium) {
        console.log(`⚠️ Usuário ${customer_email} já é premium`)
        return new Response(JSON.stringify({ message: 'User already premium' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Atualiza status para premium
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          is_premium: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', customer_email)

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      console.log(`🎉 Usuário ${customer_email} atualizado para PREMIUM com sucesso!`)
      return new Response(JSON.stringify({ message: 'User upgraded to premium' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Outros status (pending, canceled, etc.)
    console.log(`ℹ️ Status do pedido: ${order_status} - Nenhuma ação necessária`)
    return new Response(JSON.stringify({ message: 'Webhook received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
