"use client";

import { useEffect, useRef, useState } from "react";

interface ConsultaTimelineProps {
  onCtaClick: () => void;
}

const TIMELINE_ITEMS = [
  {
    number: 1,
    label: '01',
    title: 'Dados cadastrais do CNPJ',
    description: 'Situação, data de abertura, sócios, CNAE. Direto da Receita Federal.',
  },
  {
    number: 2,
    label: '02',
    title: 'Processos cíveis',
    description: 'Existem? Quantos? De que tipo? A gente mostra, você interpreta.',
  },
  {
    number: 3,
    label: '03',
    title: 'Plataformas de reclamação',
    description: 'Link direto pro Reclame Aqui. A reputação tá lá, a gente só encurta o caminho.',
  },
  {
    number: 4,
    label: '04',
    title: 'Notícias e menções públicas',
    description: 'Se saiu no jornal, a gente encontra. Se saiu no YouTube, também.',
  },
  {
    number: 5,
    label: '05',
    title: 'Busca por nome',
    description: 'Encontrou mais de uma pessoa? A gente agrupa por contexto pra você identificar quem é quem.',
  },
] as const;

const DURATION = 1500;
const STAGGER = 300;

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function ConsultaTimeline({ onCtaClick }: ConsultaTimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [nodeValues, setNodeValues] = useState<string[]>(
    TIMELINE_ITEMS.map(() => '00')
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setHasAnimated(true);

        const start = performance.now();

        function tick(now: number) {
          const elapsed = now - start;
          let allDone = true;

          setNodeValues(
            TIMELINE_ITEMS.map((item, i) => {
              const itemElapsed = elapsed - i * STAGGER;
              if (itemElapsed <= 0) {
                allDone = false;
                return '00';
              }
              const progress = Math.min(itemElapsed / DURATION, 1);
              if (progress < 1) allDone = false;
              const eased = easeOutExpo(progress);
              const val = Math.round(eased * item.number);
              return val.toString().padStart(2, '0');
            })
          );

          if (!allDone) {
            requestAnimationFrame(tick);
          }
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section className="consulta-section" id="consulta" ref={sectionRef}>
      <div className="section-inner">
        <div className="section-header section-header--centered section-header--full-width">
          <div className="section-header__tag section-header__tag--accent">O QUE A GENTE CONSULTA</div>
          <h2 className="section-header__title section-header__title--inverse mb-8">
            Tudo que já era público e você não <span className="section-header__highlight">pesquisou</span>.
          </h2>
        </div>

        <div className="consulta-timeline">
          {TIMELINE_ITEMS.map((item, i) => (
            <div key={item.number} className="consulta-step">
              <div className="consulta-node">{nodeValues[i]}</div>
              <div className="consulta-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="callout callout--info callout--centered-lg">
          <p className="callout__body text-inverse">
            &quot;A gente não acusa, não conclui, não dá nota, não cria score moral e definitivamente não chama ninguém de pilantra. Isso fica por sua conta.&quot;
          </p>
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
