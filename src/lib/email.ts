import { Resend } from 'resend'
import { isBypassMode } from './mock-mode'
import { buildUnsubscribeUrl } from './unsubscribe'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'EOPIX <noreply@somoseopix.com.br>'
const YEAR = new Date().getFullYear()

// ─── Shared layout helpers ────────────────────────────────────────────────────

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EOPIX</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Zilla+Slab:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F0EFEB;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0EFEB;">
    <tr>
      <td style="padding:48px 20px;">

        ${content}

        <!-- Bottom brand -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:20px auto 0;">
          <tr>
            <td style="text-align:center;padding:0 0 8px;">
              <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;color:#888888;line-height:1.6;">
                © ${YEAR} EOPIX — Todos os direitos reservados.<br>
                <span style="color:#BBBBBB;">somoseopix.com.br · noreply@somoseopix.com.br</span>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

function emailHeader(badge: string, badgeBg: string, badgeColor: string): string {
  return `<tr>
    <td style="background-color:#1A1A1A;padding:0;">
      <!-- Diagonal stripe pattern -->
      <div style="padding:28px 40px 24px;background-image:repeating-linear-gradient(45deg,transparent,transparent 7px,rgba(255,214,0,0.05) 7px,rgba(255,214,0,0.05) 8px);">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td>
              <span style="font-family:'Zilla Slab',Georgia,serif;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">
                E o Pix<span style="color:#FFD600;">?</span>
              </span>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <span style="display:inline-block;background-color:${badgeBg};color:${badgeColor};font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;border-radius:2px;">
                ${badge}
              </span>
            </td>
          </tr>
        </table>
      </div>
      <!-- Yellow accent strip -->
      <div style="height:3px;background-color:#FFD600;"></div>
    </td>
  </tr>`
}

function emailDivider(): string {
  return `<tr>
    <td style="padding:0 40px;">
      <div style="height:1px;background-color:#E8E7E3;"></div>
    </td>
  </tr>`
}

function emailFooter(lines: string[]): string {
  return `<tr>
    <td style="padding:20px 40px 32px;">
      ${lines.map(l => `<p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;line-height:1.5;color:#888888;">${l}</p>`).join('')}
    </td>
  </tr>`
}

function codeBox(code: string, bg = '#F0EFEB', color = '#666666'): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="background-color:${bg};padding:12px 16px;text-align:center;border-radius:4px;border:1px solid #E8E7E3;">
        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;font-weight:400;letter-spacing:4px;color:${color};">
          ${code}
        </span>
      </td>
    </tr>
  </table>`
}

function ctaButton(href: string, label: string, bg = '#FFD600', color = '#1A1A1A'): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
    <tr>
      <td>
        <!-- Brutalist offset shadow layer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:#1A1A1A;border-radius:6px;padding:3px 3px 0 0;">
              <a href="${href}" style="display:inline-block;background-color:${bg};color:${color};text-decoration:none;padding:14px 32px;border:2px solid #1A1A1A;border-radius:4px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                ${label}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

// ─── Core send function ───────────────────────────────────────────────────────

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  idempotencyKey?: string
  headers?: Record<string, string>
}

export interface SendEmailResponse {
  id: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  if (isBypassMode) {
    console.log(`📧 [BYPASS] Para: ${params.to} | Assunto: ${params.subject}`)
    return { id: `bypass_${Date.now()}` }
  }

  const sendOptions = params.idempotencyKey
    ? { idempotencyKey: params.idempotencyKey }
    : undefined

  const { data, error } = await resend.emails.send(
    {
      from: FROM,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      ...(params.headers ? { headers: params.headers } : {}),
    },
    sendOptions
  )

  if (error) {
    console.error('📧 Resend failed:', { to: params.to, subject: params.subject, error })
    throw new Error(`Resend error: ${error.message}`)
  }

  return { id: data!.id }
}

