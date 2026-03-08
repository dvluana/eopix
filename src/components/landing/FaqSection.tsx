"use client"

import React from 'react';

const FAQ_ITEMS = [
  {
    question: 'Vocês são detetive particular?',
    answer: 'Não. A gente organiza informação pública que já existe na internet. O Google faz isso de graça, a gente só faz melhor e mais rápido.'
  },
  {
    question: 'Como a IA gera o resumo?',
    answer: 'Nossa inteligência artificial lê todos os dados encontrados e gera um resumo factual em linguagem clara. Ela não dá opinião, não acusa ninguém e não inventa dados. Só resume o que é público.'
  },
  {
    question: 'Posso processar alguém com base no relatório?',
    answer: 'A gente é espelho, não advogado. O relatório mostra fontes públicas. O que você faz com isso é responsabilidade sua. Pra ações legais, consulte um advogado de verdade.'
  },
  {
    question: 'E se o relatório não encontrar nada?',
    answer: 'Ótimo! Mas a gente não é vidente. Não encontrar nada não é a mesma coisa que garantir que tá tudo bem. Reforce o contrato mesmo assim.'
  },
  {
    question: 'Vocês guardam os dados de quem eu pesquiso?',
    answer: 'Não. Cada consulta é ao vivo. A gente não monta perfil permanente de ninguém. Consultou, recebeu, acabou.'
  },
  {
    question: 'Posso pesquisar meu próprio nome?',
    answer: 'Pode e deveria. Melhor você descobrir o que tá público do que seu próximo cliente descobrir primeiro.'
  },
  {
    question: 'Vocês chamam alguém de pilantra?',
    answer: 'Jamais. A gente só mostra informação pública com fonte. Se o reflexo incomodar, o problema não é o espelho.'
  }
];

export default function FaqSection() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="section section--secondary" id="faq">
      <div className="section-inner">
        <div className="section-header section-header--centered-full">
          <div className="section-header__tag section-header__tag--muted">FAQ</div>
          <h2 className="section-header__title section-header__title--auto-margin">
            Perguntas que você deveria ter feito antes do <span className="section-header__highlight">contrato</span>.
          </h2>
        </div>

        <div className="faq-container">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`faq ${openFaq === i ? 'faq--open' : ''}`}>
              <button
                className="faq__question"
                onClick={() => toggleFaq(i)}
                aria-expanded={openFaq === i}
              >
                {item.question}
              </button>
              <div className="faq__answer">
                <p className="faq__answer-text">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
