import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef, useCallback } from 'react'
import type { Cell, Row } from '@tanstack/react-table'
import TableRow from '../TableRow'
import TableCell from '../TableCell'
import type { TableProps } from '../../type'
import { useTableContext } from '../../hooks/useTableContext'

type TableBodyProps = HTMLAttributes<HTMLDivElement> & {
    rowEstimateSize?: number
    onRowClick?: TableProps<any>['onRowClick']
}

const TableBody = forwardRef<HTMLDivElement, TableBodyProps>(
    ({ rowEstimateSize, className, onRowClick, ...props }, ref) => {
        const { table, rowVirtualizer } = useTableContext()

        if (!table) return null

        const tableBodyHeight = rowVirtualizer.getTotalSize()
        const tableRows = table.getRowModel().rows
        const virtualRows = rowVirtualizer.getVirtualItems()

        const handleRowClick = useCallback(
            (row: Row<any>) => {
                if (onRowClick) onRowClick({ row })
            },
            [onRowClick]
        )

        const getRef = useCallback(
            (node: HTMLDivElement) => rowVirtualizer.measureElement(node),
            []
        )

        return (
            <div
                {...props}
                style={{
                    height: `${tableBodyHeight}px`,
                }}
                className={cn('relative', className)}
                ref={ref}
            >
                {virtualRows.map((item) => {
                    const row = tableRows[item.index]
                    const visibleCells = row.getVisibleCells()

                    return (
                        <TableRow
                            ref={getRef}
                            data-index={item.index}
                            {...{
                                style: {
                                    height: rowEstimateSize
                                        ? `${rowEstimateSize}px`
                                        : undefined,
                                    transform: `translateY(${item.start}px)`,
                                    position: 'absolute',
                                },
                            }}
                            key={row.id}
                            onClick={() => {
                                handleRowClick(row)
                            }}
                        >
                            {visibleCells.map((cell) => {
                                return (
                                    <TableCell
                                        key={cell.id}
                                        cell={cell as Cell<any, any>}
                                    />
                                )
                            })}
                        </TableRow>
                    )
                })}
            </div>
        )
    }
)

export default TableBody
