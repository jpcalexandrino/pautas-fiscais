import { useEffect, useMemo, useRef, useCallback } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getGroupedRowModel,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import type { TableCustomData, TableProps } from './type'
import { TableContextProvider } from './contexts/TableContext'
import { useTableState } from './hooks/useTableState'
import TablePagination from './components/TablePagination'
import TableContainer from './components/TableContainer'
import TableLayout from './components/TableLayout'
import TableHeader from './components/TableHeader'
import TableBody from './components/TableBody'
import SelectionColumn from './components/SelectionColumn'
import TableDndContext from './contexts/TableDndContext'

const Table = <T extends TableCustomData<T>>({
    columns,
    data,
    defaultColumn,
    pagination,
    tableState,
    meta,
    enableMultiRowSelection = true,
    enableRowSelection,
    className,
    rowEstimateSize,
    shouldRenderCheckbox = true,
    persist,
    getRowId,
    onRowClick,
    getTableInstance,
    onPaginationChange,
    onColumnFiltersChange,
    onTableStateChange,
    onExpandedStateChange,
    onRowSelectionChange,
    onColumnOrderStateChange,
    onColumnVisibilityStateChange,
    onColumnPinningStateChange,
    onSortingStateChange,
    onColumnSizingChange,
    onGroupingStateChange,
}: TableProps<T>) => {
    const tableRef = useRef<HTMLDivElement | null>(null)

    const {
        state,
        handleColumnFiltersChange,
        handleColumnOrderChange,
        handleColumnPinningStateChange,
        handleSortingStateChange,
        handleStateChange,
        handleColumnVisibilityChange,
        handleExpandedChange,
        handlePaginationChange,
        handleRowSelectionChange,
        handleColumnSizingStateChange,
        handleGroupingStateChange,
    } = useTableState({
        persist,
        ...tableState,
        onColumnFiltersChange,
        onTableStateChange,
        onExpandedStateChange,
        onRowSelectionChange,
        onColumnOrderStateChange,
        onColumnVisibilityStateChange,
        onColumnPinningStateChange,
        onSortingStateChange,
        onColumnSizingChange,
        onGroupingStateChange,
        onPaginationChange,
    })

    const columnsMemo = useMemo(() => {
        if (enableRowSelection && shouldRenderCheckbox) {
            return [
                SelectionColumn<T, any>({
                    pagination: Boolean(state.pagination),
                }),
                ...columns,
            ]
        }
        return [...columns]
    }, [columns])

    const getColumnOrder = useCallback(() => {
        const columnOrderIds = state.columnOrder || []
        const tableIds = columnsMemo.map((column) => column.id)

        const mergedArray = [...columnOrderIds]

        tableIds.forEach((item, index) => {
            if (item) {
                if (!columnOrderIds.includes(item)) {
                    mergedArray.splice(index, 0, item)
                }
            }
        })

        return mergedArray.filter(Boolean)
    }, [columnsMemo])

    const table = useReactTable({
        data,
        columns: columnsMemo,
        state,
        meta,
        manualPagination: true,
        initialState: {
            columnOrder: columnsMemo.map((column) => column.id || ''),
        },
        enableMultiRowSelection,
        enableRowSelection: (row) => {
            const isLeaf = !row.getIsGrouped() || row.subRows?.length === 0

            if (typeof enableRowSelection === 'function') {
                return enableRowSelection(row) && isLeaf
            }

            return !!enableRowSelection && isLeaf
        },
        filterFromLeafRows: true,
        columnResizeMode: 'onChange',
        defaultColumn,
        autoResetExpanded: false,
        getRowId,
        getSubRows: (row) => row.subRows as T[],
        onStateChange: handleStateChange,
        onColumnOrderChange: handleColumnOrderChange,
        onRowSelectionChange: handleRowSelectionChange,
        onExpandedChange: handleExpandedChange,
        onPaginationChange: handlePaginationChange,
        onSortingChange: handleSortingStateChange,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: handleColumnVisibilityChange,
        onColumnPinningChange: handleColumnPinningStateChange,
        onColumnSizingChange: handleColumnSizingStateChange,
        onGroupingChange: handleGroupingStateChange,
        getGroupedRowModel: getGroupedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const rowVirtualizer = useVirtualizer({
        count: table.getRowModel().rows.length,
        overscan: 3,
        getScrollElement: () => tableRef.current,
        estimateSize: useCallback(() => rowEstimateSize ?? 50, []),
        measureElement:
            typeof window !== 'undefined' &&
            navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element?.getBoundingClientRect().height
                : undefined,
    })

    useEffect(() => {
        if (getTableInstance) getTableInstance(table)
    }, [])

    useEffect(() => {
        handleColumnOrderChange(getColumnOrder())
    }, [columnsMemo])

    return (
        <TableDndContext>
            <TableContextProvider table={table} rowVirtualizer={rowVirtualizer}>
                <div className={cn('flex flex-col overflow-hidden', className)}>
                    <TableContainer ref={tableRef}>
                        <TableLayout>
                            <TableHeader />
                            <TableBody
                                onRowClick={onRowClick}
                                rowEstimateSize={rowEstimateSize}
                            />
                        </TableLayout>
                    </TableContainer>
                    {tableState?.pagination && onPaginationChange && (
                        <TablePagination
                            pageSize={tableState.pagination.pageSize}
                            selectedPage={tableState.pagination.pageIndex}
                            onPaginationChange={handlePaginationChange}
                            totalItems={pagination?.totalItems || 0}
                            totalPages={pagination?.totalPages || 0}
                        />
                    )}
                </div>
            </TableContextProvider>
        </TableDndContext>
    )
}

export default Table
