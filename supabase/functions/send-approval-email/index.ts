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
    const { seller_email, seller_name } = await req.json()
    if (!seller_email) {
      return new Response(JSON.stringify({ error: 'seller_email é obrigatório' }), {
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
      console.error('SMTP not configured')
      return new Response(JSON.stringify({ error: 'Configuração de email não encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    const displayName = seller_name || 'Seller'

    await client.send({
      from: smtp.from_email,
      to: seller_email,
      subject: 'Sua conta foi aprovada! 🎉 - Oasyfy',
      content: `Olá ${displayName}, sua conta na Oasyfy foi aprovada! Você já pode começar a utilizar todos os recursos da plataforma.`,
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
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 32px 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 20px; line-height: 64px; font-size: 32px;">🎉</div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">Conta aprovada!</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 10px 0 0; font-weight: 400;">Sua verificação foi concluída com sucesso</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 36px 32px 16px; text-align: center;">
                    <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 16px;">Olá, ${displayName}!</h2>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 0;">
                      Temos uma ótima notícia! Todos os seus documentos foram verificados e sua conta na <strong style="color: #0f172a;">Oasyfy</strong> foi aprovada.
                    </p>
                  </td>
                </tr>
                <!-- Features -->
                <tr>
                  <td style="padding: 20px 32px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8faf9; border-radius: 14px; overflow: hidden;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                                      <span style="font-size: 14px;">✅</span>
                                    </td>
                                    <td style="padding-left: 8px;">
                                      <p style="color: #334155; font-size: 13px; margin: 0; font-weight: 600;">Receber pagamentos</p>
                                      <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0;">PIX, boleto e cartão de crédito</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                                      <span style="font-size: 14px;">✅</span>
                                    </td>
                                    <td style="padding-left: 8px;">
                                      <p style="color: #334155; font-size: 13px; margin: 0; font-weight: 600;">Realizar saques</p>
                                      <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0;">Transfira seu saldo quando quiser</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                                      <span style="font-size: 14px;">✅</span>
                                    </td>
                                    <td style="padding-left: 8px;">
                                      <p style="color: #334155; font-size: 13px; margin: 0; font-weight: 600;">Acessar o painel completo</p>
                                      <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0;">Dashboard, relatórios e API</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 32px;">
                    <div style="height: 1px; background: #f1f5f9;"></div>
                  </td>
                </tr>
                <!-- Footer note -->
                <tr>
                  <td style="padding: 24px 32px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                      Se precisar de ajuda, entre em contato com nosso suporte.
                    </p>
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-approval-email error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
