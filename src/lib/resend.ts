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

  // === CHAMADA REAL (Parte B) ===
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    throw new Error(`Resend error: ${res.status}`)
  }

  return res.json()
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

export async function sendReportReady(
  email: string,
  maskedTerm: string,
  reportUrl: string
): Promise<SendEmailResponse> {
  return sendEmail({
    to: email,
    subject: `Sua consulta sobre ${maskedTerm} esta pronta`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>E O PIX?</h2>
        <p>Sua consulta sobre <strong>${maskedTerm}</strong> foi finalizada.</p>
        <a href="${reportUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Ver Relatorio
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          Voce tambem pode acessar em <a href="${process.env.NEXT_PUBLIC_APP_URL}/minhas-consultas">Minhas Consultas</a>.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Se este email foi para o spam, adicione plataforma@somoseopix.com.br aos seus contatos.
        </p>
      </div>
    `,
  })
}
