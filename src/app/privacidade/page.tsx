"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '12px',
    fontSize: '13px',
  },
  th: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '1px solid var(--color-border-subtle)',
    background: 'var(--color-bg-secondary)',
  },
  td: {
    fontFamily: 'var(--font-family-body)',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--color-border-subtle)',
    verticalAlign: 'top' as const,
  },
};

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(26, 26, 26, 0.97)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '32px',
          paddingRight: '32px',
          zIndex: 1000,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <LogoFundoPreto />
        </Link>
      </nav>

      <main
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          paddingTop: 'calc(64px + 40px)',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '48px',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Política de Privacidade
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 32px 0',
            }}
          >
            Última atualização: Fevereiro 2026
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: '0 0 32px 0' }} />

          {/* ============================================ */}
          {/* Quem Somos */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Quem Somos
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Esta Política de Privacidade se aplica ao serviço <strong style={{ color: 'var(--color-text-primary)' }}>E O PIX?</strong>, operado por <strong style={{ color: 'var(--color-text-primary)' }}>[RAZÃO SOCIAL COMPLETA]</strong>, inscrita no CNPJ sob o nº <strong style={{ color: 'var(--color-text-primary)' }}>[XX.XXX.XXX/XXXX-XX]</strong>, com sede na <strong style={{ color: 'var(--color-text-primary)' }}>[ENDEREÇO COMPLETO]</strong>, Florianópolis/SC.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Para fins da Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), atuamos como <strong style={{ color: 'var(--color-text-primary)' }}>Controlador de Dados</strong> tanto em relação aos dados dos compradores quanto aos dados de terceiros consultados.
            </p>
          </section>

          {/* ============================================ */}
          {/* Encarregado de Dados (DPO) */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Encarregado de Dados (DPO)
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              O canal de contato do Encarregado pelo Tratamento de Dados Pessoais é:
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Este canal atende solicitações de titulares de dados, dúvidas sobre tratamento de dados pessoais e comunicações da Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </section>

          {/* ============================================ */}
          {/* Dados que Coletamos */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Dados que Coletamos
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 16px 0',
              }}
            >
              Coletamos apenas os dados necessários para prestar o serviço. Existem duas categorias distintas:
            </p>

            {/* Dados do Comprador */}
            <h4
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: '0 0 8px 0',
              }}
            >
              Dados do Comprador (você, que usa o serviço)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Dado</th>
                    <th style={tableStyles.th}>Finalidade</th>
                    <th style={tableStyles.th}>Base Legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tableStyles.td}>E-mail</td>
                    <td style={tableStyles.td}>Autenticação, notificações, entrega do relatório</td>
                    <td style={tableStyles.td}>Execução contratual (Art. 7º, V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>CPF ou CNPJ consultado</td>
                    <td style={tableStyles.td}>Identificação do alvo da consulta</td>
                    <td style={tableStyles.td}>Execução contratual (Art. 7º, V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Nome do comprador</td>
                    <td style={tableStyles.td}>Identificação (coletado pelo Stripe)</td>
                    <td style={tableStyles.td}>Execução contratual (Art. 7º, V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Endereço IP</td>
                    <td style={tableStyles.td}>Rate limiting e proteção contra bots</td>
                    <td style={tableStyles.td}>Legítimo Interesse (Art. 7º, IX)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dados de Terceiros */}
            <h4
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: '24px 0 8px 0',
              }}
            >
              Dados de Terceiros (a pessoa ou empresa consultada)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Dado</th>
                    <th style={tableStyles.th}>Fonte</th>
                    <th style={tableStyles.th}>Base Legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tableStyles.td}>Dados cadastrais de CNPJ</td>
                    <td style={tableStyles.td}>Receita Federal via BrasilAPI</td>
                    <td style={tableStyles.td}>Legítimo Interesse (Art. 7º, IX) — dados manifestamente públicos</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Protestos, dívidas, situação cadastral</td>
                    <td style={tableStyles.td}>APIFull</td>
                    <td style={tableStyles.td}>Legítimo Interesse (Art. 7º, IX)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Processos judiciais</td>
                    <td style={tableStyles.td}>APIFull, Datajud/CNJ</td>
                    <td style={tableStyles.td}>Legítimo Interesse (Art. 7º, IX) — dados públicos de tribunais</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Menções na web e Reclame Aqui</td>
                    <td style={tableStyles.td}>Serper</td>
                    <td style={tableStyles.td}>Legítimo Interesse (Art. 7º, IX)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Resumo textual gerado por IA</td>
                    <td style={tableStyles.td}>OpenAI GPT-4o-mini</td>
                    <td style={tableStyles.td}>Legítimo Interesse (Art. 7º, IX)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '16px 0 0 0',
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Importante:</strong> Os dados de terceiros são obtidos exclusivamente de fontes públicas. Não coletamos dados diretamente dos titulares consultados. O tratamento é baseado no <strong style={{ color: 'var(--color-text-primary)' }}>Legítimo Interesse</strong> do controlador e dos usuários do serviço, que necessitam verificar a reputação comercial de parceiros antes de relações contratuais.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Um <strong style={{ color: 'var(--color-text-primary)' }}>Legitimate Interest Assessment (LIA)</strong> foi elaborado e está documentado internamente, demonstrando que o tratamento é necessário, proporcional e respeita os direitos e liberdades dos titulares.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Os terceiros consultados podem exercer seus direitos</strong> (exclusão, correção, oposição ao tratamento) através da página{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>
              , independentemente de terem sido clientes do serviço.
            </p>
          </section>

          {/* ============================================ */}
          {/* Fontes de Dados Públicos Consultadas */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Fontes de Dados Públicos Consultadas
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Para gerar o relatório, consultamos as seguintes fontes públicas:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
                paddingLeft: '20px',
              }}
            >
              <li><strong style={{ color: 'var(--color-text-primary)' }}>APIFull:</strong> protestos, dívidas, situação fiscal/cadastral e processos judiciais</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Datajud/CNJ:</strong> processos judiciais (complemento gratuito)</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>BrasilAPI:</strong> dados cadastrais de CNPJ (Receita Federal)</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Serper:</strong> menções na web e perfil no Reclame Aqui</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Nenhuma dessas fontes recebe o e-mail ou dados pessoais do comprador.
            </p>
          </section>

          {/* ============================================ */}
          {/* Uso de Inteligência Artificial */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Uso de Inteligência Artificial e Decisões Automatizadas
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              O serviço utiliza o modelo de linguagem <strong style={{ color: 'var(--color-text-primary)' }}>GPT-4o-mini (OpenAI)</strong> para duas finalidades:
            </p>
            <ol
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
                paddingLeft: '20px',
              }}
            >
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Geração de resumo factual:</strong> A IA lê os dados encontrados nas fontes públicas e gera um resumo textual de 2-3 frases, sem emitir juízo de valor, recomendações ou avaliações de risco.</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Filtragem de homônimos:</strong> A IA utiliza a região do CPF/CNPJ consultado para descartar menções e notícias que provavelmente se referem a outras pessoas com nome semelhante.</li>
            </ol>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Não há tomada de decisão automatizada com efeitos legais</strong> para o titular dos dados consultados. Os ícones de clima (☀️/🌧️) são baseados em contagem numérica simples (0 ocorrências = Sol, 1+ = Chuva), não em avaliação da IA.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              O titular pode contestar os resultados da filtragem por IA através da página{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>
              .
            </p>
          </section>

          {/* ============================================ */}
          {/* Transferência Internacional de Dados */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Transferência Internacional de Dados
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Para a geração do resumo por inteligência artificial, dados são enviados aos servidores da <strong style={{ color: 'var(--color-text-primary)' }}>OpenAI</strong>, localizados nos <strong style={{ color: 'var(--color-text-primary)' }}>Estados Unidos</strong>. Os dados enviados incluem: nome descoberto nas fontes públicas, dados financeiros resumidos, processos encontrados e menções na web.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Essa transferência é realizada com base em <strong style={{ color: 'var(--color-text-primary)' }}>cláusulas contratuais</strong> da OpenAI que estabelecem padrões adequados de proteção de dados, em conformidade com o Art. 33 da LGPD e a Resolução CD/ANPD nº 19/2024.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Nenhum dado pessoal do comprador (e-mail, CPF do comprador) é enviado à OpenAI.
            </p>
          </section>

          {/* ============================================ */}
          {/* Compartilhamento com Terceiros */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Compartilhamento com Terceiros
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Compartilhamos dados estritamente necessários com:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Terceiro</th>
                    <th style={tableStyles.th}>Dados Compartilhados</th>
                    <th style={tableStyles.th}>Finalidade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tableStyles.td}><strong>Stripe</strong></td>
                    <td style={tableStyles.td}>E-mail e nome do comprador</td>
                    <td style={tableStyles.td}>Processamento de pagamento (Pix e cartão)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Brevo</strong></td>
                    <td style={tableStyles.td}>E-mail do comprador</td>
                    <td style={tableStyles.td}>Envio de e-mails transacionais (magic link e notificação de conclusão)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Neon</strong></td>
                    <td style={tableStyles.td}>Todos os dados (armazenamento)</td>
                    <td style={tableStyles.td}>Banco de dados PostgreSQL</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>OpenAI</strong></td>
                    <td style={tableStyles.td}>Dados do consultado (sem dados do comprador)</td>
                    <td style={tableStyles.td}>Geração de resumo por IA</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Plausible</strong></td>
                    <td style={tableStyles.td}>Nenhum dado pessoal</td>
                    <td style={tableStyles.td}>Analytics anônimo e cookieless</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Sentry</strong></td>
                    <td style={tableStyles.td}>Dados técnicos de erro</td>
                    <td style={tableStyles.td}>Monitoramento de erros</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Nenhum terceiro recebe dados para fins de marketing, publicidade ou revenda.</strong>
            </p>
          </section>

          {/* ============================================ */}
          {/* Cookies e Tecnologias de Rastreamento */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Cookies e Tecnologias de Rastreamento
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              O E O PIX? utiliza o <strong style={{ color: 'var(--color-text-primary)' }}>Plausible</strong> como ferramenta de analytics, que é <strong style={{ color: 'var(--color-text-primary)' }}>cookieless</strong> — não instala cookies e não coleta dados pessoais. Portanto, não utilizamos cookies de rastreamento, analytics ou publicidade.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>Cookie de sessão (estritamente necessário):</strong> Utilizamos um cookie <strong style={{ color: 'var(--color-text-primary)' }}>httpOnly</strong> contendo um token JWT exclusivamente para manter a sessão do usuário na área &ldquo;Minhas Consultas&rdquo;. Este cookie é necessário para o funcionamento do serviço, expira em 30 dias e não rastreia comportamento do usuário.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              O uso deste cookie estritamente necessário é baseado no <strong style={{ color: 'var(--color-text-primary)' }}>Legítimo Interesse</strong> (Art. 7º, IX da LGPD), conforme orientação do Guia Orientativo da ANPD sobre Cookies (outubro/2022).
            </p>
          </section>

          {/* ============================================ */}
          {/* Período de Retenção de Dados */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Período de Retenção de Dados
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Dado</th>
                    <th style={tableStyles.th}>Período de Retenção</th>
                    <th style={tableStyles.th}>Ação Após Expirar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tableStyles.td}>Relatório (dados brutos das APIs)</td>
                    <td style={tableStyles.td}><strong>7 dias</strong></td>
                    <td style={tableStyles.td}>Purga completa do registro</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Dados de compra (Purchase)</td>
                    <td style={tableStyles.td}><strong>Indefinido</strong> (obrigação fiscal)</td>
                    <td style={tableStyles.td}>Anonimização de e-mail, nome e CPF do comprador após 2 anos</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Leads capturados (API indisponível)</td>
                    <td style={tableStyles.td}><strong>90 dias</strong></td>
                    <td style={tableStyles.td}>Purga completa</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Blocklist (exclusões solicitadas)</td>
                    <td style={tableStyles.td}><strong>Indefinido</strong></td>
                    <td style={tableStyles.td}>Mantido para proteção contínua do titular</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Códigos de autenticação (magic link)</td>
                    <td style={tableStyles.td}><strong>10 minutos</strong></td>
                    <td style={tableStyles.td}>Purga diária</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ============================================ */}
          {/* Seus Direitos como Comprador */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Seus Direitos como Comprador
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Conforme a LGPD (Art. 18), você tem direito a:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
                paddingLeft: '20px',
              }}
            >
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Acessar</strong> os dados que temos sobre você;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar correção</strong> de dados incorretos;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar exclusão</strong> dos seus dados;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar portabilidade</strong> dos seus dados;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Revogar consentimento</strong> a qualquer momento;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Obter informações</strong> sobre o compartilhamento de dados com terceiros;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Opor-se</strong> ao tratamento baseado em legítimo interesse.</li>
            </ul>
          </section>

          {/* ============================================ */}
          {/* Direitos de Terceiros */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Direitos de Terceiros (Pessoas Consultadas)
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Se você foi alvo de uma consulta no E O PIX?, você também possui direitos sob a LGPD, mesmo sem ter sido nosso cliente. Você pode:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
                paddingLeft: '20px',
              }}
            >
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar exclusão</strong> dos seus dados dos nossos sistemas;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar correção</strong> de informações incorretas;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Informar erro de homônimo</strong> para corrigir atribuição equivocada;</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar bloqueio</strong> de futuras consultas ao seu CPF/CNPJ (Blocklist).</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Para exercer qualquer desses direitos, acesse a página{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>{' '}
              ou entre em contato pelo e-mail{' '}
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                plataforma@somoseopix.com.br
              </a>
              .
            </p>
          </section>

          {/* ============================================ */}
          {/* Segurança dos Dados */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Segurança dos Dados
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Adotamos medidas técnicas e organizacionais para proteger os dados pessoais, incluindo: criptografia em trânsito (HTTPS); armazenamento em banco de dados com acesso restrito; autenticação via magic link (sem senhas armazenadas); validação de webhook com assinatura criptográfica; rate limiting para prevenção de abuso; monitoramento de erros via Sentry; e purga automatizada de dados expirados.
            </p>
          </section>

          {/* ============================================ */}
          {/* Alterações nesta Política */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Alterações nesta Política
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Esta Política pode ser atualizada a qualquer momento. A versão vigente estará sempre disponível em{' '}
              <a
                href="/privacidade"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                /privacidade
              </a>{' '}
              com a data da última atualização.
            </p>
          </section>

          {/* ============================================ */}
          {/* Contato */}
          {/* ============================================ */}
          <section style={{ marginBottom: '40px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Contato
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Para questões relacionadas a dados pessoais e privacidade:<br />
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Para dúvidas gerais sobre o serviço:<br />
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
          </section>

          {/* ============================================ */}
          {/* Rodapé do Card */}
          {/* ============================================ */}
          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Link
              href="/termos"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              ← Termos de Uso
            </Link>

            <Link
              href="/privacidade/titular"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              Direitos do Titular →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
