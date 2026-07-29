import { cn } from '@/lib/utils'
import { type Cell, flexRender } from '@tanstack/react-table'
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react'
import {
    type CSSProperties,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { getCommonPinningStyles } from '../../utils'
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTableContext } from '../../hooks/useTableContext'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

type CellProps<TData> = {
    cell: Cell<TData, any>
    className?: string
}

const TableCell = <T,>({ cell, ...props }: CellProps<T>) => {
    const { table } = useTableContext<T>()

    if (!table) return null

    const columnOrder = table.getState().columnOrder

    return (
        <SortableContext
            id={cell.id}
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
        >
            <TableCellRenderer cell={cell} {...props} />
        </SortableContext>
    )
}

type ExpandedContainerProps = {
    children: ReactNode
    className?: string
}

const ExpandedContainer = ({ children, className }: ExpandedContainerProps) => {
    return (
        <div
            className={cn(
                'flex items-center truncate text-secondary-600',
                className
            )}
        >
            {children}
        </div>
    )
}

const TableCellRenderer = <T,>({ cell, className }: CellProps<T>) => {
    const context = useTableContext<T>()

    if (!context.table)
        throw new Error('TableCellRenderer must be used inside TableContext')

    const { table } = context

    const initialValue = cell.getValue()
    const [value, setValue] = useState(initialValue || '')
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState('')
    const [isSuccess, setIsSuccess] = useState(true)

    const isGrouped = cell.column.columnDef?.meta?.row?.isGrouped
    const isCellEditable = cell.column?.columnDef?.meta?.enableColumnEditable
    const editableColumnProps =
        cell.column?.columnDef?.meta?.editableColumnProps
    const tableRowLayout = table.options.meta?.layout || 'default'
    const cellClassName =
        cell.column.columnDef.meta?.cell?.className ||
        table.options.meta?.cell?.className

    const isPinned = cell.column.getIsPinned()

    const isSelected =
        cell.row.getIsSelected() ||
        cell.row.getParentRows().some((parent) => parent.getIsSelected())
    const inputRef = useRef<HTMLInputElement | null>(null)

    const formatterFn = cell.column.columnDef.meta?.cell?.formatterFn
    const validator = cell.column.columnDef.meta?.cell?.validator

    const { isDragging, setNodeRef, transform } = useSortable({
        id: cell.column.id,
    })

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition: 'width transform 0.2s ease-in-out',
        width: cell.column.getSize(),
        zIndex: isDragging ? 1 : 0,
        paddingLeft: isGrouped ? `${cell.row.depth * 2}rem` : undefined,
    }

    const onBlur = useCallback(() => {
        if (table.options.meta?.updateData) {
            table.options.meta.updateData(
                cell.row.id,
                cell.column.id as keyof T,
                value,
                cell.column.columnDef
            )
        }
    }, [cell, value, table])

    useEffect(() => {
        if (isCellEditable) setValue(initialValue || '')
    }, [initialValue, isCellEditable])

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
        }
    }, [isEditing])

    const handleClick = useCallback(() => {
        if (isCellEditable) setIsEditing(true)
    }, [isCellEditable])

    const handleFocus = useCallback(() => {
        if (isCellEditable) setIsEditing(true)
    }, [isCellEditable])

    useEffect(() => {
        if (validator) {
            const result = validator.safeParse(cell.getValue())

            if (!result.success) {
                const firstIssue = result.error.issues?.[0]
                setError(firstIssue?.message ?? 'Valor inválido')
                setIsSuccess(false)
            } else {
                setError('')
                setIsSuccess(true)
            }
        }
    }, [validator, cell.getValue()])

    const renderContent = (): ReactNode => {
        if (cell.getIsPlaceholder()) {
            return null
        }

        if (isGrouped && cell.row.subRows.length > 0) {
            const toggle = cell.row.getToggleExpandedHandler()

            if (cell.row.depth !== 0 && !cell.row.getCanExpand())
                return (
                    <ExpandedContainer>
                        <div className="px-2">
                            <CornerDownRight
                                className="text-muted-foreground"
                                size={12}
                            />
                        </div>
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                    </ExpandedContainer>
                )

            return (
                <ExpandedContainer>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggle()
                        }}
                        className={cn(
                            'px-2 cursor-pointer',
                            isGrouped && cell.row.depth === 0
                                ? 'text-primary'
                                : ''
                        )}
                    >
                        {cell.row.getIsExpanded() ? (
                            <ChevronDown size={16} />
                        ) : (
                            <ChevronRight size={16} />
                        )}
                    </button>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </ExpandedContainer>
            )
        }

        if (cell.getIsGrouped()) {
            const toggle = cell.row.getToggleExpandedHandler()

            if (cell.row.depth !== 0 && !cell.row.getCanExpand())
                return (
                    <ExpandedContainer>
                        <CornerDownRight
                            className="text-muted-foreground"
                            size={12}
                        />
                    </ExpandedContainer>
                )

            return (
                <ExpandedContainer className="gap-1">
                    <div className="flex items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                toggle()
                            }}
                            className={cn(
                                'mr-2 cursor-pointer text-secondary-600'
                            )}
                        >
                            {cell.row.getIsExpanded() ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                        </button>
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                    </div>
                    ({cell.row.subRows.length})
                </ExpandedContainer>
            )
        }

        if (cell.getIsAggregated()) {
            return flexRender(
                cell.column.columnDef.aggregatedCell ??
                    cell.column.columnDef.cell,
                cell.getContext()
            )
        }

        if (isCellEditable) {
            const editableColumnType =
                cell.column?.columnDef?.meta?.editableColumnType

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <input
                                ref={inputRef}
                                className={cn(
                                    validator && !isSuccess
                                        ? 'border-red-500'
                                        : undefined,
                                    validator && isSuccess
                                        ? 'border-green-500'
                                        : undefined,
                                    'w-full h-full px-2 py-1 text-xs bg-transparent border text-foreground'
                                )}
                                value={value as string}
                                type={editableColumnType || 'text'}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={() => {
                                    onBlur()
                                    setIsEditing(false)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onBlur()
                                    }
                                }}
                                {...editableColumnProps}
                            />
                        </TooltipTrigger>
                        {error && (
                            <TooltipContent>
                                {error && <p>{error}</p>}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            )
        }

        return formatterFn ? (
            <p
                className={cn(
                    'text-xs truncate text-foreground',
                    cellClassName
                )}
            >
                {formatterFn({ row: cell.row, value: cell.getValue() })}
            </p>
        ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
        )
    }

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'overflow-hidden flex items-center px-4 truncate text-sm py-1.5 shrink-0',
                'group-hover:bg-accent transition-colors ease-in duration-150 bg-background',
                'nth-last-[1_of_[data-pinned="left"]]:border-r nth-last[1_of_data-pinned="left"]:inset-shadow-[-7px_0_9px_-7px_rgba(0,0,0,0.1)]',
                'nth-last-[1_of_[data-pinned="right"]]:border-l nth-last-[1_of_[data-pinned="right"])]:inset-shadow-[7px_0_9px_-7px_rgba(0,0,0,0.1)]',
                'data-[selected=true]:bg-primary/10',
                isDragging &&
                    'border-primary border-y-0 border-x-2 z-50 bg-primary/10',
                tableRowLayout === 'stretch' && 'last-of-type:flex-1',
                cellClassName,
                className
            )}
            onClick={handleClick}
            tabIndex={0}
            data-grouped={cell.getIsGrouped() || cell.getIsAggregated()}
            data-selected={isSelected}
            data-pinned={isPinned}
            onFocus={handleFocus}
            style={{
                ...style,
                ...getCommonPinningStyles(cell.column, cell.column.getSize()),
            }}
        >
            {renderContent()}
        </div>
    )
}

export default TableCell
