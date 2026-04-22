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
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Check if user exists
    const { data: userData } = await supabase.auth.admin.listUsers()
    const userExists = userData?.users?.some((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    
    // Always return success to prevent email enumeration
    if (!userExists) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: max 3 codes per email in 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('recovery_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('created_at', tenMinAgo)

    if (count && count >= 3) {
      return new Response(JSON.stringify({ error: 'Muitas tentativas. Aguarde alguns minutos.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Invalidate old codes
    await supabase
      .from('recovery_codes')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('used', false)

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    await supabase.from('recovery_codes').insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt,
    })

    // Get SMTP settings
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

    // Send email via SMTP
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
      to: email,
      subject: 'Código de recuperação - Oasyfy',
      content: `Seu código de recuperação é: ${code}. Válido por 10 minutos.`,
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
                    <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.2); margin: 0 auto 16px; line-height: 52px; font-size: 24px;">🔐</div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">Recuperação de senha</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0; font-weight: 400;">Insira o código abaixo para redefinir sua senha</p>
                  </td>
                </tr>
                <!-- Code section -->
                <tr>
                  <td style="padding: 36px 32px 20px; text-align: center;">
                    <p style="color: #64748b; font-size: 13px; margin: 0 0 20px; line-height: 1.5;">Seu código de verificação:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        ${code.split('').map((d: string) => `<td style="padding: 0 4px;"><div style="width: 44px; height: 56px; background: #f8faf9; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 26px; font-weight: 800; color: #0f172a; line-height: 56px; text-align: center; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;">${d}</div></td>`).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Timer -->
                <tr>
                  <td style="padding: 0 32px 32px; text-align: center;">
                    <div style="display: inline-block; background: #fef3c7; border-radius: 20px; padding: 8px 16px; margin-top: 8px;">
                      <span style="color: #92400e; font-size: 12px; font-weight: 600;">⏱ Expira em 10 minutos</span>
                    </div>
                  </td>
                </tr>
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 32px;">
                    <div style="height: 1px; background: #f1f5f9;"></div>
                  </td>
                </tr>
                <!-- Security note -->
                <tr>
                  <td style="padding: 24px 32px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                      Se você não solicitou esta recuperação, ignore este e-mail.<br/>Sua conta permanece segura.
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
    console.error('send-recovery-code error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
