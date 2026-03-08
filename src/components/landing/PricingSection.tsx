import React from 'react';

interface PricingSectionProps {
  onCtaClick: () => void;
}

export default function PricingSection({ onCtaClick }: PricingSectionProps) {
  return (
    <section className="section section--primary" id="precos">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">PREÇOS</div>
          <h2 className="section-header__title">
            Mais barato que a sessão de terapia depois do <span className="section-header__highlight">calote</span>.
          </h2>
        </div>

        <div className="grid-3">
          <div className="pricing-card">
            <div className="pricing-card__label">Pacote 5 consultas</div>
            <p className="pricing-card__audience">Para freelancers e pequenos escritórios</p>
            <div className="pricing-card__value">
              R$ 119<span className="pricing-card__value-small">,90</span>
            </div>
            <p className="pricing-card__desc">&quot;Pra quem trabalha com vários clientes e já aprendeu que gente boa também dá calote.&quot;</p>
            <p className="pricing-card__includes">5 relatórios &middot; R$ 23,98 por consulta</p>
            <button className="pricing-card__cta" disabled>Em breve</button>
          </div>

          <div className="pricing-card pricing-card--featured">
            <div className="pricing-card__label">Consulta avulsa</div>
            <p className="pricing-card__audience">Para autônomos e freelancers</p>
            <div className="pricing-card__value">
              R$ 29<span className="pricing-card__value-small">,90</span>
            </div>
            <p className="pricing-card__desc">&quot;Pra aquele contrato que você tá quase fechando com um pressentimento estranho.&quot;</p>
            <p className="pricing-card__includes">Relatório completo &middot; Fontes linkadas &middot; Válido por 7 dias</p>
            <button className="btn btn--cta btn--lg btn--full" onClick={onCtaClick}>Comprar agora</button>
          </div>

          <div className="pricing-card">
            <div className="pricing-card__label">Pacote 15 consultas</div>
            <p className="pricing-card__audience">Para agências, escritórios e estúdios</p>
            <div className="pricing-card__value">
              R$ 299<span className="pricing-card__value-small">,90</span>
            </div>
            <p className="pricing-card__desc">&quot;Pra agência, escritório ou qualquer um que já cansou de ouvir &apos;semana que vem eu pago&apos;.&quot;</p>
            <p className="pricing-card__includes">15 relatórios &middot; R$ 19,99 por consulta</p>
            <button className="pricing-card__cta" disabled>Em breve</button>
          </div>
        </div>
        <div className="callout callout--info" style={{ maxWidth: '840px', margin: 'var(--primitive-space-8) auto 0' }}>
          <p className="callout__body text-center" style={{ margin: 0, fontStyle: 'italic' }}>
            Sem assinatura. Sem fidelidade. Sem letras miúdas. Irônico, né?
          </p>
        </div>
      </div>
    </section>
  );
}
