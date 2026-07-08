import {
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnOrderState,
    type ExpandedState,
    type Row,
    type RowData,
    type RowSelectionState,
    type SortingState,
    type Table as TTable,
    type TableState,
    type VisibilityState,
    type ColumnPinningState,
    getCoreRowModel,
    getExpandedRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { DataPagination } from './components/DataPagination'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import TopMessage from './components/TopMessage'
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import TableSettings from './components/TableSettings'
import TableHeader from './components/TableColumnHeader'
import TableCell from './components/TableCell'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export type RowSelection<TData> = {
    rowIds: Record<string, boolean>
    originalRows: (TData & TableCustomData<TData>)[]
}

export type OnSelectionRowChange<TData> = (data: {
    rowIds: Record<string, boolean>
    originalRows: TData[]
}) => void

interface TableProps<TData extends TableCustomData<TData>> {
    tableId?: string | number
    columns: ColumnDef<TData, any>[]
    data: TData[]
    defaultColumn?: Partial<ColumnDef<TData>>
    selectedRowId?: string
    isLoading?: boolean
    isFetching?: boolean
    virtualize?: boolean
    stripe?: boolean
    columnOrderState?: ColumnOrderState
    rowSelection?: RowSelectionState
    tableHeader?: ReactNode
    tableActions?: ReactNode
    tableState?: TableState
    expandedState?: ExpandedState
    onRowSelectionChange?: (rowSelection: RowSelectionState) => void
    onExpandedStateChange?: (expandedState: ExpandedState) => void
    onColumnOrderStateChange?: (columnOrderState: ColumnOrderState) => void
    onTableStateChange?: (state: TableState) => void
    getTableInstance?: (table: TTable<TData>) => void
    getRowId?:
        | ((
              originalRow: TData,
              index: number,
              parent?: Row<TData> | undefined
          ) => string)
        | undefined
    onRowClick?: (props: { row: Row<TData> }) => void
    onRowDoubleClick?: (row: Row<TData>) => void
    onRowHover?: (row: Row<TData>) => void
    onMouseLeave?: (row: Row<TData>) => void
    paginate?: boolean
    defaultPageSize?: number
    showSettings?: boolean
    maxHeight?: string | number
}

export type TableCustomData<T> = { id?: string | number; subRows?: Partial<T>[] }
declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        tableId?: string | number
        _test?: TData
    }
    interface ColumnMeta<TData extends RowData, TValue> {
        row?: {
            isGrouped?: boolean
        }
        cell?: {
            className?: string
        }
    }
}

