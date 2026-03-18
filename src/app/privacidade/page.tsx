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
            Politica de Privacidade
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 4px 0',
            }}
          >
            Ultima atualizacao: Marco 2026
          </p>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 32px 0',
            }}
          >
            Em conformidade com a Lei n. 13.709/2018 (LGPD)
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: '0 0 32px 0' }} />

          {/* ============================================ */}
          {/* 1. Quem Somos (Controladora) */}
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
              1. Quem Somos (Controladora)
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
              Esta Politica se aplica ao servico <strong style={{ color: 'var(--color-text-primary)' }}>E O PIX?</strong>, operado por <strong style={{ color: 'var(--color-text-primary)' }}>EROS &amp; CO NEGOCIOS LTDA</strong>, inscrita no CNPJ sob o n. <strong style={{ color: 'var(--color-text-primary)' }}>65.462.245/0001-86</strong>, com sede na <strong style={{ color: 'var(--color-text-primary)' }}>Av. Brigadeiro Faria Lima, 1811, Apt. 1119, Jardim Paulistano, São Paulo/SP, CEP 01452-001</strong>.
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
              Para fins da LGPD, atuamos como <strong style={{ color: 'var(--color-text-primary)' }}>Controlador de Dados</strong> tanto em relacao aos dados dos compradores quanto aos dados de terceiros consultados.
            </p>
          </section>

          {/* ============================================ */}
          {/* 2. Encarregado de Dados (DPO) */}
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
              2. Encarregado de Dados (DPO)
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
              Nos termos do art. 41 da LGPD, o canal de contato do Encarregado pelo Tratamento de Dados Pessoais e:
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
              O Encarregado e responsavel por aceitar reclamacoes e comunicacoes dos titulares de dados, receber comunicacoes da ANPD, e orientar sobre as praticas de protecao de dados pessoais.
            </p>
          </section>

          {/* ============================================ */}
          {/* 3. Base Legal para Tratamento de Dados */}
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
              3. Base Legal para Tratamento de Dados
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
              O tratamento encontra fundamento na LGPD:
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
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Art. 7., V -- execucao contratual</strong>, para prestacao do servico de consulta</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Art. 7., IX -- legitimo interesse</strong>, para consulta informacional, analise de risco, diligencia previa e verificacao cadastral</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Art. 7., X -- protecao ao credito</strong>, para informacoes crediticias de bureaus autorizados</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Art. 7., II -- cumprimento de obrigacao legal ou regulatoria</strong>, quando aplicavel</li>
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
              A utilizacao da plataforma pressupoe que o usuario possua finalidade legitima para a consulta.
            </p>
          </section>

          {/* ============================================ */}
          {/* 4. Dados que Coletamos */}
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
              4. Dados que Coletamos
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
              Coletamos apenas os dados necessarios para prestar o servico. Existem duas categorias:
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
              Dados do Comprador (voce, que usa o servico)
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
                    <td style={tableStyles.td}>Autenticacao, notificacoes, acesso ao relatorio</td>
                    <td style={tableStyles.td}>Execucao contratual (Art. 7., V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Senha (hash)</td>
                    <td style={tableStyles.td}>Autenticacao segura da conta</td>
                    <td style={tableStyles.td}>Execucao contratual (Art. 7., V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>CPF ou CNPJ consultado</td>
                    <td style={tableStyles.td}>Identificacao do alvo da consulta</td>
                    <td style={tableStyles.td}>Execucao contratual (Art. 7., V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Nome do comprador</td>
                    <td style={tableStyles.td}>Identificacao e processamento de pagamento</td>
                    <td style={tableStyles.td}>Execucao contratual (Art. 7., V)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Endereco IP</td>
                    <td style={tableStyles.td}>Rate limiting, protecao contra bots e auditoria</td>
                    <td style={tableStyles.td}>Legitimo Interesse (Art. 7., IX)</td>
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
                    <td style={tableStyles.td}>Dados cadastrais (CPF/CNPJ)</td>
                    <td style={tableStyles.td}>APIFull (provedor de dados licenciado)</td>
                    <td style={tableStyles.td}>Legitimo Interesse (Art. 7., IX) -- dados manifestamente publicos</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Protestos, dividas, situacao cadastral</td>
                    <td style={tableStyles.td}>APIFull</td>
                    <td style={tableStyles.td}>Legitimo Interesse (Art. 7., IX) / Protecao ao credito (Art. 7., X)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Processos judiciais</td>
                    <td style={tableStyles.td}>APIFull</td>
                    <td style={tableStyles.td}>Legitimo Interesse (Art. 7., IX) -- dados publicos de tribunais</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Mencoes na web</td>
                    <td style={tableStyles.td}>Serper (busca na web)</td>
                    <td style={tableStyles.td}>Legitimo Interesse (Art. 7., IX)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Resumo textual gerado por IA</td>
                    <td style={tableStyles.td}>OpenAI GPT-4o-mini</td>
                    <td style={tableStyles.td}>Legitimo Interesse (Art. 7., IX)</td>
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Importante:</strong> Os dados de terceiros sao obtidos exclusivamente de fontes publicas ou licenciadas. Nao coletamos dados diretamente dos titulares consultados. Um Relatorio de Impacto a Protecao de Dados Pessoais (RIPD) foi elaborado e esta documentado internamente, conforme art. 38 da LGPD.
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Os terceiros consultados podem exercer seus direitos</strong> atraves da pagina{' '}
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
          {/* 5. Ausencia de Banco de Dados Proprio */}
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
              5. Ausencia de Banco de Dados Proprio
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
              A EOPIX nao constitui nem mantem banco de dados proprio contendo informacoes pessoais consultaveis. Os relatorios sao gerados em tempo real, mediante requisicao automatizada as bases externas, permanecendo tais informacoes sob responsabilidade de seus provedores originarios.
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
              A plataforma mantem apenas registros tecnicos minimos indispensaveis a operacao e seguranca (logs de acesso, autenticacao e auditoria).
            </p>
          </section>

          {/* ============================================ */}
          {/* 6. Ausencia de Perfilhamento Automatizado */}
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
              6. Ausencia de Perfilhamento Automatizado
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
              A plataforma nao realiza decisoes automatizadas baseadas exclusivamente no tratamento de dados pessoais. Os dados <strong style={{ color: 'var(--color-text-primary)' }}>NAO</strong> sao utilizados para:
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
              <li>Criacao de score proprio</li>
              <li>Perfilhamento comportamental</li>
              <li>Classificacao autonoma de risco</li>
              <li>Ranqueamento reputacional ou qualquer avaliacao automatizada</li>
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
              Os icones de clima (Sol/Chuva) sao baseados em contagem numerica simples (0 ocorrencias = Sol, 1+ = Chuva), nao em avaliacao de IA.
            </p>
          </section>

          {/* ============================================ */}
          {/* 7. Uso de Inteligencia Artificial */}
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
              7. Uso de Inteligencia Artificial
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
              O servico utiliza o modelo de linguagem <strong style={{ color: 'var(--color-text-primary)' }}>GPT-4o-mini (OpenAI)</strong> para duas finalidades:
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
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Geracao de resumo factual:</strong> A IA le os dados encontrados e gera um resumo de 2-3 frases, sem juizo de valor.</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Filtragem de homonimos:</strong> A IA utiliza a regiao do CPF/CNPJ para descartar mencoes de pessoas com nome semelhante.</li>
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Nao ha tomada de decisao automatizada com efeitos legais.</strong> O titular pode contestar resultados atraves da pagina{' '}
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
          {/* 8. Compartilhamento com Terceiros */}
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
              8. Compartilhamento com Terceiros
            </h3>
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
                    <td style={tableStyles.td}><strong>AbacatePay</strong></td>
                    <td style={tableStyles.td}>E-mail e CPF/CNPJ do comprador</td>
                    <td style={tableStyles.td}>Processamento de pagamento (Pix e cartao)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>APIFull</strong></td>
                    <td style={tableStyles.td}>CPF ou CNPJ consultado</td>
                    <td style={tableStyles.td}>Consulta de dados cadastrais, financeiros e processuais</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Serper</strong></td>
                    <td style={tableStyles.td}>Nome associado ao CPF/CNPJ</td>
                    <td style={tableStyles.td}>Busca na web (mencoes e noticias)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>OpenAI</strong></td>
                    <td style={tableStyles.td}>Dados do consultado (sem dados do comprador)</td>
                    <td style={tableStyles.td}>Geracao de resumo por IA</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Neon</strong></td>
                    <td style={tableStyles.td}>Todos os dados (armazenamento)</td>
                    <td style={tableStyles.td}>Banco de dados PostgreSQL (servidores nos EUA)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Vercel</strong></td>
                    <td style={tableStyles.td}>Dados tecnicos de requisicao</td>
                    <td style={tableStyles.td}>Hospedagem e CDN (servidores nos EUA)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}><strong>Sentry</strong></td>
                    <td style={tableStyles.td}>Dados tecnicos de erro</td>
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
          {/* 9. Transferencia Internacional de Dados */}
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
              9. Transferencia Internacional de Dados
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
              Dados sao processados em servidores nos Estados Unidos pelos seguintes provedores: <strong style={{ color: 'var(--color-text-primary)' }}>OpenAI</strong> (geracao de resumos por IA), <strong style={{ color: 'var(--color-text-primary)' }}>Vercel</strong> (hospedagem e CDN), <strong style={{ color: 'var(--color-text-primary)' }}>Neon</strong> (banco de dados PostgreSQL).
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
              A transferencia e realizada com base em clausulas contratuais que estabelecem padroes adequados de protecao, conforme Art. 33 da LGPD e Resolucao CD/ANPD n. 19/2024.
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
              Nenhum dado pessoal do comprador (e-mail, senha) e enviado a OpenAI -- apenas dados do consultado provenientes de fontes publicas.
            </p>
          </section>

          {/* ============================================ */}
          {/* 10. Cookies e Tecnologias de Rastreamento */}
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
              10. Cookies e Tecnologias de Rastreamento
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
              O E O PIX? <strong style={{ color: 'var(--color-text-primary)' }}>nao utiliza cookies de rastreamento, analytics ou publicidade</strong>.
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Cookie de sessao (estritamente necessario):</strong> cookie <strong style={{ color: 'var(--color-text-primary)' }}>httpOnly</strong> contendo token JWT para sessao na area &ldquo;Minhas Consultas&rdquo;. Necessario para o servico, expira em 30 dias, nao rastreia comportamento. Base: Legitimo Interesse (Art. 7., IX), conforme Guia da ANPD sobre Cookies (outubro/2022).
            </p>
          </section>

          {/* ============================================ */}
          {/* 11. Periodo de Retencao de Dados */}
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
              11. Periodo de Retencao de Dados
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Dado</th>
                    <th style={tableStyles.th}>Periodo de Retencao</th>
                    <th style={tableStyles.th}>Acao Apos Expirar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tableStyles.td}>Relatorio (dados brutos das APIs)</td>
                    <td style={tableStyles.td}><strong>7 dias</strong></td>
                    <td style={tableStyles.td}>Exclusao permanente automatica (cron)</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Dados cadastrais do usuario (nome, e-mail)</td>
                    <td style={tableStyles.td}><strong>Enquanto conta ativa + 6 meses</strong></td>
                    <td style={tableStyles.td}>Anonimizacao</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Registros de transacoes (Purchase)</td>
                    <td style={tableStyles.td}><strong>5 anos</strong> (obrigacao fiscal)</td>
                    <td style={tableStyles.td}>Anonimizacao de dados pessoais</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Logs de auditoria (IP, data, identificador)</td>
                    <td style={tableStyles.td}><strong>2 anos</strong></td>
                    <td style={tableStyles.td}>Exclusao permanente</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Leads capturados (API indisponivel)</td>
                    <td style={tableStyles.td}><strong>90 dias</strong></td>
                    <td style={tableStyles.td}>Exclusao permanente</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Blocklist (exclusoes solicitadas)</td>
                    <td style={tableStyles.td}><strong>Indefinido</strong></td>
                    <td style={tableStyles.td}>Mantido para protecao continua do titular</td>
                  </tr>
                  <tr>
                    <td style={tableStyles.td}>Codigos de autenticacao</td>
                    <td style={tableStyles.td}><strong>10 minutos</strong></td>
                    <td style={tableStyles.td}>Exclusao diaria automatica</td>
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
              Apos o termino do prazo de retencao, os dados sao eliminados de forma definitiva por meio de cron jobs automatizados (Inngest), utilizando exclusao permanente do banco de dados sem possibilidade de recuperacao.
            </p>
          </section>

          {/* ============================================ */}
          {/* 12. Direitos dos Titulares dos Dados Consultados */}
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
              12. Direitos dos Titulares dos Dados Consultados
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
              Conforme artigos 17 a 22 da LGPD, os titulares podem exercer:
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
              <li>Confirmacao da existencia de tratamento</li>
              <li>Acesso aos dados tratados</li>
              <li>Correcao de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimizacao, bloqueio ou eliminacao de dados desnecessarios</li>
              <li>Informacao sobre compartilhamento com terceiros</li>
              <li>Oposicao ao tratamento quando em desconformidade com a LGPD</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Como a EOPIX atua como agregadora, solicitacoes de correcao referentes ao conteudo serao encaminhadas aos provedores originarios.
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
              As solicitacoes devem ser enviadas via pagina{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>{' '}
              ou e-mail{' '}
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                plataforma@somoseopix.com.br
              </a>
              , e serao respondidas em ate 15 dias uteis.
            </p>
          </section>

          {/* ============================================ */}
          {/* 13. Seus Direitos como Comprador */}
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
              13. Seus Direitos como Comprador
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
              Conforme a LGPD (Art. 18), voce tem direito a:
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
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Acessar</strong> seus dados</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar correcao</strong></li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar exclusao</strong></li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Solicitar portabilidade</strong></li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Revogar consentimento</strong></li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Obter informacoes</strong> sobre compartilhamento</li>
              <li><strong style={{ color: 'var(--color-text-primary)' }}>Opor-se</strong> ao tratamento baseado em legitimo interesse</li>
            </ul>
          </section>

          {/* ============================================ */}
          {/* 14. Seguranca dos Dados */}
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
              14. Seguranca dos Dados
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
              Adotamos medidas tecnicas e organizacionais:
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
              <li>Criptografia em transito (HTTPS/TLS)</li>
              <li>Senhas armazenadas com hash bcrypt (nunca em texto plano)</li>
              <li>Validacao de webhooks com HMAC-SHA256</li>
              <li>Cookies httpOnly com sameSite strict</li>
              <li>Controle de acesso baseado em funcoes e principio do menor privilegio</li>
              <li>Rate limiting para prevencao de abuso</li>
              <li>Monitoramento de erros via Sentry</li>
              <li>Purga automatizada de dados expirados</li>
            </ul>
          </section>

          {/* ============================================ */}
          {/* 15. Procedimento em Caso de Incidente */}
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
              15. Procedimento em Caso de Incidente
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
              Em caso de incidente de seguranca com risco ou dano relevante, a EOPIX se compromete a:
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
              <li>Comunicar a ANPD em ate 72 horas apos confirmacao do incidente</li>
              <li>Comunicar os titulares afetados</li>
              <li>Adotar medidas para reverter ou mitigar os efeitos</li>
              <li>Documentar integralmente o incidente, incluindo causas e medidas corretivas</li>
            </ul>
          </section>

          {/* ============================================ */}
          {/* 16. Alteracoes nesta Politica */}
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
              16. Alteracoes nesta Politica
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
              Esta Politica pode ser atualizada a qualquer momento. A versao vigente estara sempre disponivel em{' '}
              <a
                href="/privacidade"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                /privacidade
              </a>{' '}
              com a data da ultima atualizacao.
            </p>
          </section>

          {/* ============================================ */}
          {/* 17. Contato */}
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
              17. Contato
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
              Para questoes sobre dados pessoais e privacidade:<br />
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
              Para duvidas gerais:<br />
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
          {/* Rodape do Card */}
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
