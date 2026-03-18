"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* ============================================ */}
      {/* NAV */}
      {/* ============================================ */}
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
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
          }}
        >
          <LogoFundoPreto />
        </Link>
      </nav>

      {/* ============================================ */}
      {/* CONTEÚDO */}
      {/* ============================================ */}
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
        {/* Card Container */}
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '48px',
          }}
        >
          {/* Título */}
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Termos de Uso
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 4px 0',
            }}
          >
            Última atualização: Março 2026
          </p>

          {/* Sub-subtítulo */}
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 32px 0',
            }}
          >
            Em conformidade com a Lei nº 13.709/2018 (LGPD)
          </p>

          {/* Separador */}
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--color-border-subtle)',
              margin: '0 0 32px 0',
            }}
          />

          {/* ============================================ */}
          {/* 1. Identificação do Fornecedor */}
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
              1. Identificação do Fornecedor
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
              E O PIX? é um serviço oferecido por EROS &amp; CO NEGOCIOS LTDA, inscrita no CNPJ sob o nº 65.462.245/0001-86, com sede na Av. Brigadeiro Faria Lima, 1811, Apt. 1119, Jardim Paulistano, São Paulo/SP, CEP 01452-001.
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
              E-mail de contato: plataforma@somoseopix.com.br
            </p>
          </section>

          {/* ============================================ */}
          {/* 2. Natureza e Finalidade da Plataforma */}
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
              2. Natureza e Finalidade da Plataforma
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
              A plataforma EOPIX (&ldquo;E o Pix?&rdquo;) consiste em ambiente tecnológico destinado à consolidação, indexação e apresentação informacional de dados provenientes de bases externas, mediante solicitação realizada pelo usuário por meio de consulta baseada em CPF ou CNPJ, mediante pagamento.
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
              A plataforma permite que o usuário obtenha, em relatório consolidado gerado em tempo real, informações provenientes de múltiplas fontes externas, incluindo, mas não se limitando a: bases cadastrais públicas; bases de dados licenciadas de provedores especializados; bureaus de crédito; agregadores de informações processuais; bases informacionais disponibilizadas por órgãos públicos ou entidades privadas autorizadas.
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
              A EOPIX não cria, altera, interpreta, certifica ou valida os dados apresentados, limitando-se a consolidar informações disponibilizadas por terceiros provedores de dados.
            </p>
          </section>

          {/* ============================================ */}
          {/* 3. Natureza de Indexação e Consolidação */}
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
              3. Natureza de Indexação e Consolidação
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
              A atividade exercida pela plataforma consiste exclusivamente na indexação, agregação e consolidação automatizada de informações provenientes de bases externas, acessadas por meio de integrações tecnológicas.
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
              A plataforma atua como interface tecnológica de agregação informacional, permitindo ao usuário acessar em um único relatório dados provenientes de múltiplas fontes originárias.
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
              A EOPIX não é responsável pela geração, manutenção ou atualização dos dados apresentados, os quais permanecem sob responsabilidade exclusiva das bases de dados de origem.
            </p>
          </section>

          {/* ============================================ */}
          {/* 4. Declaração de Finalidade Legítima */}
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
              4. Declaração de Finalidade Legítima
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
              Antes da realização de qualquer consulta na plataforma, o usuário declara possuir finalidade legítima, específica e juridicamente adequada para o acesso às informações disponibilizadas. Consideram-se finalidades legítimas, entre outras:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '8px 0 0 0',
                paddingLeft: '20px',
              }}
            >
              <li>Verificação cadastral de pessoa natural ou jurídica;</li>
              <li>Análise de risco em relações comerciais ou contratuais;</li>
              <li>Prevenção a fraudes;</li>
              <li>Diligência prévia em negociações ou operações comerciais;</li>
              <li>Avaliação de crédito ou solvência em contextos permitidos pela legislação aplicável.</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              A utilização da plataforma para consultas indiscriminadas, abusivas ou desvinculadas de finalidade legítima é expressamente vedada.
            </p>
          </section>

          {/* ============================================ */}
          {/* 5. Identificação Prévia para Consultas */}
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
              5. Identificação Prévia para Consultas
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
              A realização de consultas pressupõe que o usuário já possua previamente os dados identificadores necessários (CPF ou CNPJ). A plataforma limita-se a consolidar informações relacionadas ao identificador fornecido, não sendo destinada à descoberta irrestrita de dados pessoais nem à identificação de indivíduos sem a prévia indicação de seus dados identificadores.
            </p>
          </section>

          {/* ============================================ */}
          {/* 6. Natureza Informativa dos Relatórios */}
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
              6. Natureza Informativa dos Relatórios
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
              Os relatórios possuem natureza exclusivamente informativa, como ferramenta de apoio à verificação cadastral, diligência informacional e análise preliminar de risco.
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
              As informações são provenientes de bases de dados externas, públicas ou licenciadas, consolidadas e apresentadas sem alteração, validação ou certificação.
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
              Os relatórios não constituem certificação de dados, parecer jurídico, recomendação de crédito, avaliação reputacional ou qualquer forma de aconselhamento técnico ou profissional. Os ícones de clima representam exclusivamente o volume de registros públicos encontrados, não avaliação de risco de crédito.
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
              A utilização das informações e qualquer decisão tomada com base nelas é de responsabilidade exclusiva do usuário consultante.
            </p>
          </section>

          {/* ============================================ */}
          {/* 7. Responsabilidade do Usuário */}
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
              7. Responsabilidade do Usuário
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
              O usuário reconhece que o acesso às informações deve ocorrer apenas no contexto de verificação cadastral, diligência informacional, análise de risco ou prevenção a fraudes.
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
              O usuário compromete-se a não utilizar as informações para finalidades ilícitas, abusivas, discriminatórias ou que possam violar direitos fundamentais.
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
              Eventual utilização indevida será de responsabilidade exclusiva do usuário consultante.
            </p>
          </section>

          {/* ============================================ */}
          {/* 8. Uso Indevido da Plataforma */}
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
              8. Uso Indevido da Plataforma
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
              É vedado utilizar os dados obtidos para:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '8px 0 0 0',
                paddingLeft: '20px',
              }}
            >
              <li>Práticas discriminatórias;</li>
              <li>Perseguição, assédio ou intimidação;</li>
              <li>Exposição pública indevida;</li>
              <li>Atividades ilícitas;</li>
              <li>Violação de direitos fundamentais;</li>
              <li>Monitoramento não autorizado de terceiros para fins pessoais;</li>
              <li>Qualquer finalidade contrária à boa-fé.</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              A EOPIX reserva-se o direito de suspender ou cancelar o acesso do usuário que utilizar a plataforma em desacordo com estes termos, sem prejuízo das medidas legais cabíveis e sem direito a reembolso.
            </p>
          </section>

          {/* ============================================ */}
          {/* 9. Uso de Inteligência Artificial */}
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
              9. Uso de Inteligência Artificial
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
              O serviço utiliza modelos de inteligência artificial (LLM) para gerar resumos textuais dos dados encontrados e para filtrar resultados de homônimos por região. A IA não toma decisões automatizadas com efeitos legais para o titular dos dados consultados. Os resumos são factuais e não contêm recomendações, avaliações de risco ou juízo de valor.
            </p>
          </section>

          {/* ============================================ */}
          {/* 10. Cadastro, Pagamento e Condições */}
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
              10. Cadastro, Pagamento e Condições
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
              Para utilizar a plataforma, o usuário deve realizar cadastro prévio com dados verdadeiros e efetuar pagamento de R$ 39,90 (trinta e nove reais e noventa centavos) por consulta realizada.
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
              O pagamento é processado pela AbacatePay (abacatepay.com), via Pix ou cartão de crédito. A EOPIX não armazena dados de cartão de crédito ou débito. O valor é cobrado por consulta, sem assinatura nem fidelidade.
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
              A EOPIX reserva-se o direito de alterar os valores cobrados, mediante aviso prévio.
            </p>
          </section>

          {/* ============================================ */}
          {/* 11. Direito de Arrependimento e Reembolso */}
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
              11. Direito de Arrependimento e Reembolso
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
              Conforme o Art. 49 do CDC, o consumidor pode desistir no prazo de 7 dias.
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Natureza de consumo imediato:</strong> O relatório é gerado e disponibilizado em poucos minutos. Uma vez visualizado, o serviço é considerado integralmente prestado.
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Regras de reembolso:</strong>
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '8px 0 0 0',
                paddingLeft: '20px',
              }}
            >
              <li>Relatório não visualizado + dentro de 7 dias: reembolso integral;</li>
              <li>Falha técnica que impeça geração: reembolso automático via Pix, independente do prazo;</li>
              <li>Relatório gerado e visualizado: serviço prestado, sem reembolso (salvo falha técnica comprovada);</li>
              <li>Erros de digitação no CPF/CNPJ pelo usuário não geram direito a reembolso.</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              O reembolso, quando aplicável, é processado via Pix em até 48 horas.
            </p>
          </section>

          {/* ============================================ */}
          {/* 12. Propriedade Intelectual */}
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
              12. Propriedade Intelectual
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
              O layout, a marca E O PIX?, os textos originais, o código-fonte e a metodologia de cruzamento de dados são de propriedade dos titulares do serviço. Os dados públicos agregados não são de nossa autoria e pertencem às respectivas fontes.
            </p>
          </section>

          {/* ============================================ */}
          {/* 13. Disponibilidade do Serviço */}
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
              13. Disponibilidade do Serviço
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
              O serviço é oferecido &ldquo;como está&rdquo; (as is). Não garantimos disponibilidade ininterrupta. Manutenções ou indisponibilidade de fontes externas podem temporariamente impedir a geração de relatórios.
            </p>
          </section>

          {/* ============================================ */}
          {/* 14. Limitação de Responsabilidade */}
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
              14. Limitação de Responsabilidade
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
              A EOPIX não poderá ser responsabilizada por:
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '8px 0 0 0',
                paddingLeft: '20px',
              }}
            >
              <li>Erros, inconsistências, omissões, desatualizações ou imprecisões nas bases de dados de origem;</li>
              <li>Decisões ou medidas adotadas por usuários ou terceiros com base nas informações disponibilizadas;</li>
              <li>Utilização indevida das informações;</li>
              <li>Indisponibilidade temporária da plataforma ou das bases externas;</li>
              <li>Atos de terceiros, incluindo ataques cibernéticos, caso a EOPIX tenha adotado medidas de segurança razoáveis.</li>
            </ul>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              A responsabilidade pela veracidade e integridade dos dados pertence exclusivamente aos provedores originários.
            </p>
          </section>

          {/* ============================================ */}
          {/* 15. Indenização Regressiva */}
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
              15. Indenização Regressiva
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
              O usuário concorda em indenizar e manter indene a EOPIX, seus sócios, administradores, colaboradores e parceiros, contra qualquer reclamação, demanda, ação judicial, responsabilidade, dano, prejuízo, custo ou despesa, incluindo honorários advocatícios, decorrentes do uso indevido das informações obtidas por meio da plataforma.
            </p>
          </section>

          {/* ============================================ */}
          {/* 16. Limitação Financeira de Responsabilidade */}
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
              16. Limitação Financeira de Responsabilidade
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
              Caso reconhecida responsabilidade da EOPIX por decisão judicial definitiva, a eventual indenização ficará limitada ao valor pago pelo usuário pela consulta específica que originou a demanda.
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
              A EOPIX não será responsável por danos indiretos, lucros cessantes, perda de oportunidade ou quaisquer prejuízos decorrentes de decisões tomadas com base nas informações disponibilizadas.
            </p>
          </section>

          {/* ============================================ */}
          {/* 17. Legislação Aplicável */}
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
              17. Legislação Aplicável
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
              Estes termos são regidos pela legislação brasileira, em especial pela Lei nº 13.709/2018 (LGPD), pela Lei nº 12.965/2014 (Marco Civil da Internet), pelo Código de Defesa do Consumidor (Lei nº 8.078/1990, quando aplicável) e demais normas aplicáveis.
            </p>
          </section>

          {/* ============================================ */}
          {/* 18. Foro */}
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
              18. Foro
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
              Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias, sem prejuízo do direito do consumidor de ajuizar ação no foro de seu domicílio, conforme Art. 101, I do CDC.
            </p>
          </section>

          {/* ============================================ */}
          {/* 19. Aceitação dos Termos */}
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
              19. Aceitação dos Termos
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
              Ao utilizar a plataforma, o usuário declara estar ciente e de acordo com os presentes Termos de Uso, a Política de Privacidade e a Limitação de Responsabilidade aqui estabelecidas. O uso continuado após atualizações configura aceitação tácita dos termos revisados.
            </p>
          </section>

          {/* ============================================ */}
          {/* 20. Alterações nos Termos */}
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
              20. Alterações nos Termos
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
              A EOPIX reserva-se o direito de atualizar estes Termos a qualquer momento, mediante notificação ao usuário por e-mail ou aviso na plataforma. A versão vigente estará sempre disponível nesta página.
            </p>
          </section>

          {/* ============================================ */}
          {/* 21. Contato */}
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
              21. Contato
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
              Para dúvidas, reclamações ou solicitações:<br />
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
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
              Para questões sobre dados pessoais e privacidade:<br />
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
          </section>

          {/* ============================================ */}
          {/* RODAPÉ DO CARD */}
          {/* ============================================ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            {/* Esquerda */}
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              ← Voltar para o início
            </Link>

            {/* Direita */}
            <Link
              href="/privacidade"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              Política de Privacidade →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
