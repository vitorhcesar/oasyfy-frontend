import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const serviceClient = createClient(supabaseUrl, serviceKey)
    const token = authHeader.replace('Bearer ', '')

    const { data: authData, error: authError } = await authClient.auth.getUser(token)
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: isAdmin, error: roleError } = await serviceClient.rpc('has_role', {
      _user_id: authData.user.id,
      _role: 'admin',
    })

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { user_id, seller_email, seller_name } = await req.json()
    if (!user_id || !seller_email) {
      return new Response(JSON.stringify({ error: 'user_id e seller_email são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: targetUser, error: userError } = await serviceClient.auth.admin.getUserById(user_id)
    if (userError || !targetUser.user) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user_id, {
      email_confirm: true,
      user_metadata: {
        ...targetUser.user.user_metadata,
        email_verified_custom: true,
      },
    })

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({ email_manually_approved: true })
      .eq('user_id', user_id)

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await serviceClient.functions.invoke('send-approval-email', {
      body: { seller_email, seller_name },
    })

    // Trigger WhatsApp welcome (fire-and-forget)
    try {
      const { data: kyc } = await serviceClient
        .from('kyc_submissions')
        .select('phone, full_name')
        .eq('user_id', user_id)
        .maybeSingle()

      if (kyc?.phone) {
        await serviceClient.functions.invoke('send-whatsapp-welcome', {
          body: { phone: kyc.phone, name: kyc.full_name || seller_name || 'Seller' },
        })
      }
    } catch (e) {
      console.error('WhatsApp welcome error (non-blocking):', e)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})