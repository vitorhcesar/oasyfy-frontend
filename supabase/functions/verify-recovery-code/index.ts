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
    const { email, code, new_password } = await req.json()
    
    if (!email || !code || !new_password) {
      return new Response(JSON.stringify({ error: 'Email, código e nova senha são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (new_password.length < 8) {
      return new Response(JSON.stringify({ error: 'A senha deve ter no mínimo 8 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Find valid code
    const { data: codeRow, error: codeErr } = await supabase
      .from('recovery_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (codeErr || !codeRow) {
      return new Response(JSON.stringify({ error: 'Código inválido ou expirado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark code as used
    await supabase
      .from('recovery_codes')
      .update({ used: true })
      .eq('id', codeRow.id)

    // Find user by email
    const { data: userData } = await supabase.auth.admin.listUsers()
    const user = userData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update password
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: new_password,
    })

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cleanup old codes for this email
    await supabase
      .from('recovery_codes')
      .delete()
      .eq('email', email.toLowerCase())

    return new Response(JSON.stringify({ success: true, message: 'Senha atualizada com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('verify-recovery-code error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
