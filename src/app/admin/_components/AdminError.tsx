import { XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminErrorProps {
  message: string
  onRetry?: () => void
}

export function AdminError({ message, onRetry }: AdminErrorProps) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <XCircle size={48} style={{ color: '#ef4444', marginBottom: '16px', margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw size={16} style={{ marginRight: '8px' }} />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
