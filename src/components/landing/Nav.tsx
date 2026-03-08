"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import UserNav from '@/components/UserNav';

interface NavProps {
  userEmail: string;
  isAdmin?: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onLoginClick?: () => void;
}

export default function Nav({ userEmail, isAdmin, mobileMenuOpen, setMobileMenuOpen, onLoginClick }: NavProps) {
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="nav" aria-label="Menu principal">
      <div className="nav__inner">
        <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
          <LogoFundoPreto />
        </Link>

        <button
          className="nav__hamburger"
          aria-label="Abrir menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
          <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
          <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
        </button>

        <ul className={`nav__links ${mobileMenuOpen ? 'nav__links--open' : ''}`} role="navigation">
          <li><a href="#como-funciona" className="nav__link" onClick={closeMobileMenu}>Como funciona</a></li>
          <li><a href="#consulta" className="nav__link" onClick={closeMobileMenu}>O que consulta</a></li>
          <li><a href="#precos" className="nav__link" onClick={closeMobileMenu}>Preços</a></li>
          <li><a href="#faq" className="nav__link" onClick={closeMobileMenu}>FAQ</a></li>
          {!userEmail && (
            <li onClick={closeMobileMenu}>
              <UserNav
                email={userEmail}
                isAdmin={isAdmin}
                onLoginClick={onLoginClick}
              />
            </li>
          )}
        </ul>

        {userEmail && (
          <UserNav
            email={userEmail}
            isAdmin={isAdmin}
            onLoginClick={onLoginClick}
          />
        )}
      </div>
    </nav>
  );
}