// ─── 1. Boas-vindas / Cadastro ────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string,
  userId: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('BEM-VINDO', '#FFD600', '#1A1A1A')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Olá, ${firstName}.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:15px;line-height:1.7;color:#666666;">
            Sua conta foi criada com sucesso. Agora você pode consultar CPF e CNPJ e receber relatórios completos de risco fiscal e legal.
          </p>

          <!-- Feature list -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background-color:#F0EFEB;border-radius:6px;border:1px solid #E8E7E3;margin-bottom:32px;">
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 14px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">O que você recebe</p>
                ${[
                  ['Cadastral completo', 'Nome, endereço, vínculos societários'],
                  ['Histórico financeiro', 'Score, pendências, Serasa Premium'],
                  ['Processos judiciais', 'Ações ativas, histórico completo'],
                  ['Menções públicas', 'Reclame Aqui, notícias, governo'],
                  ['Análise de risco com IA', 'Veredicto claro: sol, chuva ou trovoada'],
                ].map(([title, desc]) => `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:10px;">
                    <tr>
                      <td style="width:20px;vertical-align:top;padding-top:2px;">
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;color:#FFD600;font-weight:700;">→</span>
                      </td>
                      <td>
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;font-weight:700;color:#1A1A1A;">${title}</span>
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;color:#666666;"> — ${desc}</span>
                      </td>
                    </tr>
                  </table>
                `).join('')}
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'}/consulta`, 'FAZER MINHA PRIMEIRA CONSULTA')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        '🔒 Seus dados estão seguros e tratados conforme a LGPD.',
        'Dúvidas? Responda este email.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: `Bem-vindo ao EOPIX, ${firstName}!`,
    html,
    idempotencyKey: `welcome-email/${userId}`,
  })
}

// ─── 2. Compra recebida (processando) ────────────────────────────────────────

export async function sendPurchaseReceivedEmail(
  email: string,
  name: string,
  code: string,
  document: string,
  purchaseId: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'

  const steps = [
    'Verificando dados cadastrais',
    'Consultando histórico financeiro',
    'Analisando processos judiciais',
    'Coletando menções públicas',
    'Processando análise com IA',
    'Gerando relatório final',
  ]

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('PROCESSANDO', '#1A1A1A', '#FFD600')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Pedido recebido.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. Seu pagamento foi confirmado e já iniciamos o processamento do relatório para <strong style="color:#1A1A1A;">${document}</strong>.
          </p>

          <!-- Code box -->
          <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Código do pedido</p>
          ${codeBox(code)}

          <!-- Processing steps -->
          <p style="margin:28px 0 12px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Etapas de processamento</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background-color:#F0EFEB;border-radius:6px;border:1px solid #E8E7E3;">
            <tr>
              <td style="padding:20px 24px;">
                ${steps.map((step, i) => `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:${i < steps.length - 1 ? '12px' : '0'};">
                    <tr>
                      <td style="width:28px;vertical-align:middle;">
                        <span style="display:inline-block;width:20px;height:20px;background-color:#1A1A1A;border-radius:2px;text-align:center;line-height:20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;color:#FFD600;">
                          ${String(i + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td style="vertical-align:middle;">
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;color:#1A1A1A;">${step}</span>
                      </td>
                      <td style="text-align:right;vertical-align:middle;">
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;color:#BBBBBB;">· · ·</span>
                      </td>
                    </tr>
                  </table>
                `).join('')}
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 16px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;line-height:1.7;color:#666666;text-align:center;">
            Você receberá um email quando o relatório estiver pronto.<br>
            <strong style="color:#1A1A1A;">Isso leva em torno de 1 a 3 minutos.</strong>
          </p>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;padding-top:12px;">
                ${ctaButton(`${appUrl}/minhas-consultas`, 'ACOMPANHAR EM MINHAS CONSULTAS')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        '📋 Guarde o código do pedido para acompanhamento.',
        'Se o relatório não chegar em 10 minutos, entre em contato.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: `Pedido ${code} recebido — processando seu relatório`,
    html,
    idempotencyKey: `purchase-received/${purchaseId}`,
  })
}

