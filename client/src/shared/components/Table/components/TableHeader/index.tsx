import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'
import TableHeaderRow from '../TableHeaderRow'
import TableColumnHeader from '../TableColumnHeader'
import { useTableContext } from '../../hooks/useTableContext'

type TableHeaderProps = HTMLAttributes<HTMLDivElement>

const TableHeader = ({ className, ...props }: TableHeaderProps) => {
    const { table } = useTableContext()

    if (!table) return null

    return (
        <div
            {...props}
            className={cn('sticky top-0 z-10 h-auto bg-background', className)}
        >
            {table.getHeaderGroups().map((headerGroup) => (
                <TableHeaderRow
                    key={headerGroup.id}
                    headerGroup={headerGroup}
                    className="w-full"
                >
                    {headerGroup.headers.map((header) => {
                        return (
                            <TableColumnHeader
                                key={header.id}
                                header={header}
                            />
                        )
                    })}
                </TableHeaderRow>
            ))}
        </div>
    )
}

export default TableHeader
