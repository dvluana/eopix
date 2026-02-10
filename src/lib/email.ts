import { isBypassMode } from './mock-mode'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export interface SendEmailResponse {
  id: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  // Bypass mode: não envia email real (MOCK_MODE ou TEST_MODE)
  if (isBypassMode) {
    console.log(`📧 [BYPASS] Para: ${params.to} | Assunto: ${params.subject}`)
    console.log(`   Conteudo: ${params.html.substring(0, 100)}...`)
    return { id: `bypass_${Date.now()}` }
  }

  // === CHAMADA REAL (Brevo API) ===
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY || '',
    },
    body: JSON.stringify({
      sender: {
        name: 'E O PIX',
        email: process.env.EMAIL_FROM_ADDRESS || 'plataforma@somoseopix.com.br',
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Unable to read error body')
    const error = new Error(`Brevo error: ${res.status} - ${errorBody}`)
    console.error('📧 Brevo failed:', { status: res.status, to: params.to, subject: params.subject, error: errorBody })
    throw error
  }

  const data = await res.json()
  // Brevo retorna { messageId: "..." }, convertemos para { id: "..." }
  return { id: data.messageId }
}

export async function sendMagicCode(email: string, code: string): Promise<SendEmailResponse> {
  return sendEmail({
    to: email,
    subject: `Seu código de acesso: ${code}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Zilla+Slab:wght@500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #F0EFEB;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F0EFEB;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #1A1A1A; padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; font-family: 'Zilla Slab', Georgia, serif; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                      E o Pix<span style="color: #FFD600;">?</span>
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 16px; line-height: 1.6; color: #1A1A1A;">
                      Olá! Aqui está seu código de acesso:
                    </p>

                    <!-- Code Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background-color: #FFD600; padding: 24px; text-align: center; border-radius: 8px;">
                          <span style="font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #1A1A1A;">
                            ${code}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 14px; line-height: 1.6; color: #666666;">
                      Este código expira em <strong style="color: #1A1A1A;">10 minutos</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <hr style="border: none; border-top: 1px solid #E8E7E3; margin: 0;">
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 32px 40px;">
                    <p style="margin: 0 0 8px 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: #666666;">
                      🔒 Dica de segurança: nunca compartilhe este código com ninguém.
                    </p>
                    <p style="margin: 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: #666666;">
                      Se você não solicitou este código, ignore este email.
                    </p>
                  </td>
                </tr>

              </table>

              <!-- Bottom Brand -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 24px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 11px; color: #666666;">
                      © ${new Date().getFullYear()} E o Pix? — Todos os direitos reservados.
                    </p>
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
}