// ─── 3. Compra aprovada (relatório pronto) ────────────────────────────────────

export async function sendPurchaseApprovedEmail(
  email: string,
  name: string,
  code: string,
  reportUrl: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('RELATÓRIO PRONTO', '#66CC66', '#FFFFFF')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Seu relatório está pronto.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. O relatório de risco foi gerado com sucesso e está disponível para visualização.
          </p>

          <!-- Code box (green accent) -->
          <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Código do pedido</p>
          ${codeBox(code)}

          <!-- TTL warning -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="margin:20px 0 32px;background-color:#FFFDE6;border-left:3px solid #FFD600;border-radius:0 4px 4px 0;">
            <tr>
              <td style="padding:14px 16px;">
                <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;line-height:1.5;color:#1A1A1A;">
                  ⏱ <strong>Este relatório fica disponível por 7 dias.</strong><br>
                  <span style="color:#666666;">Após esse prazo, uma nova consulta será necessária.</span>
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'}/minhas-consultas`, 'VER RELATÓRIO EM MINHAS CONSULTAS')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        '🔒 Dados tratados conforme LGPD. Acesso restrito à sua conta.',
        '💡 Verifique a pasta de spam se não encontrar emails futuros.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: `Relatório pronto — pedido ${code}`,
    html,
    ...(purchaseId ? { idempotencyKey: `purchase-approved/${purchaseId}` } : {}),
  })
}

// ─── 4. Compra negada / falhou ────────────────────────────────────────────────

export async function sendPurchaseDeniedEmail(
  email: string,
  name: string,
  code: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('PROBLEMA NO PEDIDO', '#CC3333', '#FFFFFF')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Não conseguimos completar sua consulta.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. Algo deu errado no processamento do pedido <strong style="color:#1A1A1A;">${code}</strong>. Isso não foi um problema seu — tentamos novamente e não conseguimos.
          </p>

          <!-- Code box (red accent) -->
          <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Código do pedido</p>
          ${codeBox(code)}

          <!-- What to do -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="margin:24px 0 32px;background-color:#F0EFEB;border-radius:6px;border:1px solid #E8E7E3;">
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 14px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">O que fazer agora</p>
                ${[
                  'Acesse <strong>Minhas Consultas</strong> para tentar reprocessar automaticamente',
                  'Em caso de débito, o reembolso integral será realizado em até 5 dias úteis',
                  'Se o problema persistir, entre em contato respondendo este email',
                ].map((item, i) => `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:${i < 2 ? '10px' : '0'};">
                    <tr>
                      <td style="width:20px;vertical-align:top;padding-top:1px;">
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;color:#CC3333;font-weight:700;">${i + 1}.</span>
                      </td>
                      <td>
                        <span style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;color:#1A1A1A;line-height:1.5;">${item}</span>
                      </td>
                    </tr>
                  </table>
                `).join('')}
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${appUrl}/minhas-consultas`, 'ACESSAR MINHAS CONSULTAS', '#FFD600', '#1A1A1A')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        'Pedimos desculpas pelo inconveniente.',
        'Se o problema persistir após tentar de novo, responda este email.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: `Problema no pedido ${code} — ação necessária`,
    html,
    ...(purchaseId ? { idempotencyKey: `purchase-denied/${purchaseId}` } : {}),
  })
}

// ─── 5. Reembolso processado ──────────────────────────────────────────────────

export async function sendPurchaseRefundedEmail(
  email: string,
  name: string,
  code: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('REEMBOLSO PROCESSADO', '#66CC66', '#FFFFFF')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Seu dinheiro voltou.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. O reembolso referente ao pedido abaixo foi processado. O valor será estornado em até <strong style="color:#1A1A1A;">5 dias úteis</strong>, conforme sua operadora.
          </p>

          <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Código do pedido</p>
          ${codeBox(code)}

          <p style="margin:24px 0 0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;line-height:1.7;color:#666666;">
            Se tiver alguma dúvida, responda este email.
          </p>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter(['Pedimos desculpas pelo inconveniente.'])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: `Reembolso confirmado — pedido ${code}`,
    html,
    ...(purchaseId ? { idempotencyKey: `purchase-refunded/${purchaseId}` } : {}),
  })
}

// ─── 6. Pedido expirado (PAYMENT_EXPIRED) ────────────────────────────────────

export async function sendPurchaseExpiredEmail(
  email: string,
  name: string,
  code: string,
  term: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const formattedTerm = term.length === 11
    ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('PEDIDO EXPIRADO', '#888888', '#FFFFFF')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Seu pedido saiu de campo.
          </h2>
          <p style="margin:0 0 16px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. O pedido <strong style="color:#1A1A1A;">${code}</strong> expirou antes de ser pago — ficamos aguardando, mas o Pix não chegou.
          </p>
          <p style="margin:0 0 32px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Acontece. A consulta para <strong style="color:#1A1A1A;">${formattedTerm}</strong> continua disponível a qualquer momento.
          </p>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${appUrl}/consulta/${term}`, 'CONSULTAR AGORA', '#FFD600', '#1A1A1A')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        'Nenhuma cobrança foi realizada.',
        'Dúvidas? Responda este email.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Seu pedido expirou.',
    html,
    ...(purchaseId ? { idempotencyKey: `purchase-expired/${purchaseId}` } : {}),
  })
}

