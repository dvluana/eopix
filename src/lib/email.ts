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
    subject: `Seu codigo de acesso: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>E O PIX?</h2>
        <p>Seu codigo de acesso e:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
          Este codigo expira em 10 minutos.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Se voce nao solicitou este codigo, ignore este email.
        </p>
      </div>
    `,
  })
}
