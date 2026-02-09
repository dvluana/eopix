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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

  // Mapeia os valores do form para os tipos do backend
  const tipoMap: Record<string, string> = {
    'exclusao': 'EXCLUSAO',
    'correcao': 'CORRECAO',
    'homonimo': 'EXCLUSAO', // Homônimo é tratado como exclusão com descrição específica
    'acesso': 'ACESSO',
    'oposicao': 'OPOSICAO',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

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

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/lgpd-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          cpfCnpj: cpf,
          email: email.trim(),
          tipo: tipoMap[tipoSolicitacao] || 'EXCLUSAO',
          descricao: tipoSolicitacao === 'homonimo'
            ? `[HOMÔNIMO] ${descricao.trim()}`
            : descricao.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar solicitação');
      }

      setProtocol(data.protocol);
      setFormSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoltarInicio = () => {
    router.push('/');
  };

  if (formSubmitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
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
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border-subtle)',
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
                background: 'var(--color-status-success)',
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
                color: 'var(--color-text-primary)',
                margin: '0 0 16px 0',
              }}
            >
              Solicitação enviada!
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
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
                color: 'var(--color-text-primary)',
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
                color: 'var(--color-text-primary)',
                background: 'transparent',
                border: '2px solid var(--color-text-primary)',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-inverse)';
                e.currentTarget.style.color = 'var(--color-text-inverse)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-primary)';
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
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
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-subtle)',
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
              color: 'var(--color-text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Direitos do Titular
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 24px 0',
            }}
          >
            Última atualização: Fevereiro 2026
          </p>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              margin: '0 0 24px 0',
            }}
          >
            Se você foi consultado no E O PIX? e deseja solicitar exclusão dos seus dados, corrigir
            informações ou informar erro de homônimo, preencha o formulário abaixo.{' '}
            <strong>Responderemos em até 15 dias úteis.</strong> Em casos de maior complexidade,
            o prazo poderá ser estendido mediante comunicação fundamentada.
          </p>

          <div
            style={{
              background: 'var(--color-bg-secondary)',
              borderLeft: '3px solid var(--color-border-accent)',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Você <strong>não precisa ter sido cliente</strong> para exercer seus direitos. Se alguém
              consultou seu CPF ou CNPJ, você pode solicitar a exclusão dos dados do relatório e o
              bloqueio de consultas futuras.
            </p>
          </div>

          {/* Seção: Verificação de Identidade */}
          <div style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Verificação de Identidade
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Para proteger seus dados contra solicitações indevidas feitas por terceiros,{' '}
              <strong>poderemos solicitar comprovação de identidade</strong> antes de processar
              seu pedido. Isso pode incluir confirmação de dados como CPF, data de nascimento ou
              outro dado que permita confirmar que você é o titular dos dados em questão.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              A verificação é feita exclusivamente para sua proteção e os dados serão utilizados
              apenas para validar a solicitação.
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
                  color: 'var(--color-text-tertiary)',
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
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)',
                  border: errors.nome ? '2px solid var(--color-status-error)' : '2px solid var(--color-text-primary)',
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
                    color: 'var(--color-status-error)',
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
                  color: 'var(--color-text-tertiary)',
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
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)',
                  border: errors.cpf ? '2px solid var(--color-status-error)' : '2px solid var(--color-text-primary)',
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
                    color: 'var(--color-status-error)',
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
                  color: 'var(--color-text-tertiary)',
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
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)',
                  border: errors.email ? '2px solid var(--color-status-error)' : '2px solid var(--color-text-primary)',
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
                    color: 'var(--color-status-error)',
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
                  color: 'var(--color-text-tertiary)',
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
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      Exclusão dos meus dados
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      Quero que removam todas as informações vinculadas ao meu CPF/CNPJ e que
                      futuras consultas sejam bloqueadas.
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
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      Correção de dados
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
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
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      Homônimo
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      Os dados exibidos não são meus, são de outra pessoa com nome semelhante
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
                    value="acesso"
                    checked={tipoSolicitacao === 'acesso'}
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
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      Acesso aos dados
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      Quero saber quais dados vocês possuem sobre mim.
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
                    value="oposicao"
                    checked={tipoSolicitacao === 'oposicao'}
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
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      Oposição ao tratamento
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      Quero me opor ao tratamento dos meus dados por este serviço.
                    </div>
                  </div>
                </label>
              </div>

              {errors.tipo && (
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: 'var(--color-status-error)',
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
                  color: 'var(--color-text-tertiary)',
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
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)',
                  border: errors.descricao ? '2px solid var(--color-status-error)' : '2px solid var(--color-text-primary)',
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
                    color: 'var(--color-status-error)',
                    margin: '4px 0 0 0',
                  }}
                >
                  {errors.descricao}
                </p>
              )}
            </div>

            {submitError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-status-error)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '14px',
                    color: 'var(--color-status-error)',
                    margin: 0,
                  }}
                >
                  {submitError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-accent)',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.filter = 'brightness(0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>

          {/* Seção: O Que Acontece Após a Solicitação */}
          <div
            style={{
              marginTop: '40px',
              paddingTop: '32px',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 20px 0',
              }}
            >
              O Que Acontece Após a Solicitação
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 8px 0',
                }}
              >
                Exclusão e bloqueio
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                CPF/CNPJ adicionado à Blocklist, relatórios existentes serão excluídos, futuras
                consultas bloqueadas com mensagem &ldquo;Dados indisponíveis por solicitação do titular.&rdquo;
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 8px 0',
                }}
              >
                Correção
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Análise da informação; se erro da fonte, orientação para correção na fonte; se erro
                interno, correção feita.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 8px 0',
                }}
              >
                Homônimo
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Nome associado ao bloqueio para filtragem em futuras consultas.
              </p>
            </div>

            <div style={{ marginBottom: '0' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 8px 0',
                }}
              >
                Acesso
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Informação sobre dados possuídos, quando coletados e quando serão eliminados.
              </p>
            </div>
          </div>

          {/* Seção: Canais Alternativos */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Se preferir, você também pode exercer seus direitos pelo e-mail:{' '}
              <strong>plataforma@somoseopix.com.br</strong>
            </p>
          </div>

          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)',
              marginTop: '24px',
            }}
          >
            <Link
              href="/privacidade"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
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
