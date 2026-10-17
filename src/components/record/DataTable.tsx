import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyText?: string
  caption?: string
  className?: string
}

/** Accessible, horizontally scrollable table for review queues and logs. */
export function DataTable<T>({ columns, rows, rowKey, emptyText = 'No entries.', caption, className }: DataTableProps<T>) {
  return (
    <div className={cn('gl-table-wrap', className)}>
      <table className="gl-table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-[var(--gl-text-muted)]">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
