"use client"

import SearchBar from './SearchBar';

interface CtaSectionProps {
  searchTerm: string;
  placeholderText: string;
  hasError: boolean;
  searchError: string;
  isValidating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  buttonText: string;
}

export default function CtaSection(props: CtaSectionProps) {
  return (
    <section className="cta-final">
      <div className="cta-final__pattern" aria-hidden="true" />
      <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
        <p className="cta-final__eyebrow">Última chamada</p>
        <h2 className="display-lg text-inverse mb-4">
          Contrato reforçado custa R$ 39,90.<br/>
          <em className="text-accent-em">Processo custa sua paz.</em>
        </h2>

        <SearchBar {...props} style={{ marginTop: '40px' }} />

        <p className="cta-final__tagline">
          &quot;Não é fofoca. É fonte.&quot;
        </p>
      </div>
    </section>
  );
}
