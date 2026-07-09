import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useTableContext } from '../../hooks/useTableContext'

type TableRowProps = HTMLAttributes<HTMLDivElement>

const TableRow = forwardRef<HTMLDivElement, TableRowProps>(
    ({ className, children, ...props }, ref) => {
        const { table } = useTableContext()

        if (!table) return null

        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    'flex w-full group [:not(:last-of-type)]:border-b',
                    table.options.meta?.row?.className,
                    className
                )}
            >
                {children}
            </div>
        )
    }
)

export default TableRow