const Table = <T extends TableCustomData<T>>({
    tableId,
    columns,
    data,
    selectedRowId,
    defaultColumn,
    isFetching,
    isLoading,
    virtualize,
    rowSelection,
    tableHeader,
    tableActions,
    expandedState,
    columnOrderState,
    tableState,
    onTableStateChange,
    onExpandedStateChange,
    onRowSelectionChange,
    onColumnOrderStateChange,
    getTableInstance,
    getRowId,
    onRowClick,
    paginate = false,
    defaultPageSize = 10,
    showSettings = true,
    maxHeight,
}: TableProps<T>) => {
    const tableRef = useRef<HTMLDivElement | null>(null)
    const [pagination, setPagination] = useState(() => {
        if (tableId) {
            const saved = sessionStorage.getItem(`table_pag_${tableId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {}
            }
        }
        return {
            pageIndex: 0,
            pageSize: defaultPageSize,
        }
    })
    const [sorting, setSorting] = useState<SortingState>(() => {
        if (tableId) {
            const saved = sessionStorage.getItem(`table_sort_${tableId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {}
            }
        }
        return []
    })
    const [expanded, setExpanded] = useState<ExpandedState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
        if (tableId) {
            const saved = sessionStorage.getItem(`table_filters_${tableId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {}
            }
        }
        return []
    })
    const [selectedRows, setSelectedRows] = useState<RowSelectionState>({})

    // Controlled local states for Visibility, Pinning and ColumnOrder with localStorage persistence if tableId is present
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        if (tableId) {
            const saved = localStorage.getItem(`table_vis_${tableId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {}
            }
        }
        return tableState?.columnVisibility || {}
    })

    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() => {
        if (tableId) {
            const saved = localStorage.getItem(`table_pin_${tableId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {}
            }
        }
        return {}
    })

    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
        if (tableId) {
            const saved = localStorage.getItem(`table_order_${tableId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {}
            }
        }
        return columnOrderState || columns.map((col: any) => col.id || (col.accessorKey as string) || '')
    })

    // Sync from parent if tableState changes visibility
    useEffect(() => {
        if (tableState?.columnVisibility) {
            setColumnVisibility(tableState.columnVisibility)
        }
    }, [tableState?.columnVisibility])

    // Save changes to localStorage if tableId is present
    useEffect(() => {
        if (tableId) {
            localStorage.setItem(`table_vis_${tableId}`, JSON.stringify(columnVisibility))
        }
    }, [tableId, columnVisibility])

    useEffect(() => {
        if (tableId) {
            localStorage.setItem(`table_pin_${tableId}`, JSON.stringify(columnPinning))
        }
    }, [tableId, columnPinning])

    useEffect(() => {
        if (tableId) {
            localStorage.setItem(`table_order_${tableId}`, JSON.stringify(columnOrder))
        }
    }, [tableId, columnOrder])

    useEffect(() => {
        if (tableId) {
            sessionStorage.setItem(`table_pag_${tableId}`, JSON.stringify(pagination))
        }
    }, [tableId, pagination])

    useEffect(() => {
        if (tableId) {
            sessionStorage.setItem(`table_sort_${tableId}`, JSON.stringify(sorting))
        }
    }, [tableId, sorting])

    useEffect(() => {
        if (tableId) {
            sessionStorage.setItem(`table_filters_${tableId}`, JSON.stringify(columnFilters))
        }
    }, [tableId, columnFilters])

    const state: Partial<TableState> = useMemo(
        () => ({
            sorting,
            columnFilters,
            expanded: expandedState || expanded,
            rowSelection: rowSelection || selectedRows,
            columnOrder,
            pagination,
            columnVisibility,
            columnPinning,
            ...(tableState || {}),
        }),
        [
            tableState,
            rowSelection,
            expandedState,
            selectedRows,
            sorting,
            columnFilters,
            columnOrder,
            pagination,
            columnVisibility,
            columnPinning,
        ]
    )

    const table = useReactTable({
        data,
        columns,
        state,
        meta: {
            tableId,
        },
        initialState: {
            columnOrder: columns.map((column: any) => column.id || (column.accessorKey as string) || ''),
        },
        onStateChange: (updaterOrValue) => {
            if (!onTableStateChange) return

            if (typeof updaterOrValue === 'function') {
                if (tableState) {
                    onTableStateChange(
                        updaterOrValue({
                            ...tableState,
                            pagination,
                        })
                    )
                }
            } else {
                onTableStateChange(updaterOrValue)
            }
        },
        filterFromLeafRows: true,
        columnResizeMode: 'onChange',
        //   paginateExpandedRows: false,
        getRowId,
        getSubRows: (row) => row.subRows as T[],
        onColumnOrderChange: (updaterOrValue) => {
            setColumnOrder((prev) => {
                const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
                if (onColumnOrderStateChange) {
                    onColumnOrderStateChange(next)
                }
                return next
            })
        },
        onRowSelectionChange: (updaterOrValue) => {
            setSelectedRows((prev) => {
                const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
                if (onRowSelectionChange) {
                    onRowSelectionChange(next)
                }
                return next
            })
        },
        onExpandedChange: (updaterOrValue) => {
            setExpanded((prev) => {
                const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
                if (onExpandedStateChange) {
                    onExpandedStateChange(next)
                }
                return next
            })
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnPinningChange: setColumnPinning,
        getFilteredRowModel: getFilteredRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        getPaginationRowModel: paginate ? getPaginationRowModel() : undefined,
        defaultColumn,
    })

    const rowVirtualizer = useVirtualizer({
        getScrollElement: () => tableRef.current,
        estimateSize: () => 40,
        count: table.getExpandedRowModel().rows.length,
    })

    const { getVirtualItems, getTotalSize } = rowVirtualizer

    const tableRows = table.getRowModel().rows
    const rows = virtualize ? getVirtualItems() : tableRows

    useEffect(() => {
        if (getTableInstance) getTableInstance(table)
        if (onColumnOrderStateChange)
            onColumnOrderStateChange(
                columnOrderState || columns.map((column: any) => column.id || (column.accessorKey as string) || '')
            )
    }, [])

    return (
        <div className="flex flex-col w-full h-full">
            <div>
                {tableHeader || tableActions || showSettings ? (
                    <div className="flex items-center justify-between w-full h-10 mb-4 px-4 pt-2">
                        <div className="flex items-center gap-2">
                            {showSettings && <TableSettings table={table} />}
                            {tableHeader && <div>{tableHeader}</div>}
                        </div>
                        {tableActions && (
                            <div className="flex items-center gap-2">
                                {tableActions}
                            </div>
                        )}
                    </div>
                ) : null}
                {isLoading && (
                    <TopMessage
                        text="Carregando dados..."
                        type="loading"
                        className="bg-emerald-500/10 text-emerald-500"
                    />
                )}
                {isFetching && !isLoading ? (
                    <TopMessage text="Atualizando dados..." type="loading" />
                ) : null}
            </div>
            <div
                ref={virtualize ? tableRef : null}
                className={cn(
                    "relative w-full overflow-auto",
                    maxHeight ? "flex-1" : "flex-1 h-full"
                )}
                style={maxHeight ? { maxHeight } : undefined}
            >
                {/* table */}
                <div
                    className="flex flex-col min-w-full"
                    style={{
                        width: table.getTotalSize(),
                    }}
                >
                    {/* thead */}
                    <DndProvider backend={HTML5Backend}>
                        <div className="sticky top-0 z-10 bg-card">
                            {table.getHeaderGroups().map((headerGroup) => (
                                // tr
                                <div
                                    key={headerGroup.id}
                                    className={cn(
                                        'flex text-left border-b border-border dark:border-white/15'
                                    )}
                                >
                                    {headerGroup.headers.map((header) => (
                                        // th
                                        <TableHeader
                                            key={header.id}
                                            header={header}
                                            table={table}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </DndProvider>

                    {/* tbody */}
                    <div className="flex-1 w-full overflow-x-auto">
                        <div
                            className="relative"
                            {...(virtualize && {
                                style: {
                                    height: `${getTotalSize()}px`,
                                },
                            })}
                        >
                            {rows.map((item, idx) => {
                                const row = virtualize
                                    ? (tableRows[(item as VirtualItem).index] as Row<T>)
                                    : (item as Row<T>)

                                if (!row) return null

                                const selectedTableRow = table
                                    .getRowModel()
                                    .rows.find(
                                        (trow) => trow?.id === selectedRowId
                                    )

                                const isSelected =
                                    selectedTableRow &&
                                    (selectedTableRow?.id === row?.id ||
                                        row
                                            ?.getParentRows()
                                            .some(
                                                (parentRow) =>
                                                    parentRow.id ===
                                                    selectedTableRow?.id
                                            ))

                                const hasParentRow = row?.depth !== 0

                                const isParentRow =
                                    !hasParentRow &&
                                    selectedTableRow?.id === row?.id

                                const isLastRow =
                                    hasParentRow &&
                                    row?.id ===
                                        selectedTableRow?.subRows[
                                            selectedTableRow?.subRows.length - 1
                                        ]?.id
                                return (
                                    // tr
                                    <div
                                        {...(virtualize && {
                                            style: {
                                                height: `${(item as VirtualItem).size}px`,
                                                transform: `translateY(${(item as VirtualItem).start}px)`,
                                                position: 'absolute',
                                            },
                                        })}
                                        className={cn(
                                            'flex overflow-hidden w-full group',
                                            onRowClick ? 'cursor-pointer' : '',
                                            idx % 2 === 0 ? 'bg-card' : 'bg-muted/35',
                                            isSelected || row.getIsSelected()
                                                ? 'bg-accent/80 hover:bg-accent'
                                                : 'hover:bg-muted/50',
                                            isParentRow &&
                                                'rounded-tl-lg rounded-tr-lg',
                                            isLastRow &&
                                                'rounded-bl-lg rounded-br-lg'
                                        )}
                                        key={row?.id}
                                        onClick={() =>
                                            onRowClick
                                                ? onRowClick({ row })
                                                : null
                                        }
                                    >
                                        {row?.getVisibleCells().map((cell) => {
                                            return (
                                                // td
                                                <TableCell
                                                    key={cell.id}
                                                    cell={cell}
                                                    isRowSelected={
                                                        cell.row.getIsSelected() ||
                                                        !!isSelected
                                                    }
                                                />
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {paginate && (
                <DataPagination
                    currentPage={table.getState().pagination.pageIndex + 1}
                    totalPages={table.getPageCount()}
                    pageSize={table.getState().pagination.pageSize}
                    totalRows={table.getFilteredRowModel().rows.length}
                    selectedCount={Object.keys(table.getState().rowSelection || {}).length}
                    onPageChange={(page) => table.setPageIndex(page - 1)}
                    onPageSizeChange={(size) => table.setPageSize(size)}
                />
            )}
        </div>
    )
}

export default Table
