'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, RefreshCw, Search } from 'lucide-react'

interface BlocklistItem {
  id: string
  term: string
  associatedName: string | null
  reason: string
  createdAt: string
}

interface BlocklistData {
  blocklist: BlocklistItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const reasonLabels: Record<string, string> = {
  SOLICITACAO_TITULAR: 'Solicitacao do Titular',
  JUDICIAL: 'Ordem Judicial',
  HOMONIMO: 'Homonimo',
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

export default function BlocklistPage() {
  const [data, setData] = React.useState<BlocklistData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [page, setPage] = React.useState(1)

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [formTerm, setFormTerm] = React.useState('')
  const [formName, setFormName] = React.useState('')
  const [formReason, setFormReason] = React.useState<string>('')
  const [formLoading, setFormLoading] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/blocklist?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching blocklist:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formTerm || !formReason) {
      alert('Preencha todos os campos obrigatorios')
      return
    }

    try {
      setFormLoading(true)
      const res = await fetch('/api/admin/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: formTerm,
          associatedName: formName || undefined,
          reason: formReason,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Erro ao adicionar')
        return
      }

      setIsDialogOpen(false)
      setFormTerm('')
      setFormName('')
      setFormReason('')
      fetchData()
    } catch (err) {
      console.error('Error adding to blocklist:', err)
      alert('Erro ao adicionar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return

    try {
      const res = await fetch(`/api/admin/blocklist/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Erro ao remover')
        return
      }

      fetchData()
    } catch (err) {
      console.error('Error deleting from blocklist:', err)
      alert('Erro ao remover')
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Blocklist
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
            }}
          >
            Documentos bloqueados para consulta
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} style={{ marginRight: '8px' }} />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar a Blocklist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Label htmlFor="term">CPF ou CNPJ *</Label>
                <Input
                  id="term"
                  value={formTerm}
                  onChange={(e) => setFormTerm(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome Associado</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome completo (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="reason">Motivo *</Label>
                <Select value={formReason} onValueChange={setFormReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLICITACAO_TITULAR">Solicitacao do Titular</SelectItem>
                    <SelectItem value="JUDICIAL">Ordem Judicial</SelectItem>
                    <SelectItem value="HOMONIMO">Homonimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card style={{ marginBottom: '16px' }}>
        <CardContent style={{ paddingTop: '16px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por documento ou nome..."
              style={{ flex: 1 }}
            />
            <Button type="submit" variant="secondary">
              <Search size={16} />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {data ? `${data.pagination.total} registros` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw className="animate-spin" size={24} />
            </div>
          ) : data?.blocklist.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '40px' }}>
              Nenhum registro encontrado
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Documento</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Nome</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Motivo</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Data</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.blocklist.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontFamily: 'monospace' }}>{item.term}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{item.associatedName || '-'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge variant="secondary">{reasonLabels[item.reason] || item.reason}</Badge>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{formatDate(item.createdAt)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                Pagina {page} de {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Proxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
