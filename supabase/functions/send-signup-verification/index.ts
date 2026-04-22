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
    const { email, code, action } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Action: verify code and mark user as verified
    if (action === 'verify') {
      if (!code || typeof code !== 'string' || code.length !== 6) {
        return new Response(JSON.stringify({ error: 'Código inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: codeRow } = await supabase
        .from('recovery_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle()

      if (!codeRow) {
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

      // Mark user as email verified in auth and custom metadata
      const { data: users } = await supabase.auth.admin.listUsers()
      const targetUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (targetUser) {
        await supabase.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
          user_metadata: { ...targetUser.user_metadata, email_verified_custom: true },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Action: send code
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
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('recovery_codes').insert({
      email: email.toLowerCase(),
      code: verifyCode,
      expires_at: expiresAt,
    })

    // Get SMTP settings
    const { data: smtp, error: smtpErr } = await supabase
      .from('smtp_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (smtpErr || !smtp) {
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
      subject: 'Confirme seu acesso à Oasyfy',
      content: `Oasyfy\n\nSeu código de confirmação é: ${verifyCode}\n\nUse esse código para concluir seu cadastro. Ele expira em 10 minutos.\n\nSe você não solicitou este acesso, ignore este e-mail.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background-color: #f4f8f5; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; color: #163127;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #eef8f1 0%, #f8fbf9 100%); padding: 32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
                  <tr>
                    <td style="padding: 0 0 14px; text-align: center;">
                      <div style="display: inline-flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #2aa866 0%, #1f8b53 100%); color: #ffffff; font-size: 18px; font-weight: 800; line-height: 38px; text-align: center; box-shadow: 0 10px 24px rgba(42,168,102,0.28);">O</div>
                        <span style="font-size: 24px; font-weight: 800; color: #163127; letter-spacing: -0.4px;">Oasyfy</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #ffffff; border: 1px solid #dbe9df; border-radius: 28px; overflow: hidden; box-shadow: 0 22px 50px rgba(22,49,39,0.08);">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 0;">
                            <div style="height: 6px; background: linear-gradient(90deg, #2aa866 0%, #52c989 50%, #b7f0ca 100%);"></div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 36px 34px 18px; text-align: center;">
                            <div style="display: inline-block; padding: 8px 14px; border-radius: 999px; background: #eef8f1; color: #1f8b53; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">Confirmação de cadastro</div>
                            <h1 style="margin: 18px 0 10px; font-size: 30px; line-height: 1.1; font-weight: 800; color: #163127; letter-spacing: -0.8px;">Confirme seu e-mail</h1>
                            <p style="margin: 0 auto; max-width: 360px; font-size: 14px; line-height: 1.7; color: #5d7468;">
                              Para liberar seu acesso à plataforma de pagamentos da Oasyfy, insira o código abaixo na tela de verificação.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 34px 18px; text-align: center;">
                            <p style="margin: 0 0 18px; font-size: 12px; font-weight: 600; color: #7b8f84; letter-spacing: 0.04em; text-transform: uppercase;">Seu código</p>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                              <tr>
                                ${verifyCode.split('').map((d: string) => `<td style="padding: 0 5px;"><div style="width: 48px; height: 60px; border-radius: 16px; background: #f8fcf9; border: 1px solid #dbe9df; color: #163127; font-size: 28px; font-weight: 800; line-height: 60px; text-align: center; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; box-shadow: inset 0 -3px 0 rgba(42,168,102,0.08);">${d}</div></td>`).join('')}
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 34px 30px; text-align: center;">
                            <div style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #fff6df; color: #9a6b00; font-size: 12px; font-weight: 700;">
                              ⏱ Código válido por 10 minutos
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 34px 26px;">
                            <div style="border-radius: 18px; background: #f8fcf9; border: 1px solid #e7f1ea; padding: 16px 18px; text-align: left;">
                              <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #5d7468;">
                                Se você não solicitou este cadastro, pode ignorar esta mensagem com segurança.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 20px 34px 26px; text-align: center; background: #fbfdfb; border-top: 1px solid #edf4ef;">
                            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #163127;">Oasyfy</p>
                            <p style="margin: 6px 0 0; font-size: 11px; color: #7b8f84;">Plataforma de pagamentos moderna, segura e instantânea.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
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
    console.error('send-signup-verification error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