// ─── 7. Abandono R1 — 30 minutos ─────────────────────────────────────────────

export async function sendAbandonmentEmail1(
  email: string,
  name: string,
  term: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const formattedTerm = term.length === 11
    ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  const unsubUrl = await buildUnsubscribeUrl(email)

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('CONSULTA PENDENTE', '#1A1A1A', '#FFD600')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Você quase se protegeu.
          </h2>
          <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. Você foi lá, iniciou uma consulta para <strong style="color:#1A1A1A;">${formattedTerm}</strong> e parou no pagamento.
          </p>
          <p style="margin:0 0 32px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            O documento ainda pode ser verificado agora, por R$&nbsp;39,90.
          </p>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${appUrl}/consulta/${term}`, 'COMPLETAR CONSULTA — R$ 39,90')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        'Você recebeu este email porque iniciou uma consulta no EOPIX.',
        `Para não receber mais lembretes: <a href="${unsubUrl}" style="color:#888888;">cancelar emails</a>`,
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Você quase se protegeu.',
    html,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    ...(purchaseId ? { idempotencyKey: `abandonment-r1/${purchaseId}` } : {}),
  })
}

// ─── 8. Abandono R2 — 24 horas ────────────────────────────────────────────────

export async function sendAbandonmentEmail2(
  email: string,
  name: string,
  term: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const formattedTerm = term.length === 11
    ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  const unsubUrl = await buildUnsubscribeUrl(email)

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('AINDA DÁ TEMPO', '#FFD600', '#1A1A1A')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            A consulta que você não fez.
          </h2>
          <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. Todo dia alguém fecha um contrato sem checar quem está do outro lado. Você já sabe que <strong style="color:#1A1A1A;">${formattedTerm}</strong> precisava ser verificado.
          </p>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background-color:#F0EFEB;border-radius:6px;border:1px solid #E8E7E3;margin-bottom:32px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Você vai descobrir</p>
                ${(term.length === 11
                  ? ['Processos trabalhistas ativos', 'Dívidas e negativações Serasa', 'Ações cíveis em andamento', 'Reclamações e menções públicas']
                  : ['Processos fiscais e trabalhistas', 'Sócios com pendências judiciais', 'Situação cadastral na Receita Federal', 'Reclamações no Reclame Aqui']
                ).map(item => `
                  <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;color:#1A1A1A;">→ ${item}</p>
                `).join('')}
              </td>
            </tr>
          </table>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${appUrl}/consulta/${term}`, 'VERIFICAR AGORA — R$ 39,90')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        'Você recebeu este email porque iniciou uma consulta no EOPIX.',
        `Para não receber mais lembretes: <a href="${unsubUrl}" style="color:#888888;">cancelar emails</a>`,
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Enquanto você esperava...',
    html,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    ...(purchaseId ? { idempotencyKey: `abandonment-r2/${purchaseId}` } : {}),
  })
}

