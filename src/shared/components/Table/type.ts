import type {
    ColumnDef,
    ColumnFiltersState,
    ColumnOrderState,
    ColumnPinningState,
    ColumnSizingState,
    ExpandedState,
    GroupingState,
    OnChangeFn,
    PaginationState,
    Row,
    RowSelectionState,
    SortingState,
    Table,
    TableMeta,
    TableState,
    VisibilityState,
} from '@tanstack/react-table'
import type { ClassValue } from 'clsx'

export type RowSelection<TData> = {
    rowIds: Record<string, boolean>
    originalRows: TData & TableCustomData<TData>[]
}

export type OnSelectionRowChange<TData> = (data: {
    rowIds: Record<string, boolean>
    originalRows: TData[]
}) => void

type Updater<T> = (old: T) => T | void

export type OnTableStateChangeFn = OnChangeFn<TableState>
export type OnColumnOrderStateChangeFn = OnChangeFn<ColumnOrderState>
export type OnRowSelectionChangeFn = OnChangeFn<RowSelectionState>
export type OnExpandedStateChangeFn = OnChangeFn<ExpandedState>
export type OnPaginationStateChangeFn = OnChangeFn<PaginationState>
export type OnColumnFiltersStateChangeFn = OnChangeFn<ColumnFiltersState>
export type OnColumnVisibilityStateChangeFn = OnChangeFn<VisibilityState>
export type OnColumnPinningStateChangeFn = OnChangeFn<ColumnPinningState>
export type OnSortingStateChangeFn = OnChangeFn<SortingState>
export type OnColumnSizingChangeFn = OnChangeFn<ColumnSizingState>
export type OnGroupingStateChangeFn = OnChangeFn<GroupingState>

export type TableStateUpdater = Updater<TableState>
export type ColumnOrderStateUpdater = Updater<ColumnOrderState>
export type RowSelectionUpdater = Updater<RowSelectionState>
export type ExpandedStateUpdater = Updater<ExpandedState>
export type PaginationStateUpdater = Updater<PaginationState>
export type ColumnFiltersStateUpdater = Updater<ColumnFiltersState>
export type ColumnVisibilityStateUpdater = Updater<VisibilityState>
export type ColumnPinningStateUpdater = Updater<ColumnPinningState>
export type SortingStateUpdater = Updater<SortingState>
export type ColumnSizingUpdater = Updater<ColumnSizingState>
export type GroupingUpdater = Updater<GroupingState>

export type TableStateType = keyof TableState

export type Persist = {
    canPersist: boolean
    key: string
    storage?: Storage
    omit?: TableStateType[]
}

export type GetRowIdFn<TData> = (
    originalRow: TData,
    index: number,
    parent?: Row<TData> | undefined
) => string

export interface TableProps<TData extends TableCustomData<TData>> {
    tableId?: string | number
    columns: ColumnDef<TData, any>[]
    data: TData[]
    defaultColumn?: Partial<ColumnDef<TData>>
    selectedRowId?: string
    persist?: Persist
    tableState?: Partial<TableState>
    meta?: TableMeta<TData>
    className?: ClassValue
    enableMultiRowSelection?:
        | boolean
        | ((row: Row<TData>) => boolean)
        | undefined
    enableRowSelection?: boolean | ((row: Row<TData>) => boolean) | undefined
    rowEstimateSize?: number
    shouldRenderCheckbox?: boolean
    pagination?: {
        totalItems: number
        totalPages: number
        pageSize?: number
    }
    onTableStateChange?: TableStateUpdater
    onColumnFiltersChange?: ColumnFiltersStateUpdater
    onPaginationChange?: PaginationStateUpdater
    onRowSelectionChange?: RowSelectionUpdater
    onExpandedStateChange?: ExpandedStateUpdater
    onColumnOrderStateChange?: ColumnOrderStateUpdater
    onColumnVisibilityStateChange?: ColumnVisibilityStateUpdater
    onColumnPinningStateChange?: ColumnPinningStateUpdater
    onSortingStateChange?: SortingStateUpdater
    onColumnSizingChange?: ColumnSizingUpdater
    onGroupingStateChange?: GroupingUpdater
    getTableInstance?: (table: Table<TData>) => void
    getRowId?: GetRowIdFn<TData>
    onRowClick?: (props: { row: Row<TData> }) => void
    onRowDoubleClick?: (row: Row<TData>) => void
}

export type TableCustomData<T> = { rowId?: string; subRows?: T[] }

export type TableData<T> = T & TableCustomData<T>

import type { RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        layout?: 'stretch' | 'default'
        header?: {
            className?: string
        }
        cell?: {
            className?: string
        }
        updateData?: (rowId: string, columnId: keyof TData, value: any, columnDef: any) => void
        row?: {
            className?: string
        }
    }
    interface ColumnMeta<TData extends RowData, TValue> {
        enableColumnOrdering?: boolean
        enableMenu?: boolean
        header?: {
            className?: string
            menu?: {
                className?: string
                renderMenuItem?: (props: any) => React.ReactNode
            }
        }
        cell?: {
            className?: string
            formatterFn?: (props: any) => React.ReactNode
            validator?: any
        }
        row?: {
            isGrouped?: boolean
        }
        enableColumnEditable?: boolean
        editableColumnProps?: any
        editableColumnType?: string
    }
}
