"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function Page() {
  const router = useRouter();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [protocol, setProtocol] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [tipoSolicitacao, setTipoSolicitacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação de CPF básica
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    // Simplificado - apenas verifica se não é sequência
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    return true;
  };

  // Validação de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Máscara de CPF
  const formatCPF = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      // CPF
      return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ
      return clean
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    if (errors.cpf) {
      setErrors({ ...errors, cpf: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!cpf.trim()) newErrors.cpf = 'CPF/CNPJ é obrigatório';
    else if (!validateCPF(cpf)) newErrors.cpf = 'CPF inválido. Verifique os dígitos.';
    if (!email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!validateEmail(email)) newErrors.email = 'E-mail inválido';
    if (!tipoSolicitacao) newErrors.tipo = 'Selecione um tipo de solicitação';
    if (!descricao.trim() || descricao.trim().length < 20) {
      newErrors.descricao = 'Descreva sua solicitação com pelo menos 20 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Enviar para backend ou Tally
    // Gerar protocolo
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    setProtocol(`LGPD-${year}-${randomNum}`);
    setFormSubmitted(true);
  };

  const handleVoltarInicio = () => {
    router.push('/');
  };

  if (formSubmitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EFEB' }}>
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            background: 'rgba(26, 26, 26, 0.97)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '32px',
            paddingRight: '32px',
            zIndex: 1000,
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <LogoFundoPreto />
          </Link>
        </nav>

        <main
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            paddingTop: 'calc(64px + 40px)',
            paddingBottom: '60px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--primitive-white)',
              border: '1px solid #E8E7E3',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#66CC66',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '28px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Solicitação enviada!
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: '0 0 16px 0',
              }}
            >
              Recebemos sua solicitação e responderemos em até 15 dias úteis para{' '}
              <strong>{email}</strong>.
            </p>

            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 32px 0',
              }}
            >
              Protocolo: #{protocol}
            </p>

            <button
              type="button"
              onClick={handleVoltarInicio}
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1A1A1A',
                background: 'transparent',
                border: '2px solid #1A1A1A',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1A1A1A';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#1A1A1A';
              }}
            >
              Voltar para o início
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EFEB' }}>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(26, 26, 26, 0.97)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '32px',
          paddingRight: '32px',
          zIndex: 1000,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <LogoFundoPreto />
        </Link>
      </nav>

      <main
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          paddingTop: 'calc(64px + 40px)',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--primitive-white)',
            border: '1px solid #E8E7E3',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '48px',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '0 0 16px 0',
            }}
          >
            Seus Direitos como Titular
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: '#666666',
              lineHeight: 1.7,
              margin: '0 0 24px 0',
            }}
          >
            Se você foi consultado e deseja solicitar exclusão dos seus dados, corrigir
            informações ou informar erro de homônimo, preencha o formulário abaixo.
            Responderemos em até 15 dias úteis.
          </p>

          <div
            style={{
              background: '#F0EFEB',
              borderLeft: '3px solid #FFD600',
              padding: '16px',
              marginBottom: '32px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: '#666666',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Você não precisa ter sido cliente para exercer seus direitos. Se alguém
              consultou seu CPF/CNPJ, você pode solicitar a exclusão dos dados do relatório.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="nome"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: '#888888',
                  marginBottom: '8px',
                }}
              >
                Nome completo
              </label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (errors.nome) setErrors({ ...errors, nome: '' });
                }}
                placeholder="Seu nome completo"
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  background: 'var(--primitive-white)',
                  border: errors.nome ? '2px solid #CC3333' : '2px solid #1A1A1A',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errors.nome && (
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: '#CC3333',
                    margin: '4px 0 0 0',
                  }}
                >
                  {errors.nome}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="cpf"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: '#888888',
                  marginBottom: '8px',
                }}
              >
                CPF ou CNPJ consultado
              </label>
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={18}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  background: 'var(--primitive-white)',
                  border: errors.cpf ? '2px solid #CC3333' : '2px solid #1A1A1A',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errors.cpf && (
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: '#CC3333',
                    margin: '4px 0 0 0',
                  }}
                >
                  {errors.cpf}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: '#888888',
                  marginBottom: '8px',
                }}
              >
                E-mail para resposta
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  background: 'var(--primitive-white)',
                  border: errors.email ? '2px solid #CC3333' : '2px solid #1A1A1A',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errors.email && (
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: '#CC3333',
                    margin: '4px 0 0 0',
                  }}
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: '#888888',
                  marginBottom: '12px',
                }}
              >
                O que deseja solicitar?
              </label>

              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="exclusao"
                    checked={tipoSolicitacao === 'exclusao'}
                    onChange={(e) => {
                      setTipoSolicitacao(e.target.value);
                      if (errors.tipo) setErrors({ ...errors, tipo: '' });
                    }}
                    style={{
                      marginTop: '2px',
                      marginRight: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        marginBottom: '4px',
                      }}
                    >
                      Exclusão dos meus dados
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: '#888888',
                      }}
                    >
                      Quero que removam todas as informações vinculadas ao meu CPF/CNPJ
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="correcao"
                    checked={tipoSolicitacao === 'correcao'}
                    onChange={(e) => {
                      setTipoSolicitacao(e.target.value);
                      if (errors.tipo) setErrors({ ...errors, tipo: '' });
                    }}
                    style={{
                      marginTop: '2px',
                      marginRight: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        marginBottom: '4px',
                      }}
                    >
                      Correção de dados
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: '#888888',
                      }}
                    >
                      Há informações incorretas no relatório gerado sobre mim
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="homonimo"
                    checked={tipoSolicitacao === 'homonimo'}
                    onChange={(e) => {
                      setTipoSolicitacao(e.target.value);
                      if (errors.tipo) setErrors({ ...errors, tipo: '' });
                    }}
                    style={{
                      marginTop: '2px',
                      marginRight: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        marginBottom: '4px',
                      }}
                    >
                      Homônimo
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: '#888888',
                      }}
                    >
                      Os dados exibidos não são meus, são de outra pessoa com nome semelhante
                    </div>
                  </div>
                </label>
              </div>

              {errors.tipo && (
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: '#CC3333',
                    margin: '4px 0 0 0',
                  }}
                >
                  {errors.tipo}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label
                htmlFor="descricao"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: '#888888',
                  marginBottom: '8px',
                }}
              >
                Descreva sua solicitação
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => {
                  setDescricao(e.target.value);
                  if (errors.descricao) setErrors({ ...errors, descricao: '' });
                }}
                placeholder="Explique o que precisa ser corrigido ou removido..."
                rows={4}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  background: 'var(--primitive-white)',
                  border: errors.descricao ? '2px solid #CC3333' : '2px solid #1A1A1A',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              {errors.descricao && (
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: '#CC3333',
                    margin: '4px 0 0 0',
                  }}
                >
                  {errors.descricao}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                fontWeight: 700,
                color: '#1A1A1A',
                background: '#FFD600',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E6C000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFD600';
              }}
            >
              Enviar solicitação
            </button>
          </form>

          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid #E8E7E3',
              marginTop: '32px',
            }}
          >
            <Link
              href="/privacidade"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: '#1A1A1A',
                textDecoration: 'underline',
              }}
            >
              ← Política de Privacidade
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
