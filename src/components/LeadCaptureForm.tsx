"use client"

import React, { useState } from 'react';

export default function LeadCaptureForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reason: 'MAINTENANCE',
        }),
      });

      if (!res.ok) throw new Error('Erro ao enviar');
      setSubmitted(true);
    } catch {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        background: 'hsl(var(--success-bg))',
        border: '1px solid hsl(var(--success))',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: 'var(--primitive-space-6)',
        textAlign: 'center'
      }}>
        <p style={{
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          color: 'hsl(var(--success))',
          margin: 0,
          fontWeight: 500
        }}>
          ✓ Recebemos! Avisaremos quando voltar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: 'var(--primitive-space-6)',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={isSubmitting}
          style={{
            width: '240px',
            padding: '12px 16px',
            border: '1px solid var(--color-border-default)',
            borderRadius: '6px',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            outline: 'none',
            opacity: isSubmitting ? 0.7 : 1
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-default)';
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            borderRadius: '6px',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isSubmitting ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = 'var(--color-bg-subtle)';
              e.currentTarget.style.borderColor = 'var(--color-border-accent)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border-default)';
          }}
        >
          {isSubmitting ? 'Enviando...' : 'Avisar-me'}
        </button>
      </div>
      {error && (
        <p style={{
          fontFamily: 'var(--font-family-body)',
          fontSize: '13px',
          color: 'hsl(var(--error))',
          margin: 0
        }}>
          {error}
        </p>
      )}
    </form>
  );
}
