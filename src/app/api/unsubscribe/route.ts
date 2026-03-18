import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'
import { prisma } from '@/lib/prisma'

function htmlPage(title: string, heading: string, message: string, isError = false): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — EOPIX</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Zilla+Slab:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F0EFEB;font-family:'IBM Plex Mono','Courier New',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:480px;width:100%;margin:40px 20px;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">
    <div style="background-color:#1A1A1A;padding:24px 32px;">
      <span style="font-family:'Zilla Slab',Georgia,serif;font-size:20px;font-weight:700;color:#FFFFFF;">E o Pix<span style="color:#FFD600;">?</span></span>
    </div>
    <div style="height:3px;background-color:#FFD600;"></div>
    <div style="padding:40px 32px;">
      <h1 style="margin:0 0 16px;font-family:'Zilla Slab',Georgia,serif;font-size:26px;font-weight:700;color:#1A1A1A;line-height:1.2;">${heading}</h1>
      <p style="margin:0 0 32px;font-size:14px;line-height:1.7;color:#666666;">${message}</p>
      <a href="/" style="display:inline-block;background-color:${isError ? '#F0EFEB' : '#FFD600'};color:#1A1A1A;text-decoration:none;padding:12px 24px;border:2px solid #1A1A1A;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
        Voltar ao início
      </a>
    </div>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    status: isError ? 400 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return htmlPage(
      'Link inválido',
      'Link inválido.',
      'Este link de cancelamento está incompleto. Se o problema persistir, entre em contato.',
      true
    )
  }

  const isValid = await verifyUnsubscribeToken(email, token)
  if (!isValid) {
    return htmlPage(
      'Link inválido',
      'Link inválido.',
      'Este link de cancelamento não é válido. Se o problema persistir, entre em contato.',
      true
    )
  }

  await prisma.user.updateMany({
    where: { email: email.toLowerCase() },
    data: { emailOptOut: true },
  })

  return htmlPage(
    'Descadastrado',
    'Pronto. Sem mais lembretes.',
    'Você não vai mais receber emails de lembrete do EOPIX. Emails relacionados a compras e relatórios continuam sendo enviados normalmente.'
  )
}
