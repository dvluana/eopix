"use client"

import { AlertTriangle } from 'lucide-react';

export default function MaintenanceCallout() {
  return (
    <div style={{
      background: '#FFF0F0',
      borderLeft: '3px solid #CC3333',
      borderRadius: '0 6px 6px 0',
      padding: '16px',
      marginBottom: 'var(--primitive-space-6)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      textAlign: 'left'
    }}>
      <AlertTriangle size={20} color="#CC3333" style={{ flexShrink: 0, marginTop: '2px' }} />
      <p style={{
        fontFamily: 'var(--font-family-body)',
        fontSize: '14px',
        color: '#CC3333',
        margin: 0,
        lineHeight: 1.5
      }}>
        Nossos servidores estão em manutenção. Tente novamente mais tarde.
      </p>
    </div>
  );
}
