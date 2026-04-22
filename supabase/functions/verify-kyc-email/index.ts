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
    const { email, code } = await req.json()

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email e código são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

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

    // Mark as used
    await supabase
      .from('recovery_codes')
      .update({ used: true })
      .eq('id', codeRow.id)

    // Trigger WhatsApp welcome (fire-and-forget)
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', codeRow.email)
        .maybeSingle()

      // Try to get phone from kyc_submissions
      const { data: kyc } = await supabase
        .from('kyc_submissions')
        .select('phone, full_name')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (kyc?.phone) {
        await supabase.functions.invoke('send-whatsapp-welcome', {
          body: { phone: kyc.phone, name: kyc.full_name || user?.full_name || 'Seller' },
        })
      }
    } catch (e) {
      console.error('WhatsApp welcome error (non-blocking):', e)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('verify-kyc-email error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
