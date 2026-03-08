import { CadastralIcon, ProcessosIcon, ReclameIcon, NoticiasIcon, ResumoIcon, ClimaIcon } from './illustrations/FeatureIcons';

interface PreviewSectionProps {
  onCtaClick: () => void;
}

const FEATURES = [
  {
    icon: <ResumoIcon />,
    title: 'Resumo inteligente',
    desc: 'Cruza 5 bases públicas, filtra homônimos e resume tudo em um parágrafo. 47 processos, 12 reclamações — você entende em 30 segundos.',
  },
  {
    icon: <CadastralIcon />,
    title: 'Dados cadastrais oficiais',
    desc: 'CNPJ, razão social, situação, data de abertura, endereço e quadro societário. Direto da Receita Federal.',
  },
  {
    icon: <ProcessosIcon />,
    title: 'Processos judiciais',
    desc: 'Quantidade e tipo de processos cíveis encontrados nos tribunais. Você interpreta, a gente só mostra.',
  },
  {
    icon: <ReclameIcon />,
    title: 'Reclame Aqui',
    desc: 'Link direto pro perfil. Se tiver reclamação, você vê quantas e do quê.',
  },
  {
    icon: <NoticiasIcon />,
    title: 'Notícias e menções',
    desc: 'Matérias e menções em portais de notícias. Com data, título e link pra fonte.',
  },
  {
    icon: <ClimaIcon />,
    title: 'Indicador de clima',
    desc: 'Céu limpo ou clima instável. Uma leitura visual instantânea do risco.',
  },
];

export default function PreviewSection({ onCtaClick }: PreviewSectionProps) {
  return (
    <section className="preview-section section section--primary" id="preview">
      <div className="section-inner">
        <div className="section-header section-header--centered">
          <div className="section-header__tag section-header__tag--muted">O QUE VOCÊ RECEBE</div>
          <h2 className="section-header__title mx-auto">
            Um relatório completo em <span className="section-header__highlight">3 minutos</span>.
          </h2>
          <p className="body text-muted preview-section__subtitle">
            Tudo numa única tela. Sem juridiquês, sem planilha, sem precisar abrir 15 abas no navegador.
          </p>
        </div>

        <div className="bento-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card card--accent-top"
            >
              <div className="preview-icon preview-icon--lg">
                {f.icon}
              </div>
              <h3 className="body font-bold mb-3">{f.title}</h3>
              <p className="caption text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="cta-container">
          <button className="btn btn--cta btn--lg" onClick={onCtaClick}>
            Fazer minha primeira consulta
          </button>
        </div>
      </div>
    </section>
  );
}
