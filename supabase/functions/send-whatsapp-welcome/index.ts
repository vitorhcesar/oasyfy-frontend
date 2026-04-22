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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceKey)

    const { phone, name, test } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Número de telefone obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch CRM settings
    const { data: settings, error: settingsError } = await serviceClient
      .from('crm_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: 'CRM não configurado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!settings.is_active && !test) {
      return new Response(JSON.stringify({ error: 'CRM desativado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!settings.api_url || !settings.api_token) {
      return new Response(JSON.stringify({ error: 'API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build message
    const message = (settings.welcome_message || 'Bem-vindo(a)!')
      .replace(/\{name\}/g, name || 'Seller')

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')

    // Send via WhatsApp API (Evolution API / Z-API compatible)
    const apiUrl = settings.api_url.replace(/\/$/, '')
    const instanceName = settings.instance_name || 'default'

    // Try Evolution API format first
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.api_token,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('WhatsApp API error:', errorData)
      return new Response(JSON.stringify({ error: `Erro da API: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await response.json()

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
