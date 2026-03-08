import { XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminErrorProps {
  message: string
  onRetry?: () => void
}

export function AdminError({ message, onRetry }: AdminErrorProps) {
  return (
    <div className="adm-error">
      <XCircle size={48} className="adm-error__icon" />
      <p className="adm-error__message">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw size={16} style={{ marginRight: '8px' }} />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
