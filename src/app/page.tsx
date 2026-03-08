"use client"

import React from 'react';
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer';
import Nav from '@/components/landing/Nav';
import HeroSection from '@/components/landing/HeroSection';
import ImpactStrip from '@/components/landing/ImpactStrip';
import ForWhoSection from '@/components/landing/ForWhoSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ConsultaTimeline from '@/components/landing/ConsultaTimeline';
import PreviewSection from '@/components/landing/PreviewSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FaqSection from '@/components/landing/FaqSection';
import CtaSection from '@/components/landing/CtaSection';
import { maskDocument, cleanDocument } from '@/lib/validators';
import RegisterModal, { type RegisterData } from '@/components/RegisterModal';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [placeholderText, setPlaceholderText] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [documentType, setDocumentType] = React.useState<'cpf' | 'cnpj' | 'unknown'>('unknown');
  const [hasError, setHasError] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState('');
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);

  const fullPlaceholder = 'Digite o CPF ou CNPJ';

  // Check auth on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email || '');
        }
      } catch {
        // not logged in
      }
    };
    checkSession();
  }, []);

  // Typewriter effect
  React.useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (!isDeleting) {
        currentIndex++;
        setPlaceholderText(fullPlaceholder.substring(0, currentIndex));

        if (currentIndex >= fullPlaceholder.length) {
          isDeleting = true;
          timeout = setTimeout(type, 2000); // Pause before deleting
          return;
        }
      } else {
        currentIndex--;
        setPlaceholderText(fullPlaceholder.substring(0, currentIndex));

        if (currentIndex === 0) {
          isDeleting = false;
          timeout = setTimeout(type, 500); // Pause before next text
          return;
        }
      }

      timeout = setTimeout(type, isDeleting ? 30 : 80);
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, []);

  const detectTypeFromLength = (value: string): 'cpf' | 'cnpj' | 'unknown' => {
    const digits = value.replace(/\D/g, '').length;
    if (digits === 11) return 'cpf';
    if (digits === 14) return 'cnpj';
    return 'unknown';
  };

  const getButtonText = () => {
    if (isValidating) return 'Validando...';
    if (documentType === 'cpf') return 'Verificar CPF';
    if (documentType === 'cnpj') return 'Verificar CNPJ';
    return 'Consultar';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDocument(e.target.value);
    setSearchTerm(masked);
    setDocumentType(detectTypeFromLength(masked));
    setSearchError('');
    setHasError(false);
  };

  const scrollToHero = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      setSearchError('Digite um CPF ou CNPJ para consultar');
      setHasError(true);
      return;
    }

    setSearchError('');
    setHasError(false);
    setIsValidating(true);

    try {
      const response = await fetch('/api/search/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: cleanDocument(searchTerm),
        }),
      });

      const data = await response.json();

      if (response.status === 403 && data.blocked) {
        setSearchError('Dados indisponíveis para este documento');
        return;
      }

      if (!response.ok) {
        setSearchError(data.error || 'Documento inválido');
        return;
      }

      // Sucesso: redireciona para a página de consulta com o termo limpo
      router.push(`/consulta/${data.term}`);
    } catch {
      setSearchError('Erro ao validar documento. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleNavLoginSubmit = async (data: RegisterData) => {
    setIsLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro ao fazer login')
      setLoginModalOpen(false)
      router.push('/minhas-consultas')
    } catch (err) {
      throw err
    } finally {
      setIsLoginLoading(false)
    }
  }

  const searchProps = {
    searchTerm,
    placeholderText,
    hasError,
    searchError,
    isValidating,
    onInputChange: handleInputChange,
    onSearch: handleSearch,
    buttonText: getButtonText(),
  };

  return (
    <div>
      <Nav
        userEmail={userEmail}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLoginClick={() => setLoginModalOpen(true)}
      />

      {/* ============================================ */}
      {/* 1. HERO */}
      {/* ============================================ */}
      <main>
        <HeroSection {...searchProps} />

        {/* ============================================ */}
        {/* 2. FAIXA DE IMPACTO */}
        {/* ============================================ */}
        <ImpactStrip />

        {/* ============================================ */}
        {/* 3. PRA QUEM É */}
        {/* ============================================ */}
        <ForWhoSection onCtaClick={scrollToHero} />

        {/* ============================================ */}
        {/* 4. COMO FUNCIONA */}
        {/* ============================================ */}
        <HowItWorksSection onCtaClick={scrollToHero} />

        {/* ============================================ */}
        {/* 5. O QUE CONSULTA */}
        {/* ============================================ */}
        <ConsultaTimeline onCtaClick={scrollToHero} />

        {/* ============================================ */}
        {/* 6. PREVIEW DO RESULTADO */}
        {/* ============================================ */}
        <PreviewSection onCtaClick={scrollToHero} />

        {/* ============================================ */}
        {/* 7. DEPOIMENTOS */}
        {/* ============================================ */}
        <TestimonialsSection />

        {/* ============================================ */}
        {/* 8. PREÇOS */}
        {/* ============================================ */}
        <PricingSection onCtaClick={scrollToHero} />

        {/* ============================================ */}
        {/* 9. FAQ */}
        {/* ============================================ */}
        <FaqSection />

        {/* ============================================ */}
        {/* 10. CTA FINAL */}
        {/* ============================================ */}
        <CtaSection {...searchProps} />
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <Footer />

      <RegisterModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onSubmit={handleNavLoginSubmit}
        isLoading={isLoginLoading}
        initialMode="login"
        hideToggle
      />
    </div>
  );
}
