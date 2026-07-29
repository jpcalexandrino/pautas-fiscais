import type {
    PaginationState,
    TableState,
    Updater,
} from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type {
    OnColumnFiltersStateChangeFn,
    OnColumnOrderStateChangeFn,
    OnColumnPinningStateChangeFn,
    OnColumnSizingChangeFn,
    OnColumnVisibilityStateChangeFn,
    OnExpandedStateChangeFn,
    OnPaginationStateChangeFn,
    OnRowSelectionChangeFn,
    OnSortingStateChangeFn,
    OnTableStateChangeFn,
    Persist,
    OnGroupingStateChangeFn,
} from '@/components/Table/type'
import {
    ActionNames,
    type TableReducer,
    type ReducerState,
    type UseTableStateProps,
    type UseTableStateReturn,
} from './type'
import { DEFAULT_PAGE_SIZE } from '../components/TablePagination'

const getStateValue = <T>(updater: Updater<T>, state: T) => {
    return typeof updater === 'function'
        ? (updater as (old: T) => T)(state)
        : updater
}

const reducer: TableReducer = (state, action) => {
    const { payload, type } = action

    switch (type) {
        case ActionNames.SET_COLUMN_FILTER:
            return {
                ...state,
                columnFilters: getStateValue(payload, state.columnFilters),
            }
        case ActionNames.SET_COLUMN_ORDER: {
            return {
                ...state,
                columnOrder: getStateValue(payload, state.columnOrder),
            }
        }

        case ActionNames.SET_COLUMN_PINNING: {
            return {
                ...state,
                columnPinning: getStateValue(payload, state.columnPinning),
            }
        }
        case ActionNames.SET_COLUMN_SIZING: {
            return {
                ...state,
                columnSizing: getStateValue(payload, state.columnSizing),
            }
        }
        case ActionNames.SET_EXPANDED: {
            return {
                ...state,
                expanded: getStateValue(payload, state.expanded),
            }
        }
        case ActionNames.SET_PAGINATION: {
            return {
                ...state,
                pagination: getStateValue(payload, state.pagination),
            }
        }
        case ActionNames.SET_ROW_SELECTION: {
            return {
                ...state,
                rowSelection: getStateValue(payload, state.rowSelection),
            }
        }
        case ActionNames.SET_SORTING: {
            return {
                ...state,
                sorting: getStateValue(payload, state.sorting),
            }
        }
        case ActionNames.SET_TABLE_STATE: {
            return {
                ...state,
                ...getStateValue(payload as TableState, state),
            }
        }
        case ActionNames.SET_VISIBILITY: {
            return {
                ...state,
                columnVisibility: getStateValue(
                    payload,
                    state.columnVisibility
                ),
            }
        }
        case ActionNames.SET_GROUPING: {
            return {
                ...state,
                grouping: getStateValue(payload, state.grouping),
            }
        }
        default: {
            return state
        }
    }
}

const checkObject = <T extends object>(obj: T | undefined) =>
    obj ? (Object.keys(obj).length > 0 ? obj : {}) : ({} as T)

const checkArray = <T>(arr: T[] | undefined) =>
    arr ? (arr.length > 0 ? arr : []) : []

const getInitialState = ({
    key,
    omit,
    storage = localStorage,
    canPersist,
    columnFilters,
    columnOrder,
    columnPinning,
    columnSizing,
    expanded,
    pagination,
    rowSelection,
    sorting,
    columnVisibility,
    columnSizingInfo,
    globalFilter,
    grouping,
    rowPinning,
}: Partial<ReducerState> & Persist): ReducerState => {
    const initialState: ReducerState = {
        columnVisibility: checkObject(columnVisibility),
        columnFilters: checkArray(columnFilters),
        columnOrder: checkArray(columnOrder),
        columnPinning: checkObject(columnPinning),
        columnSizing: checkObject(columnSizing),
        expanded:
            typeof expanded === 'boolean' ? expanded : checkObject(expanded),
        pagination:
            pagination?.pageIndex && pagination.pageSize
                ? pagination
                : ({
                      pageIndex: 0,
                      pageSize: DEFAULT_PAGE_SIZE,
                  } as PaginationState),
        rowSelection: checkObject(rowSelection),
        sorting: checkArray(sorting),
        columnSizingInfo: columnSizingInfo || {
            columnSizingStart: [],
            deltaOffset: 0,
            deltaPercentage: 0,
            isResizingColumn: false,
            startOffset: 0,
            startSize: 0,
        },
        globalFilter: globalFilter || '',
        grouping: checkArray(grouping),
        rowPinning: checkObject(rowPinning),
    }

    if (!canPersist || !key) return initialState

    try {
        const storedState = storage.getItem(key)

        if (!storedState) return initialState

        const parsedState: ReducerState = JSON.parse(storedState)

        if (omit) {
            for (const key of omit) {
                delete parsedState[key]
            }
        }

        return {
            ...initialState,
            ...parsedState,
        }
    } catch (error) {
        console.error(error)
        return initialState
    }
}

