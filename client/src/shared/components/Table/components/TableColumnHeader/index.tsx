import { cn } from '@/lib/utils'
import { type Header, type Table, flexRender } from '@tanstack/react-table'
import HeaderActions from './components/HeaderActions'
import type { CSSProperties } from 'react'
import { ArrowDown, ArrowUp, FilterIcon, Pin, Tally2 } from 'lucide-react'
import { getCommonPinningStyles } from '../../utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ClassValue } from 'clsx'
import { Filter } from '../Filter'
import { useTableContext } from '../../hooks/useTableContext'
import If from '@/components/If'
import { Button } from '@/components/ui/button'

type TableColumnHeaderProps<TData> = {
    header: Header<TData, any>
    className?: ClassValue
}

const TableColumnHeader = <T,>({
    header,
    className,
}: TableColumnHeaderProps<T>) => {
    const { table } = useTableContext()

    const enableReorder =
        header.column.columnDef.meta?.enableColumnOrdering ?? true

    const enableMenu = header.column.columnDef.meta?.enableMenu ?? true

    const layout = table.options.meta?.layout ?? 'default'

    const canSort = header.column.getCanSort()

    const headerClassName =
        header.column.columnDef.meta?.header?.className ||
        table.options.meta?.header?.className

    const isPinned = header.column.getIsPinned()
    const isGrouped = header.column.getIsGrouped()

    const { attributes, isDragging, listeners, transform } = useSortable({
        id: header.column.id,
    })

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition: 'width transform 0.2s ease-in-out',
        width: header.getSize(),
        zIndex: isDragging ? 1 : 0,
    }

    const renderContent = () => {
        if (header.isPlaceholder) return null

        return flexRender(header.column.columnDef.header, header.getContext())
    }

    return (
        <div
            key={header.id}
            style={{
                ...style,
                ...getCommonPinningStyles(header.column, header.getSize()),
            }}
            className={cn(
                'group text-sm bg-background overflow-hidden font-semibold p-3.5 shrink-0',
                '[&:nth-last-child(1_of_[data-pinned="left"])]:border-r [&:nth-last-child(1_of_[data-pinned="left"])]:inset-shadow-[-7px_0_9px_-7px_rgba(0,0,0,0.1)]',
                '[&:nth-last-child(1_of_[data-pinned="right"])]:border-l [&:nth-last-child(1_of_[data-pinned="right"])]:inset-shadow-[7px_0_9px_-7px_rgba(0,0,0,0.1)]',
                isDragging &&
                    'border-primary border-y-0 border-x-2 border-t-2 z-50 bg-primary/10',
                layout === 'stretch' && 'last-of-type:flex-1 last:border-r-0',
                canSort && 'select-none',
                headerClassName,
                className,
            )}
            data-pinned={isPinned}
        >
            <div className="flex items-center w-full">
                <If
                    condition={isGrouped}
                    onTrue={
                        <div className="mr-2 rounded-full size-2 bg-primary" />
                    }
                />
                <div className="flex-1 truncate">{renderContent()}</div>
                <If
                    condition={enableReorder && !header.isPlaceholder}
                    onTrue={
                        <Button
                            className={cn(
                                'flex items-center justify-center cursor-grab hover:bg-transparent',
                                isDragging && 'cursor-grabbing',
                            )}
                            variant="ghost"
                            size="icon"
                            {...attributes}
                            {...listeners}
                            disabled={!!header.column.getIsPinned()}
                        >
                            <Tally2 className="mt-2 rotate-90 size-4 text-muted-foreground group-hover:text-foreground" />
                        </Button>
                    }
                />
                <If
                    condition={
                        header.column.getIsFiltered() && !header.isPlaceholder
                    }
                    onTrue={
                        <button className="w-4 h-4">
                            <FilterIcon
                                size={14}
                                className="text-muted-foreground"
                            />
                        </button>
                    }
                />
                <If
                    condition={enableMenu}
                    onTrue={
                        <HeaderActions
                            table={table as Table<T>}
                            header={header}
                        />
                    }
                />
                <If
                    condition={Boolean(isPinned)}
                    onTrue={<Pin className="shrink-0" size={14} />}
                />
                <If
                    condition={
                        header.column.getCanSort() && !header.isPlaceholder
                    }
                    onTrue={
                        {
                            asc: (
                                <ArrowUp
                                    size={14}
                                    className="text-muted-foreground"
                                />
                            ),
                            desc: (
                                <ArrowDown
                                    size={14}
                                    className="text-muted-foreground"
                                />
                            ),
                        }[header.column.getIsSorted() as string]
                    }
                />
                <If
                    condition={
                        header.column.getCanResize() && !header.isPlaceholder
                    }
                    onTrue={
                        <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                                'absolute right-0 rounded-md w-[3px] cursor-col-resize select-none hover:bg-primary-200 top-6 bottom-6 touch-none',
                                header.column.getIsResizing()
                                    ? 'bg-primary'
                                    : 'group-hover:bg-neutral-300',
                            )}
                        />
                    }
                />
            </div>
            <If
                condition={
                    header.column.getCanFilter() && !header.isPlaceholder
                }
                onTrue={<Filter column={header.column} />}
            />
        </div>
    )
}

export default TableColumnHeader
