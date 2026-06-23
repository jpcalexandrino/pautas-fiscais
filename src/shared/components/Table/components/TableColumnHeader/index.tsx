import { cn } from '@/lib/utils'
import type { ColumnOrderState, Header, Table } from '@tanstack/react-table'
import HeaderActions from './components/HeaderActions'
import { Filter } from '../Filter'
import { type XYCoord, useDrag, useDragDropManager, useDrop } from 'react-dnd'
import { useEffect, useRef } from 'react'
import { GripVertical } from 'lucide-react'

interface TableColumnHeaderProps<TData> {
    header: Header<TData, any>
    table: Table<TData>
}

interface ReorderColumnProps {
    sourceColumnId: string
    targetColumnId: string
    columnOrderState: ColumnOrderState
    // position: 'right' | 'left'
}

// interface GetHoverOffsetProps {
//     targetWidth: number
//     targetRight: number
//     sourceX: number
// }

const reorderColumn = ({
    sourceColumnId,
    targetColumnId,
    columnOrderState,
}: // position
ReorderColumnProps): ColumnOrderState => {
    const targetIdx = columnOrderState.indexOf(targetColumnId)
    const sourceIdx = columnOrderState.indexOf(sourceColumnId)

    columnOrderState.splice(
        targetIdx,
        0,
        columnOrderState.splice(sourceIdx, 1)[0]
    )
    return [...columnOrderState]
}

const TableColumnHeader = <T,>({
    header,
    table,
}: TableColumnHeaderProps<T>) => {
    const { getState, setColumnOrder } = table

    const columnOrderState = getState().columnOrder

    const dragRef = useRef<HTMLDivElement | null>(null)
    const dropRef = useRef<HTMLDivElement | null>(null)
    const dragOffset = useRef<XYCoord | null>(null)

    const dragDropManager = useDragDropManager()
    const monitor = dragDropManager.getMonitor()

    // const getHoverOffset = useCallback(
    //     ({ targetWidth, targetRight, sourceX }: GetHoverOffsetProps) => {
    //         const dropMiddle = targetWidth / 2

    //         const xLimit = targetRight - dropMiddle

    //         return {
    //             isOverLeft: sourceX <= xLimit,
    //             isOverRight: sourceX > xLimit && sourceX <= targetRight,
    //         }
    //     },
    //     []
    // )

    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: 'HEADER',
            item: {
                headerId: header.id,
            },
            collect: (monitor) => {
                return {
                    isDragging: monitor.isDragging(),
                }
            },
        }),
        [header]
    )

    const [, drop] = useDrop<
        { headerId: string },
        unknown,
        { isOverLeft: boolean; isOverRight: boolean }
    >(
        () => ({
            accept: 'HEADER',
            drop: ({ headerId }, monitor) => {
                if (headerId === header.id) return

                const dropOffset = monitor.getClientOffset()

                if (
                    !dropOffset ||
                    !dragOffset?.current ||
                    !dropRef?.current ||
                    !dragRef?.current
                )
                    return

                // const { isOverLeft, isOverRight } = getHoverOffset({
                //     sourceX: dropOffset.x,
                //     targetRight: dropRef.current.getBoundingClientRect().right,
                //     targetWidth: dropRef.current.offsetWidth,
                // })

                // if (isOverLeft) {
                setColumnOrder(
                    reorderColumn({
                        sourceColumnId: headerId,
                        targetColumnId: header.id,
                        columnOrderState: columnOrderState,
                    })
                )
                // }

                // if (isOverRight) {
                //     setColumnOrder(
                //         reorderColumn({
                //             sourceColumnId: header.id,
                //             targetColumnId: headerId,
                //             columnOrderState: columnOrderState,
                //         })
                //     )
                // }
            },
        }),
        [header]
    )

    useEffect(() => {
        monitor.subscribeToOffsetChange(() => {
            dragOffset.current = monitor.getClientOffset()
        })
    }, [monitor])

    drop(dropRef)
    drag(dragRef)

    return (
        <div
            ref={dropRef}
            // className="relative first-of-type:border-l border-neutral-200"
            className="group relative"
        >
            <div
                key={header.id}
                className={cn(
                    `gap-2 px-2 py-1.5 relative space-y-1 group-first-of-type:border-l border-r h-full border-border dark:border-white/15 border-t font-normal overflow-hidden text-muted-foreground text-sm text-ellipsis whitespace-nowrap`,
                    header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                    isDragging && 'opacity-50'
                )}
                style={{
                    width: header.getSize(),
                }}
            >
                <div
                    className="flex items-center gap-1 overflow-hidden"
                    ref={dragRef}
                >
                    <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                        <GripVertical size={12} />
                    </div>
                    <HeaderActions header={header} />
                </div>
                <div className="px-1">
                    {header.column.getCanFilter() ? (
                        <Filter column={header.column} table={table} />
                    ) : null}
                </div>
            </div>
            {header.column.getCanResize() && (
                    <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 h-1/2 w-1 rounded-md cursor-col-resize select-none touch-none transition-all duration-200
                            
                            opacity-0 group-hover:opacity-100
                            bg-slate-400 dark:bg-white hover:bg-primary hover:dark:bg-primary
                            
                            ${header.column.getIsResizing() ? 'bg-primary opacity-100' : ''}
                        `}
                    />
                )}
        </div>
    )
}

export default TableColumnHeader
