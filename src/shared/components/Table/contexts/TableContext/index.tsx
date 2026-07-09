import { createContext, useCallback, useMemo } from 'react'
import { type Table } from '@tanstack/react-table'
import { type DragEndEvent, useDndMonitor } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Virtualizer } from '@tanstack/react-virtual'

export type TableContextType<T> = {
    table: Table<T>
    rowVirtualizer: Virtualizer<HTMLDivElement, Element>
}

type TableContextProps<T> = {
    children: React.ReactNode
    table: Table<T>
    rowVirtualizer: Virtualizer<HTMLDivElement, Element>
}

export const TableContext = createContext<TableContextType<any>>(
    {} as TableContextType<any>
)

TableContext.displayName = 'TableContext'

export const TableContextProvider = <T,>({
    children,
    table,
    rowVirtualizer,
}: TableContextProps<T>) => {
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
            table?.setColumnOrder((order) => {
                const oldIndex = order.indexOf(active.id as string)
                const newIndex = order.indexOf(over.id as string)
                return arrayMove(order, oldIndex, newIndex)
            })
        }
    }, [])

    useDndMonitor({
        onDragEnd: handleDragEnd,
    })

    const contextValue = useMemo(
        () => ({
            table,
            rowVirtualizer,
        }),
        []
    )

    return (
        <TableContext.Provider value={contextValue}>
            {children}
        </TableContext.Provider>
    )
}
