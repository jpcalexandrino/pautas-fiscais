import { cn } from '@/lib/utils'
import { type Header, flexRender } from '@tanstack/react-table'
import type { ClassValue } from 'clsx'
import { getCommonPinningStyles } from '../../utils'

interface TableFooterProps<T> {
    header: Header<T, any>
    className?: ClassValue
}

const TableFooter = <T,>({ header, className }: TableFooterProps<T>) => {
    const style = {
        ...getCommonPinningStyles(header.column, header.column.getSize()),
    }
    return (
        <div
            className={cn(
                'border-r last:border-none p-2 text-sm bg-accent text-accent-foreground font-semibold overflow-hidden text-right last-of-type:flex-1',
                className
            )}
            style={{
                width: header.getSize(),
                ...style,
            }}
        >
            {header.isPlaceholder
                ? null
                : flexRender(
                      header.column.columnDef.footer,
                      header.getContext()
                  )}
        </div>
    )
}

export default TableFooter
