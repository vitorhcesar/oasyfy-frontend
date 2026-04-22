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
    const { test_email } = await req.json()
    if (!test_email) {
      return new Response(JSON.stringify({ error: 'test_email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: smtp, error: smtpErr } = await supabase
      .from('smtp_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (smtpErr || !smtp) {
      return new Response(JSON.stringify({ error: 'Configuração SMTP não encontrada. Salve as credenciais primeiro.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use denomailer for SMTP
    const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')

    const useTLS = smtp.port === 465
    
    const client = new SMTPClient({
      connection: {
        hostname: smtp.host,
        port: smtp.port,
        tls: useTLS,
        auth: {
          username: smtp.username || smtp.from_email,
          password: smtp.password,
        },
      },
    })

    await client.send({
      from: smtp.from_email,
      to: test_email,
      subject: 'Teste de conexão SMTP - Oasyfy',
      content: 'Este é um e-mail de teste enviado pela plataforma Oasyfy.',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 40px 16px;">
            <tr><td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 460px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                <!-- Header gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 36px 32px 28px; text-align: center;">
                    <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.2); margin: 0 auto 16px; line-height: 52px; font-size: 24px;">✉️</div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">Teste de conexão SMTP</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 36px 32px 24px; text-align: center;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; margin: 0 auto 20px; line-height: 64px; font-size: 28px;">✅</div>
                    <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 12px;">Configuração válida!</h2>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                      Este é um e-mail de teste enviado pela plataforma <strong style="color: #0f172a;">Oasyfy</strong> para validar sua configuração SMTP.
                    </p>
                  </td>
                </tr>
                <!-- Info box -->
                <tr>
                  <td style="padding: 0 32px 32px;">
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; text-align: center;">
                      <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0;">🎉 Se você recebeu este e-mail, tudo está funcionando!</p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8faf9; padding: 20px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 500;">Oasyfy · Plataforma de pagamentos</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true, message: 'E-mail de teste enviado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('SMTP test error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro ao enviar e-mail de teste' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
