import type {
    ColumnFiltersState,
    ColumnOrderState,
    ColumnPinningState,
    ColumnSizingState,
    ExpandedState,
    GroupingState,
    PaginationState,
    RowSelectionState,
    SortingState,
    TableState,
    Updater,
    VisibilityState,
} from '@tanstack/react-table'

import type {
    GroupingUpdater,
    OnColumnFiltersStateChangeFn,
    OnColumnOrderStateChangeFn,
    OnColumnPinningStateChangeFn,
    OnColumnSizingChangeFn,
    OnColumnVisibilityStateChangeFn,
    OnExpandedStateChangeFn,
    OnGroupingStateChangeFn,
    OnPaginationStateChangeFn,
    OnRowSelectionChangeFn,
    OnSortingStateChangeFn,
    OnTableStateChangeFn,
    Persist,
} from '@/components/Table/type'

import type {
    ColumnFiltersStateUpdater,
    ColumnOrderStateUpdater,
    ColumnPinningStateUpdater,
    ColumnSizingUpdater,
    ColumnVisibilityStateUpdater,
    ExpandedStateUpdater,
    PaginationStateUpdater,
    RowSelectionUpdater,
    SortingStateUpdater,
    TableStateUpdater,
} from '@/components/Table/type'

export type UseTableStateProps = Partial<
    {
        persist?: Persist
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
    } & TableState
>

export type UseTableStateReturn = {
    state: TableState
    handleStateChange: OnTableStateChangeFn
    handleColumnOrderChange: OnColumnOrderStateChangeFn
    handleRowSelectionChange: OnRowSelectionChangeFn
    handleExpandedChange: OnExpandedStateChangeFn
    handlePaginationChange: OnPaginationStateChangeFn
    handleColumnFiltersChange: OnColumnFiltersStateChangeFn
    handleColumnVisibilityChange: OnColumnVisibilityStateChangeFn
    handleColumnPinningStateChange: OnColumnPinningStateChangeFn
    handleColumnSizingStateChange: OnColumnSizingChangeFn
    handleSortingStateChange: OnSortingStateChangeFn
    handleGroupingStateChange: OnGroupingStateChangeFn
}

export enum ActionNames {
    SET_COLUMN_FILTER,
    SET_COLUMN_ORDER,
    SET_COLUMN_PINNING,
    SET_COLUMN_SIZING,
    SET_EXPANDED,
    SET_PAGINATION,
    SET_ROW_SELECTION,
    SET_SORTING,
    SET_TABLE_STATE,
    SET_VISIBILITY,
    SET_GROUPING,
}

export type ReducerState = TableState

export type ReducerActionsType =
    | {
          type: ActionNames.SET_COLUMN_FILTER
          payload: Updater<ColumnFiltersState>
      }
    | {
          type: ActionNames.SET_COLUMN_ORDER
          payload: Updater<ColumnOrderState>
      }
    | {
          type: ActionNames.SET_COLUMN_PINNING
          payload: Updater<ColumnPinningState>
      }
    | {
          type: ActionNames.SET_COLUMN_SIZING
          payload: Updater<ColumnSizingState>
      }
    | {
          type: ActionNames.SET_EXPANDED
          payload: Updater<ExpandedState>
      }
    | {
          type: ActionNames.SET_PAGINATION
          payload: Updater<PaginationState>
      }
    | {
          type: ActionNames.SET_ROW_SELECTION
          payload: Updater<RowSelectionState>
      }
    | {
          type: ActionNames.SET_SORTING
          payload: Updater<SortingState>
      }
    | {
          type: ActionNames.SET_TABLE_STATE
          payload: Updater<TableState>
      }
    | {
          type: ActionNames.SET_VISIBILITY
          payload: Updater<VisibilityState>
      }
    | {
          type: ActionNames.SET_GROUPING
          payload: Updater<GroupingState>
      }

export type TableReducer = (
    state: ReducerState,
    action: ReducerActionsType
) => ReducerState

export type HandleGenericStateUpdateProps<T> = {
    state: T
    updater: Updater<T>
    setState: (old: T) => T | void
}

export type HandleGenericStateUpdateFn<T> = (
    props: HandleGenericStateUpdateProps<T>
) => void
