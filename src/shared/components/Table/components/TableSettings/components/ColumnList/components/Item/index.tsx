import type { Column, ColumnOrderState } from '@tanstack/react-table'
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Eye,
    EyeOff,
    GripHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/button'

interface ItemProps<T> {
    column: Column<T>
    columnOrder: ColumnOrderState
    setColumnOrder: (columnOrder: ColumnOrderState) => void
}

const reorder = ({
    columnOrder,
    from,
    to,
}: {
    columnOrder: ColumnOrderState
    from: string
    to: string
}) => {
    const oldIndex = columnOrder.indexOf(from)
    const newIndex = columnOrder.indexOf(to)
    return arrayMove(columnOrder, oldIndex, newIndex)
}

const Item = <T,>({ column, columnOrder, setColumnOrder }: ItemProps<T>) => {
    const { attributes, isDragging, listeners, transform, setNodeRef } =
        useSortable({
            id: column.id,
        })

    const isVisible = column.getIsVisible()

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition: 'width transform 0.2s ease-in-out',
        whiteSpace: 'nowrap',
        zIndex: isDragging ? 1 : 0,
    }

    const reorderUp = () => {
        const index = columnOrder.indexOf(column.id)
        const newIndex = index - 1

        if (newIndex >= 0) {
            setColumnOrder(
                reorder({
                    columnOrder,
                    from: column.id,
                    to: columnOrder[newIndex],
                })
            )
        }
    }

    const reorderDown = () => {
        const index = columnOrder.indexOf(column.id)
        const newIndex = index + 1

        if (newIndex < columnOrder.length) {
            setColumnOrder(
                reorder({
                    columnOrder,
                    from: column.id,
                    to: columnOrder[newIndex],
                })
            )
        }
    }

    return (
        <div
            id={column.id}
            key={column.id}
            style={{ ...style }}
            ref={setNodeRef}
            onClick={(e) => {
                e.preventDefault()
                e.currentTarget.focus()
            }}
            className="flex items-center justify-between px-2 py-1 overflow-hidden rounded-md group hover:bg-accent hover:text-primary-600 focus:bg-accent focus:text-primary-600 focus:ring-1 focus:ring-primary-600"
            tabIndex={0}
        >
            <div className="flex items-center gap-2">
                <Button
                    {...attributes}
                    {...listeners}
                    className="hover:bg-transparent"
                    disabled={!isVisible || !!column.getIsPinned()}
                    variant={'ghost'}
                    size={'icon'}
                >
                    <GripHorizontal
                        size={16}
                        className={cn(
                            column.getIsPinned()
                                ? 'text-neutral-400'
                                : 'text-neutral-500'
                        )}
                    />
                </Button>
                <p
                    className={cn(
                        'flex-1 text-elipsis overflow-hidden dark:group-focus:text-primary-500 group-focus:text-primary-600',
                        !isVisible && 'text-neutral-400'
                    )}
                >
                    {column.accessorFn
                        ? column.columnDef.header?.toString()
                        : column.id}
                </p>
            </div>
            <div className="flex items-center">
                <Button
                    className={cn(
                        'rounded-md dark:hover:bg-zinc-900 hover:text-primary-600',
                        !isVisible &&
                            'text-neutral-400 hover:bg-neutral-200 hover:text-neutral-400'
                    )}
                    onClick={() => column.toggleVisibility()}
                    variant={'ghost'}
                    size={'icon'}
                >
                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </Button>
                <Button
                    className={cn(
                        'rounded-md dark:hover:bg-zinc-900 hover:bg-neutral-200 hover:text-primary-600'
                    )}
                    variant={'ghost'}
                    size={'icon'}
                    disabled={!isVisible}
                    onClick={reorderUp}
                >
                    <ArrowUp size={14} />
                </Button>
                <Button
                    className={cn(
                        'rounded-md dark:hover:bg-zinc-900 hover:bg-neutral-200 hover:text-primary-600'
                    )}
                    variant={'ghost'}
                    size={'icon'}
                    disabled={!isVisible}
                    onClick={reorderDown}
                >
                    <ArrowDown size={14} />
                </Button>
                <Button
                    className={cn(
                        'rounded-md dark:hover:bg-zinc-900 hover:bg-neutral-200 hover:text-primary-600',
                        column.getIsPinned() === 'left' &&
                            'text-white bg-primary-300 hover:bg-primary-300 hover:text-white'
                    )}
                    variant={'ghost'}
                    size={'icon'}
                    disabled={!isVisible}
                    onClick={() =>
                        column.getIsPinned()
                            ? column.getIsPinned() === 'right'
                                ? column.pin('left')
                                : column.pin(false)
                            : column.pin('left')
                    }
                >
                    <ArrowLeft size={14} />
                </Button>
                <Button
                    className={cn(
                        'rounded-md dark:hover:bg-zinc-900 hover:bg-neutral-200 hover:text-primary-600',
                        column.getIsPinned() === 'right' &&
                            'text-white bg-primary-300 hover:bg-primary-300 hover:text-white'
                    )}
                    variant={'ghost'}
                    size={'icon'}
                    disabled={!isVisible}
                    onClick={() =>
                        column.getIsPinned()
                            ? column.getIsPinned() === 'left'
                                ? column.pin('right')
                                : column.pin(false)
                            : column.pin('right')
                    }
                >
                    <ArrowRight size={14} />
                </Button>
            </div>
        </div>
    )
}

export default Item
