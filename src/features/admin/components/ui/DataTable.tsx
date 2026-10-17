import { useMemo, useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => number | string
  /** Show this column's header as a label in the stacked mobile card. Defaults to true. */
  mobileLabel?: boolean
}

interface DataTableProps<T> {
  caption: string
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowActivate?: (row: T) => void
  rowActionLabel?: (row: T) => string
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
}

function DataTable<T>({ caption, columns, rows, getRowKey, onRowActivate, rowActionLabel, defaultSort }: DataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort ?? null)

  const sorted = useMemo(() => {
    const column = sort ? columns.find((item) => item.key === sort.key) : undefined
    if (!sort || !column?.sortValue) return rows
    const valueOf = column.sortValue
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = valueOf(a)
      const right = valueOf(b)
      return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))) * factor
    })
  }, [rows, columns, sort])

  const toggleSort = (key: string) =>
    setSort((current) => (current?.key === key ? { key, direction: current.direction === 'desc' ? 'asc' : 'desc' } : { key, direction: 'desc' }))

  const [primary, ...rest] = columns

  return (
    <>
      <div className="ad-table-wrap hidden md:block">
        <table className="ad-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={column.align === 'right' ? 'is-right' : undefined}
                    aria-sort={active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {column.sortValue ? (
                      <button type="button" className="ad-table__sort" onClick={() => toggleSort(column.key)}>
                        {column.header}
                        <span aria-hidden="true" className="ad-table__sort-icon">{active ? (sort?.direction === 'asc' ? '↑' : '↓') : ''}</span>
                      </button>
                    ) : column.header}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={getRowKey(row)} className={onRowActivate ? 'is-interactive' : undefined}>
                {columns.map((column, index) => (
                  <td key={column.key} className={column.align === 'right' ? 'is-right' : undefined}>
                    {onRowActivate && index === 0 ? (
                      <button type="button" className="ad-table__row-action" onClick={() => onRowActivate(row)} aria-label={rowActionLabel?.(row)}>
                        {column.render(row)}
                      </button>
                    ) : column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="ad-card-list md:hidden" aria-label={caption}>
        {sorted.map((row) => {
          const content = (
            <>
              <div className="ad-card-list__title">{primary?.render(row)}</div>
              <dl className="ad-card-list__fields">
                {rest.map((column) => (
                  <div key={column.key} className="ad-card-list__field">
                    {column.mobileLabel !== false && <dt>{column.header}</dt>}
                    <dd>{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </>
          )
          return (
            <li key={getRowKey(row)} className="ad-card-list__item">
              {onRowActivate ? (
                <button type="button" className="ad-card-list__button" onClick={() => onRowActivate(row)} aria-label={rowActionLabel?.(row)}>{content}</button>
              ) : content}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default DataTable
