import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import type { ReactNode } from 'react'

type TableDndContextProps = {
    children: ReactNode
}

const TableDndContext = ({ children }: TableDndContextProps) => {
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    return (
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            sensors={sensors}
        >
            {children}
        </DndContext>
    )
}

export default TableDndContext
