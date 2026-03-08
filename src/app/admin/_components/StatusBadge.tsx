const config: Record<string, { className: string; label: string }> = {
  COMPLETED: { className: 'adm-badge adm-badge--completed', label: 'Concluido' },
  PROCESSING: { className: 'adm-badge adm-badge--processing', label: 'Processando' },
  PAID: { className: 'adm-badge adm-badge--paid', label: 'Pago' },
  PENDING: { className: 'adm-badge adm-badge--pending', label: 'Pendente' },
  FAILED: { className: 'adm-badge adm-badge--failed', label: 'Falhou' },
  REFUNDED: { className: 'adm-badge adm-badge--refunded', label: 'Reembolsado' },
  REFUND_FAILED: { className: 'adm-badge adm-badge--failed', label: 'Reembolso Falhou' },
}

export function StatusBadge({ status }: { status: string }) {
  const { className, label } = config[status] || { className: 'adm-badge adm-badge--pending', label: status }
  return <span className={className}>{label}</span>
}
