"use client"

import React from 'react';

const TESTIMONIALS = [
  { emoji: '💀', quote: 'Pesquisei depois do calote. Tava tudo lá. TUDO.', author: 'Designer freelancer, SP' },
  { emoji: '🎤', quote: 'Ele mandou áudio de 7 minutos explicando por que ia atrasar o pagamento. Eu devia ter consultado antes.', author: 'Dev backend, RJ' },
  { emoji: '🤡', quote: 'A empresa tinha 47 processos. QUARENTA E SETE. E eu aceitei cheque.', author: 'Dono de agência, MG' },
  { emoji: '🙏', quote: 'O cara me disse "confia". Agora eu confio no E o Pix.', author: 'Social media, PR' },
  { emoji: '😴', quote: 'Minha mãe falou: pesquisa antes. Eu não ouvi. Agora pago R$ 39,90 por consulta e durmo em paz.', author: 'Arquiteta, SC' },
  { emoji: '📅', quote: 'Ele disse que pagava na sexta. Estamos em março. A sexta era de novembro.', author: 'Fotógrafo, CE' },
  { emoji: '📰', quote: 'Fui a consulta e apareceu até matéria no jornal. O Google que eu deveria ter feito.', author: 'Consultora de RH, DF' },
  { emoji: '⚖️', quote: 'Descobri que meu fornecedor tinha mais processo que cliente. Obrigada, E o Pix.', author: 'Dona de e-commerce, BA' },
];

const CARD_STYLES = [
  { bg: '#FFFDE6', rotate: '-1deg' },
  { bg: '#E8F0FE', rotate: '0.5deg' },
  { bg: '#FFF0E6', rotate: '-0.5deg' },
  { bg: '#E6F7EE', rotate: '1deg' },
  { bg: '#FEF3E2', rotate: '0deg' },
  { bg: '#F0EEFF', rotate: '-1.5deg' },
  { bg: '#FDEEF0', rotate: '0.8deg' },
  { bg: '#E6F4FE', rotate: '-0.8deg' },
];

export default function TestimonialsSection() {
  const [paused, setPaused] = React.useState(false);

  // Duplicate items for seamless infinite loop
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="section section--secondary section--relative" id="depoimentos">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">DEPOIMENTOS</div>
          <h2 className="section-header__title">
            Gente que pesquisou. E gente que deveria ter <span className="section-header__highlight">pesquisado</span>.
          </h2>
        </div>

        <div
          className="carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={`carousel__track${paused ? ' carousel__track--paused' : ''}`}>
            {items.map((t, i) => {
              const style = CARD_STYLES[i % CARD_STYLES.length];
              return (
                <div
                  key={i}
                  className="carousel__card depo-card"
                  style={{
                    background: style.bg,
                    transform: `rotate(${style.rotate})`,
                  }}
                >
                  <span className="depo-card__sticker">{t.emoji}</span>
                  <p className="depo-card__quote">&ldquo;{t.quote}&rdquo;</p>
                  <p className="depo-card__author">&mdash; {t.author}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
