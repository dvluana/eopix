import { Badge } from '@/components/ui/badge'

const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  COMPLETED: { variant: 'default', label: 'Concluido' },
  PROCESSING: { variant: 'secondary', label: 'Processando' },
  PAID: { variant: 'secondary', label: 'Pago' },
  PENDING: { variant: 'outline', label: 'Pendente' },
  FAILED: { variant: 'destructive', label: 'Falhou' },
  REFUNDED: { variant: 'destructive', label: 'Reembolsado' },
  REFUND_FAILED: { variant: 'destructive', label: 'Reembolso Falhou' },
}

export function StatusBadge({ status }: { status: string }) {
  const { variant, label } = config[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={variant}>{label}</Badge>
}
