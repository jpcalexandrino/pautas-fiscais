// SelectionColumn.tsx
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

type SelectionColumnProps = {
    pagination?: boolean
}

const SelectionColumn = <T, S>({
    pagination,
}: SelectionColumnProps): ColumnDef<T, S> => {
    return {
        id: 'Seleção',
        header: ({ table }) => (
            <Checkbox
                className={cn('w-5 h-5 rounded-full mx-auto')}
                checked={table.getIsAllRowsSelected()}
                onClick={
                    pagination
                        ? table.getToggleAllPageRowsSelectedHandler()
                        : table.getToggleAllRowsSelectedHandler()
                }
            />
        ),
        cell: ({ row }) =>
            row.getCanSelect() && (
                <Checkbox
                    className={cn(
                        'hidden w-5 h-5 rounded-full group-hover:block',
                        row.getIsSelected() && 'block'
                    )}
                    disabled={!row.getCanSelect()}
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
            ),
        size: 56,
        enableResizing: false,
        meta: {
            enableColumnOrdering: false,
            enableMenu: false,
            header: {
                className: 'items-center flex justify-center',
            },
        },
    }
}

export default SelectionColumn
