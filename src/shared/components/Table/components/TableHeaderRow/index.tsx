import { cn } from '@/lib/utils'
import {
    SortableContext,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { type HTMLAttributes, useMemo } from 'react'
import { type HeaderGroup } from '@tanstack/react-table'
import { useTableContext } from '../../hooks/useTableContext'

type TableHeaderRowProps<T> = {
    headerGroup: HeaderGroup<T>
} & HTMLAttributes<HTMLDivElement>

const TableHeaderRow = <T,>({
    className,
    children,
    headerGroup,
    ...props
}: TableHeaderRowProps<T>) => {
    const { table } = useTableContext()

    if (!table) return null

    const columnOrder = useMemo(
        () => table.getState().columnOrder,
        [table.getState()]
    )

    return (
        <div {...props} className={cn('flex border-b', className)}>
            <SortableContext
                id={headerGroup.id}
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
            >
                {children}
            </SortableContext>
        </div>
    )
}

export default TableHeaderRow