// ─── 9. Abandono R3 — 72 horas ────────────────────────────────────────────────

export async function sendAbandonmentEmail3(
  email: string,
  name: string,
  term: string,
  purchaseId = ''
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const unsubUrl = await buildUnsubscribeUrl(email)

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('ÚLTIMO AVISO', '#FFD600', '#1A1A1A')}

      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">Antes ou depois?</h2>
          <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. Calote acontece. Processo acontece. A pergunta não é "se vai acontecer". É "com quem".
          </p>
          <p style="margin:0 0 32px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#1A1A1A;">
            R$&nbsp;39,90 é quanto custa saber.<br>
            <span style="color:#888888;">Processo trabalhista custa quanto mesmo?</span>
          </p>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${appUrl}/consulta/${term}`, 'CONSULTAR AGORA — R$ 39,90')}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        'Você recebeu este email porque iniciou uma consulta no EOPIX. Este é o último lembrete.',
        `Para não receber mais lembretes: <a href="${unsubUrl}" style="color:#888888;">cancelar emails</a>`,
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Antes ou depois?',
    html,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    ...(purchaseId ? { idempotencyKey: `abandonment-r3/${purchaseId}` } : {}),
  })
}

// ─── 10. Redefinição de senha — link ─────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const resetUrl = `${appUrl}/redefinir-senha?token=${token}`

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('REDEFINIR SENHA', '#1A1A1A', '#FFD600')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Redefinir senha, ${firstName}.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
          </p>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;padding-bottom:32px;">
                ${ctaButton(resetUrl, 'REDEFINIR MINHA SENHA')}
              </td>
            </tr>
          </table>

          <!-- Info box -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background-color:#F0EFEB;border-radius:6px;border:1px solid #E8E7E3;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Importante</p>
                <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;line-height:1.6;color:#666666;">
                  → Link válido por <strong style="color:#1A1A1A;">1 hora</strong> a partir do envio deste email.
                </p>
                <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;line-height:1.6;color:#666666;">
                  → Se você não solicitou a redefinição, ignore este email. Sua senha permanece a mesma.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        '🔒 Este link é de uso único e expira em 1 hora.',
        'Nunca compartilhe este email com ninguém.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Redefinir sua senha — EOPIX',
    html,
    idempotencyKey: `password-reset/${token}`,
  })
}

// ─── 11. Confirmação de senha alterada ───────────────────────────────────────

export async function sendPasswordChangedEmail(
  email: string,
  name: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const now = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">

      ${emailHeader('SENHA ALTERADA', '#CC3333', '#FFFFFF')}

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
            Sua senha foi alterada.
          </h2>
          <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
            Olá, ${firstName}. Sua senha foi redefinida com sucesso em <strong style="color:#1A1A1A;">${now}</strong> (horário de Brasília).
          </p>

          <!-- Security box -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
            style="background-color:#FFF5F5;border-radius:6px;border:1px solid #FFCCCC;margin-bottom:32px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#CC3333;">⚠ Não foi você?</p>
                <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;line-height:1.6;color:#666666;">
                  Se você não realizou esta alteração, entre em contato imediatamente respondendo este email. Sua conta pode estar comprometida.
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align:center;">
                ${ctaButton(`${appUrl}/minhas-consultas`, 'ACESSAR MINHA CONTA')}
              </td>
            </tr>
          </table>

        </td>
      </tr>

      ${emailDivider()}
      ${emailFooter([
        '🔒 Dados tratados conforme LGPD. Acesso restrito à sua conta.',
        'Dúvidas? Responda este email.',
      ])}

    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Sua senha foi alterada — EOPIX',
    html,
  })
}
