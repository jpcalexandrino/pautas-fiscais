import type { Column } from '@tanstack/react-table'
import type { CSSProperties } from 'react'

export const getCommonPinningStyles = <T>(
    column: Column<T>,
    defaultSize: number
): CSSProperties => {
    const isPinned = column.getIsPinned()

    return {
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        // opacity: isPinned ? 0.9 : 1,
        position: isPinned ? 'sticky' : 'relative',
        zIndex: isPinned ? 1 : 0,
        flexShrink: 0,
        width: isPinned ? column.getSize() : defaultSize,
    }
}
