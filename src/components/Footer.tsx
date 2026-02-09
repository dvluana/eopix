'use client';

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from './LogoFundoPreto';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">
        <div className="footer__brand">
          <LogoFundoPreto />
        </div>
        <p className="footer__legal">
          Organizamos informações públicas. Não garantimos veracidade. Não fazemos juízo de valor. Decisão e responsabilidade são sempre do usuário.
          <br/>
          Não é detector de pilantra. É um espelho comercial. Se o reflexo incomodar, o problema não é o espelho.
        </p>
        <ul className="footer__links">
          <li><Link href="/termos" className="footer__link">Termos de uso</Link></li>
          <li><Link href="/privacidade" className="footer__link">Política de privacidade</Link></li>
          <li><a href="mailto:plataforma@somoseopix.com.br" className="footer__link">Contato</a></li>
        </ul>
        <p className="footer__copy">
          © 2026 E o Pix? — Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}