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
              margin: '0 0 32px 0',
            }}
          >
            Última atualização: Fevereiro 2026
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
              Identificação do Fornecedor
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
              E O PIX? é um serviço oferecido por [RAZÃO SOCIAL COMPLETA], inscrita no CNPJ sob o nº [XX.XXX.XXX/XXXX-XX], com sede na [ENDEREÇO COMPLETO COM CEP], Florianópolis/SC.
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
              E-mail de contato: contato@somoseopix.com
            </p>
          </section>

          {/* ============================================ */}
          {/* 2. Natureza do Serviço */}
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
              Natureza do Serviço
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
              O E O PIX? é uma ferramenta de agregação de dados públicos. Consultamos registros abertos de protestos, processos judiciais, notícias e cadastro empresarial para gerar um relatório consolidado.
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
              Não somos um bureau de crédito, não calculamos score, não emitimos parecer sobre capacidade de pagamento e não oferecemos recomendações de crédito ou risco. Os ícones de clima (☀️/🌧️) representam exclusivamente o volume de registros públicos encontrados, não avaliação de risco de crédito. A interpretação é exclusivamente sua.
            </p>
          </section>

          {/* ============================================ */}
          {/* 3. Quem Pode Usar */}
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
              Quem Pode Usar
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
              O serviço é destinado a maiores de 18 anos. Ao utilizar o E O PIX?, você declara ser maior de idade e possuir capacidade civil plena. Você informa um CPF ou CNPJ, realiza o pagamento via Pix, e nosso sistema consulta fontes públicas para gerar um relatório consolidado. O relatório fica disponível na área "Minhas Consultas", vinculada ao e-mail informado no momento da compra, por um período de 7 (sete) dias.
            </p>
          </section>

          {/* ============================================ */}
          {/* 4. Isenção de Veracidade */}
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
              Isenção de Veracidade
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
              Os dados exibidos nos relatórios são obtidos de fontes públicas, incluindo Receita Federal, tribunais de justiça, plataformas de reclamação e portais de notícias. Não garantimos a completude, a atualidade ou a exatidão dos dados. A responsabilidade pela interpretação dos dados e por qualquer decisão tomada com base neles é exclusivamente do usuário.
            </p>
          </section>

          {/* ============================================ */}
          {/* 5. Aviso de Homônimos */}
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
              Aviso de Homônimos
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
              Consultas por CPF podem retornar resultados de homônimos, especialmente em processos judiciais e menções na web, onde a individualização depende do número do documento ou de contexto geográfico. Nosso sistema utiliza inteligência artificial para filtrar homônimos por região, mas essa filtragem não é infalível.
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
              Se você identificar dados atribuídos à pessoa errada, utilize a página{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>{' '}
              para solicitar correção.
            </p>
          </section>

          {/* ============================================ */}
          {/* 6. Limitação de Responsabilidade */}
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
              Limitação de Responsabilidade
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
              O E O PIX? é um serviço meramente informativo. Não nos responsabilizamos por decisões comerciais, contratuais, financeiras, trabalhistas ou de qualquer outra natureza tomadas pelo usuário com base nos dados do relatório.
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
              O serviço não substitui assessoria jurídica, contábil, financeira ou de compliance. Recomendamos que decisões relevantes sejam sempre respaldadas por consulta a profissionais qualificados.
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
              Não nos responsabilizamos por eventuais danos diretos ou indiretos decorrentes de: informações imprecisas ou incompletas provenientes das fontes públicas consultadas; identificação equivocada de homônimos; indisponibilidade temporária do serviço; ou uso do relatório para finalidades diferentes da análise comercial legítima.
            </p>
          </section>

          {/* ============================================ */}
          {/* 7. Uso Permitido e Vedações */}
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
              Uso Permitido e Vedações
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
              O E O PIX? deve ser utilizado exclusivamente para fins de análise comercial legítima, como verificação de partes de relações contratuais.
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
              É expressamente vedado utilizar o serviço para:
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
              <li>Assédio, stalking, perseguição ou intimidação de qualquer pessoa;</li>
              <li>Discriminação por raça, gênero, orientação sexual, religião, origem, deficiência ou qualquer outro critério;</li>
              <li>Retaliação contra pessoas que exerçam direitos legítimos;</li>
              <li>Monitoramento não autorizado de terceiros para fins pessoais;</li>
              <li>Qualquer finalidade ilícita ou contrária à boa-fé.</li>
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
              Reservamo-nos o direito de bloquear o acesso de usuários que violem estas vedações, sem direito a reembolso, além de reportar às autoridades competentes quando cabível.
            </p>
          </section>

          {/* ============================================ */}
          {/* 8. Preço e Pagamento */}
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
              Preço e Pagamento
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
              Cada consulta custa R$ 29,90, pagos via Pix antes da geração do relatório. O pagamento é processado pelo Asaas, que coleta nome e CPF do comprador para fins de emissão de nota fiscal. O valor é cobrado por consulta, sem assinatura nem fidelidade.
            </p>
          </section>

          {/* ============================================ */}
          {/* 9. Direito de Arrependimento e Política de Reembolso */}
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
              Direito de Arrependimento e Política de Reembolso
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
              Conforme o Art. 49 do Código de Defesa do Consumidor, o consumidor tem o direito de desistir da contratação no prazo de 7 (sete) dias a contar da contratação.
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
              <strong style={{ color: 'var(--color-text-primary)' }}>Natureza de consumo imediato:</strong> O E O PIX? é um serviço de consulta sob demanda. O relatório é gerado e disponibilizado em poucos minutos após a confirmação do pagamento. Uma vez que o relatório é visualizado pelo usuário, considera-se que o serviço foi integralmente prestado e consumido.
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
              <li>Se o relatório ainda não foi visualizado e a solicitação ocorrer dentro de 7 dias da compra: reembolso integral.</li>
              <li>Em caso de falha técnica que impeça a geração do relatório: reembolso automático via Pix, independentemente do prazo.</li>
              <li>Se o relatório foi gerado e visualizado: o serviço é considerado prestado. Não há reembolso, salvo por falha técnica comprovada.</li>
              <li>Erros de digitação no CPF/CNPJ ou no e-mail informado pelo usuário não geram direito a reembolso, pois o sistema processa exatamente o documento inserido.</li>
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
          {/* 10. Uso de Inteligência Artificial */}
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
              Uso de Inteligência Artificial
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
              O serviço utiliza modelos de inteligência artificial (LLM – Large Language Model) para gerar resumos textuais dos dados encontrados e para filtrar resultados de homônimos por região. A IA não toma decisões automatizadas com efeitos legais para o titular dos dados consultados. Os resumos são factuais e não contêm recomendações, avaliações de risco ou juízo de valor.
            </p>
          </section>

          {/* ============================================ */}
          {/* 11. Propriedade Intelectual */}
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
              Propriedade Intelectual
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
          {/* 12. Disponibilidade do Serviço */}
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
              Disponibilidade do Serviço
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
              O serviço é oferecido "como está" (as is). Não garantimos disponibilidade ininterrupta. Manutenções programadas ou indisponibilidade de fontes externas podem temporariamente impedir a geração de relatórios. Nessas situações, o sistema bloqueia novas compras até que o serviço seja restabelecido.
            </p>
          </section>

          {/* ============================================ */}
          {/* 13. Alterações nos Termos */}
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
              Alterações nos Termos
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
              Estes Termos podem ser atualizados a qualquer momento. A versão vigente estará sempre disponível nesta página, com indicação da data da última atualização. O uso continuado do serviço após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* ============================================ */}
          {/* 14. Foro */}
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
              Foro
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
              Fica eleito o foro da comarca de Florianópolis/SC para dirimir quaisquer controvérsias, sem prejuízo do direito do consumidor de ajuizar ação no foro de seu domicílio, conforme Art. 101, I do Código de Defesa do Consumidor.
            </p>
          </section>

          {/* ============================================ */}
          {/* 15. Contato */}
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
              Para dúvidas, reclamações ou solicitações relacionadas ao serviço:<br />
              <a
                href="mailto:contato@somoseopix.com"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                contato@somoseopix.com
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
              Para questões relacionadas a dados pessoais e privacidade:<br />
              <a
                href="mailto:privacidade@somoseopix.com"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                privacidade@somoseopix.com
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
