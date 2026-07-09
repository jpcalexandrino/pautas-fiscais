import type { ColumnOrderState, Table } from '@tanstack/react-table'
import Item from './components/Item'
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Columns, Eye, EyeOff, FilterX, PinOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface ColumnListProps<T> {
    table: Table<T>
    columnOrder: ColumnOrderState
}

const ColumnList = <T,>({ table }: ColumnListProps<T>) => {
    const { setColumnOrder, getAllColumns } = table

    const columns = getAllColumns()

    const columnOrder = Array.from(
        new Set([...table.getState().columnOrder, ...columns.map((column) => column.id)]),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active && over && active.id !== over.id) {
            setColumnOrder(() => {
                const oldIndex = columnOrder.indexOf(active.id as string)
                const newIndex = columnOrder.indexOf(over.id as string)

                return arrayMove(columnOrder, oldIndex, newIndex)
            })
        }
    }

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    return (
        <ScrollArea>
            <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                sensors={sensors}
                onDragEnd={handleDragEnd}
            >
                <div
                    className="px-4 py-2 focus:bg-transparent focus:text-neutral-500"
                    onClick={(e) => e.preventDefault()}
                >
                    <Button
                        className="flex items-center w-full gap-4 h-[40px] justify-start text-sm hover:text-primary hover:bg-accent"
                        variant={'ghost'}
                        onClick={() => {
                            table.toggleAllColumnsVisible(
                                !table.getIsAllColumnsVisible()
                            )
                        }}
                    >
                        {table.getIsAllColumnsVisible() ? (
                            <>
                                <Eye size={14} />
                                Ocultar tudo
                            </>
                        ) : (
                            <>
                                <EyeOff size={14} />
                                Mostrar tudo
                            </>
                        )}
                    </Button>
                    <Button
                        className="flex items-center w-full gap-4 h-[40px] justify-start text-sm hover:text-primary hover:bg-accent"
                        variant={'ghost'}
                        onClick={() => table.resetColumnFilters()}
                    >
                        <FilterX size={14} />
                        Remover filtros
                    </Button>
                    <Button
                        className="flex items-center w-full gap-4 h-[40px] justify-start text-sm hover:text-primary hover:bg-accent"
                        variant={'ghost'}
                        onClick={() => table.resetColumnPinning(true)}
                        disabled={!table.getIsSomeColumnsPinned()}
                    >
                        <PinOff size={14} />
                        Desfixar tudo
                    </Button>
                    <Button
                        className="flex items-center w-full gap-4 h-[40px] justify-start text-sm hover:text-primary hover:bg-accent"
                        variant={'ghost'}
                        onClick={() => {
                            table.reset()
                            table.resetColumnOrder(true)
                        }}
                    >
                        <RotateCcw size={14} />
                        Resetar tabela
                    </Button>
                    <div className="p-2" />
                    <Separator />
                    <div className="flex items-center gap-2 p-4 font-semibold text-neutral-700">
                        <Columns size={14} />
                        <p>Colunas</p>
                    </div>
                    <SortableContext
                        items={columnOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        {columnOrder.map((ord: string) => {
                            const column = columns.find((col) => col.id === ord)

                            return column ? (
                                <Item
                                    key={column.id}
                                    column={column}
                                    columnOrder={columnOrder}
                                    setColumnOrder={setColumnOrder}
                                />
                            ) : null
                        })}
                    </SortableContext>
                    <div className="p-4" />
                </div>
            </DndContext>
        </ScrollArea>
    )
}

export default ColumnList