const persistOnStorage = ({
    canPersist,
    key,
    omit,
    storage = localStorage,
}: Persist) => {
    if (!canPersist) return null

    return (state: ReducerState) => {
        if (!key) return null

        const stateToStore = { ...state }

        if (omit) {
            for (const key of omit) {
                delete stateToStore[key]
            }
        }

        storage.setItem(key, JSON.stringify(stateToStore))
    }
}

export const useTableState = ({
    persist,
    onColumnFiltersChange,
    onColumnOrderStateChange,
    onColumnVisibilityStateChange,
    onExpandedStateChange,
    onPaginationChange,
    onRowSelectionChange,
    onTableStateChange,
    onColumnPinningStateChange,
    onColumnSizingChange,
    onSortingStateChange,
    onGroupingStateChange,
    ...rest
}: UseTableStateProps): UseTableStateReturn => {
    const {
        columnFilters,
        columnOrder,
        columnPinning,
        columnSizing,
        expanded,
        pagination,
        rowSelection,
        sorting,
        columnVisibility,
        grouping,
    } = rest

    const initialState = useMemo(
        () =>
            getInitialState({
                ...rest,
                canPersist: !!persist?.canPersist,
                key: persist?.key || '',
                storage: persist?.storage,
                omit: persist?.omit,
            }),
        []
    )

    const [state, dispatch] = useReducer(reducer, initialState)

    const stableRest = useMemo(() => rest, [rest])

    const handleStateChange = useCallback<OnTableStateChangeFn>(
        (updaterOrValue) => {
            const newState =
                typeof updaterOrValue === 'function'
                    ? updaterOrValue({ ...state, ...stableRest })
                    : updaterOrValue
            dispatch({
                payload: updaterOrValue,
                type: ActionNames.SET_TABLE_STATE,
            })
            if (onTableStateChange) {
                onTableStateChange(newState)
            }
        },
        [onTableStateChange, state, stableRest]
    )

    // const handleGenericStateUpdate = useCallback(
    //     <T>({ state, setState, updater }: HandleGenericStateUpdateProps<T>) => {
    //         if (typeof updater === 'function') {
    //             setState((updater as (old: T) => T)(state))
    //         } else {
    //             setState(updater)
    //         }
    //     },
    //     []
    // )

    const handleColumnOrderChange = useCallback<OnColumnOrderStateChangeFn>(
        (updaterOrValue) => {
            const current = columnOrder || state.columnOrder
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({
                type: ActionNames.SET_COLUMN_ORDER,
                payload: updaterOrValue,
            })
            if (onColumnOrderStateChange) {
                onColumnOrderStateChange(newVal)
            }
        },
        [onColumnOrderStateChange, columnOrder, state.columnOrder]
    )

    const handleRowSelectionChange = useCallback<OnRowSelectionChangeFn>(
        (updaterOrValue) => {
            const current = rowSelection || state.rowSelection
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({
                type: ActionNames.SET_ROW_SELECTION,
                payload: updaterOrValue,
            })
            if (onRowSelectionChange) {
                onRowSelectionChange(newVal)
            }
        },
        [onRowSelectionChange, rowSelection, state.rowSelection]
    )

    const handleExpandedChange = useCallback<OnExpandedStateChangeFn>(
        (updaterOrValue) => {
            const current = expanded || state.expanded
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({
                type: ActionNames.SET_EXPANDED,
                payload: updaterOrValue,
            })
            if (onExpandedStateChange) {
                onExpandedStateChange(newVal)
            }
        },
        [onExpandedStateChange, expanded, state.expanded]
    )

    const handlePaginationChange = useCallback<OnPaginationStateChangeFn>(
        (updaterOrValue) => {
            const current = pagination || state.pagination
            const newVal = getStateValue(updaterOrValue, current)

            dispatch({
                type: ActionNames.SET_PAGINATION,
                payload: updaterOrValue,
            })
            if (onPaginationChange) {
                onPaginationChange(newVal)
            }
        },
        [onPaginationChange, pagination, state.pagination]
    )

    const handleColumnFiltersChange = useCallback<OnColumnFiltersStateChangeFn>(
        (updaterOrValue) => {
            const current = columnFilters || state.columnFilters
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({
                type: ActionNames.SET_COLUMN_FILTER,
                payload: updaterOrValue,
            })
            if (onColumnFiltersChange) {
                onColumnFiltersChange(newVal)
            }
        },
        [onColumnFiltersChange, columnFilters, state.columnFilters]
    )

    const handleColumnVisibilityChange =
        useCallback<OnColumnVisibilityStateChangeFn>(
            (updaterOrValue) => {
                const current = columnVisibility || state.columnVisibility
                const newVal = getStateValue(updaterOrValue, current)
                dispatch({
                    type: ActionNames.SET_VISIBILITY,
                    payload: updaterOrValue,
                })
                if (onColumnVisibilityStateChange) {
                    onColumnVisibilityStateChange(newVal)
                }
            },
            [
                onColumnVisibilityStateChange,
                columnVisibility,
                state.columnVisibility,
            ]
        )

    const handleColumnPinningStateChange =
        useCallback<OnColumnPinningStateChangeFn>(
            (updaterOrValue) => {
                const current = columnPinning || state.columnPinning
                const newVal = getStateValue(updaterOrValue, current)
                dispatch({
                    type: ActionNames.SET_COLUMN_PINNING,
                    payload: updaterOrValue,
                })
                if (onColumnPinningStateChange) {
                    onColumnPinningStateChange(newVal)
                }
            },
            [onColumnPinningStateChange, columnPinning, state.columnPinning]
        )

    const handleColumnSizingStateChange = useCallback<OnColumnSizingChangeFn>(
        (updaterOrValue) => {
            const current = columnSizing || state.columnSizing
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({
                type: ActionNames.SET_COLUMN_SIZING,
                payload: updaterOrValue,
            })
            if (onColumnSizingChange) {
                onColumnSizingChange(newVal)
            }
        },
        [onColumnSizingChange, columnSizing, state.columnSizing]
    )

    const handleSortingStateChange = useCallback<OnSortingStateChangeFn>(
        (updaterOrValue) => {
            const current = sorting || state.sorting
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({ type: ActionNames.SET_SORTING, payload: updaterOrValue })
            if (onSortingStateChange) {
                onSortingStateChange(newVal)
            }
        },
        [onSortingStateChange, sorting, state.sorting]
    )

    const handleGroupingStateChange = useCallback<OnGroupingStateChangeFn>(
        (updaterOrValue) => {
            const current = grouping || state.grouping
            const newVal = getStateValue(updaterOrValue, current)
            dispatch({
                type: ActionNames.SET_GROUPING,
                payload: updaterOrValue,
            })
            if (onGroupingStateChange) {
                onGroupingStateChange(newVal)
            }
        },
        [onGroupingStateChange, grouping, state.grouping]
    )

    useEffect(() => {
        if (persist) {
            const store = persistOnStorage({ ...persist })

            const timer = setTimeout(() => {
                if (store) store(state)
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [state, persist])

    useEffect(() => {
        // Atualizar o estado externo com o estado persistido em storage
        if (persist && persist.canPersist) {
            if (onTableStateChange) {
                onTableStateChange(initialState)
            }

            if (onColumnFiltersChange) {
                onColumnFiltersChange(initialState.columnFilters)
            }

            if (onColumnOrderStateChange) {
                onColumnOrderStateChange(initialState.columnOrder)
            }

            if (onColumnVisibilityStateChange) {
                onColumnVisibilityStateChange(initialState.columnVisibility)
            }

            if (onExpandedStateChange) {
                onExpandedStateChange(initialState.expanded)
            }

            if (onPaginationChange) {
                onPaginationChange(initialState.pagination)
            }

            if (onRowSelectionChange) {
                onRowSelectionChange(initialState.rowSelection)
            }

            if (onColumnPinningStateChange) {
                onColumnPinningStateChange(initialState.columnPinning)
            }

            if (onColumnSizingChange) {
                onColumnSizingChange(initialState.columnSizing)
            }

            if (onSortingStateChange) {
                onSortingStateChange(initialState.sorting)
            }

            if (onGroupingStateChange) {
                onGroupingStateChange(initialState.grouping)
            }
        }
    }, [])

    return {
        state: {
            ...state,
            ...stableRest,
        },
        handleGroupingStateChange,
        handleStateChange,
        handleColumnOrderChange,
        handleRowSelectionChange,
        handleExpandedChange,
        handlePaginationChange,
        handleColumnFiltersChange,
        handleColumnVisibilityChange,
        handleColumnPinningStateChange,
        handleColumnSizingStateChange,
        handleSortingStateChange,
    }
}
