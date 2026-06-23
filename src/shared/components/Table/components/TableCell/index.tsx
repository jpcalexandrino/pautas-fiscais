import { cn } from '@/lib/utils'
import { type Cell, flexRender } from '@tanstack/react-table'
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react'
import { type ReactNode } from 'react'

interface CellProps<TData> {
    cell: Cell<TData, any>
    isRowSelected: boolean
}

const TableCell = <T,>({ cell, isRowSelected }: CellProps<T>) => {
    const isGrouped = cell.column.columnDef?.meta?.row?.isGrouped

    const renderContent = (): ReactNode => {
        if (cell.getIsGrouped() || isGrouped) {
            const toggle = cell.row.getToggleExpandedHandler()

            return (
                <div className="flex items-center overflow-hidden">
                    {cell.row.depth !== 0 && !cell.row.getCanExpand() ? (
                        <div className="px-2">
                            <CornerDownRight
                                className="text-neutral-500"
                                size={12}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                toggle()
                            }}
                            className={cn(
                                'px-2 cursor-pointer',
                                isGrouped && cell.row.depth === 0
                                    ? 'text-primary-500'
                                    : ''
                            )}
                        >
                            {cell.row.getIsExpanded() ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                        </button>
                    )}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
            )
        }

        return (
            <div className="flex items-center h-full overflow-hidden text-ellipsis whitespace-nowrap">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
        )
    }

    return (
        <div
            className={cn(
                'flex border-r first-of-type:border-l border-b border-border dark:border-white/15 items-center py-1.5 px-3 w-full text-xs min-h-[44px]',
                isRowSelected ? 'border-transparent' : '',
                cell.column.columnDef.meta?.cell?.className
            )}
            style={{
                width: cell.column.getSize(),
                paddingLeft:
                    cell.getIsGrouped() || isGrouped
                        ? `${cell.row.depth * 2}rem`
                        : '',
            }}
        >
            {renderContent()}
        </div>
    )
}

export default TableCell
