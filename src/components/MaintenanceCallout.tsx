"use client"

import { AlertTriangle } from 'lucide-react';

export default function MaintenanceCallout() {
  return (
    <div style={{
      background: 'var(--color-status-error-bg)',
      borderLeft: '3px solid var(--color-status-error)',
      borderRadius: '0 6px 6px 0',
      padding: '16px',
      marginBottom: 'var(--primitive-space-6)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      textAlign: 'left'
    }}>
      <AlertTriangle size={20} style={{ color: 'var(--color-status-error)', flexShrink: 0, marginTop: '2px' }} />
      <p style={{
        fontFamily: 'var(--font-family-body)',
        fontSize: '14px',
        color: 'var(--color-status-error)',
        margin: 0,
        lineHeight: 1.5
      }}>
        Nossos servidores estão em manutenção. Tente novamente mais tarde.
      </p>
    </div>
  );
}
