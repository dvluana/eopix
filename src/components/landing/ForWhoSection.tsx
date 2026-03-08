import CheckIcon from './illustrations/CheckIcon';
import XIcon from './illustrations/XIcon';
import { CorporateIllustration, FreelancerIllustration } from './illustrations/ForWhoIllustrations';

interface ForWhoSectionProps {
  onCtaClick: () => void;
}

export default function ForWhoSection({ onCtaClick }: ForWhoSectionProps) {
  return (
    <section className="section section--primary" id="pra-quem">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">PRA QUEM É</div>
          <h2 className="section-header__title">
            Quem mais toma calote é quem menos tem <span className="section-header__highlight">defesa</span>.
          </h2>
        </div>

        <div className="grid-2">
          {/* Grandes Empresas */}
          <div className="card card--accent-top">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CorporateIllustration />
            </div>
            <h3 className="card__title">Grandes Empresas</h3>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex align-center gap-3 caption">
                <CheckIcon />
                Serasa Experian
              </div>
              <div className="flex align-center gap-3 caption">
                <CheckIcon />
                Equipes de Compliance
              </div>
              <div className="flex align-center gap-3 caption">
                <CheckIcon />
                Software de R$ 500/mês
              </div>
            </div>
          </div>

          {/* MEI / Freelancer */}
          <div className="card card--danger-top">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <FreelancerIllustration />
            </div>
            <h3 className="card__title">MEI / Freelancer</h3>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex align-center gap-3 caption text-danger">
                <XIcon />
                &quot;Confia&quot;
              </div>
              <div className="flex align-center gap-3 caption text-danger">
                <XIcon />
                Esperança
              </div>
              <div className="flex align-center gap-3 caption text-danger">
                <XIcon />
                Zero Ferramentas
              </div>
            </div>
            <p className="card-footer-divider caption">
              Agora tem. Uma IA que pesquisa por você em 5 bases públicas por R$ 29,90.
            </p>
          </div>
        </div>

        <div className="callout callout--info callout--centered">
          <p className="callout__body">
            &quot;Para comprar carro usado, existe histórico veicular. Para fechar contrato de serviço, só existe a sorte.&quot;
          </p>
        </div>

        <div className="cta-container">
          <button className="btn btn--cta btn--lg" onClick={onCtaClick}>
            Consultar agora
          </button>
        </div>
      </div>
    </section>
  );
}
