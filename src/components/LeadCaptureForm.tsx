"use client"

import React, { useState } from 'react';

export default function LeadCaptureForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // TODO: Integração real com backend para captura de lead
    console.log('Lead captured:', email);
    setSubmitted(true);
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
      gap: '8px',
      marginBottom: 'var(--primitive-space-6)',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        style={{
          width: '240px',
          padding: '12px 16px',
          border: '1px solid var(--color-border-default)',
          borderRadius: '6px',
          background: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          outline: 'none'
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
        style={{
          padding: '12px 20px',
          background: 'transparent',
          border: '1px solid var(--color-border-default)',
          borderRadius: '6px',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-subtle)';
          e.currentTarget.style.borderColor = 'var(--color-border-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
        }}
      >
        Avisar-me
      </button>
    </form>
  );
}
