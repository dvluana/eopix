import { ReactNode } from 'react'
import EopixLoader from '@/components/EopixLoader'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
}

interface AdminDataTableProps<T> {
  columns: Column[]
  data: T[]
  renderCell: (row: T, column: Column) => ReactNode
  loading: boolean
  emptyMessage: string
  totalLabel?: string
  mono?: boolean
}

export function AdminDataTable<T>({
  columns,
  data,
  renderCell,
  loading,
  emptyMessage,
  totalLabel,
  mono,
}: AdminDataTableProps<T>) {
  if (loading) {
    return (
      <div className="adm-loading">
        <EopixLoader size="md" />
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="adm-empty">{emptyMessage}</p>
  }

  return (
    <div>
      {totalLabel && <p className="adm-table__total">{totalLabel}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className={`adm-table${mono ? ' adm-table--mono' : ''}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} data-align={col.align}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} data-align={col.align}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
