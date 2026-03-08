'use client'

import React from 'react'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Search } from 'lucide-react'
import { useToast } from '../../_components/Toast'
import { AdminPageHeader } from '../../_components/AdminPageHeader'
import { AdminFilterBar } from '../../_components/AdminFilterBar'
import { AdminDataTable, Column } from '../../_components/AdminDataTable'
import { AdminPagination } from '../../_components/AdminPagination'
import { AdminError } from '../../_components/AdminError'
import { formatDateShort } from '../../_components/admin-utils'

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
  SOLICITACAO_TITULAR: 'Solicitação do Titular',
  JUDICIAL: 'Ordem Judicial',
  HOMONIMO: 'Homônimo',
}

const columns: Column[] = [
  { key: 'term', label: 'Documento' },
  { key: 'name', label: 'Nome' },
  { key: 'reason', label: 'Motivo' },
  { key: 'date', label: 'Data' },
  { key: 'actions', label: 'Acoes', align: 'right' },
]

export default function BlocklistPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState<BlocklistData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [deleteItem, setDeleteItem] = React.useState<BlocklistItem | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

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
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      console.error('Error fetching blocklist:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formTerm || !formReason) {
      toast({ type: 'error', message: 'Preencha todos os campos obrigatorios' })
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
        toast({ type: 'error', message: error.error || 'Erro ao adicionar' })
        return
      }

      setIsDialogOpen(false)
      setFormTerm('')
      setFormName('')
      setFormReason('')
      fetchData()
    } catch (err) {
      console.error('Error adding to blocklist:', err)
      toast({ type: 'error', message: 'Erro ao adicionar' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/admin/blocklist/${deleteItem.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        toast({ type: 'error', message: error.error || 'Erro ao remover' })
        return
      }

      setDeleteItem(null)
      toast({ type: 'success', message: 'Item removido da blocklist' })
      fetchData()
    } catch (err) {
      console.error('Error deleting from blocklist:', err)
      toast({ type: 'error', message: 'Erro ao remover' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const renderCell = (item: BlocklistItem, col: Column) => {
    switch (col.key) {
      case 'term': return item.term
      case 'name': return item.associatedName || '-'
      case 'reason': return (
        <span className="adm-badge adm-badge--pending">
          {reasonLabels[item.reason] || item.reason}
        </span>
      )
      case 'date': return formatDateShort(item.createdAt)
      case 'actions': return (
        <Button variant="ghost" size="sm" onClick={() => setDeleteItem(item)}>
          <Trash2 size={16} />
        </Button>
      )
      default: return null
    }
  }

  if (error && !data) {
    return (
      <div>
        <AdminPageHeader title="Blocklist" subtitle="Documentos bloqueados para consulta" />
        <AdminError message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Blocklist" subtitle="Documentos bloqueados para consulta">
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
                    <SelectItem value="SOLICITACAO_TITULAR">Solicitação do Titular</SelectItem>
                    <SelectItem value="JUDICIAL">Ordem Judicial</SelectItem>
                    <SelectItem value="HOMONIMO">Homônimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <AdminFilterBar onSubmit={handleSearch}>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por documento ou nome..."
          style={{ flex: 1 }}
        />
        <Button type="submit" variant="secondary">
          <Search size={16} />
        </Button>
      </AdminFilterBar>

      <div className="adm-card">
        <div className="adm-card__header">
          <p className="adm-card__title">
            {data ? `${data.pagination.total} registros` : 'Carregando...'}
          </p>
        </div>
        <div className="adm-card__body">
          <AdminDataTable<BlocklistItem>
            columns={columns}
            data={data?.blocklist ?? []}
            renderCell={renderCell}
            loading={loading}
            emptyMessage="Nenhum registro encontrado"
            mono
          />
          {data && (
            <AdminPagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {deleteItem?.term} da blocklist?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
