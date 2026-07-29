import type { Column } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { Filter } from '../Filter'

export type ColumnFilterType = 'input' | 'select'

type TableColumnFilterProps = {
    column: Column<any>
}

const TableColumnFilter = ({ column }: TableColumnFilterProps) => {
    const filterType: ColumnFilterType =
        (column.columnDef.meta?.header as { columnFilterType?: ColumnFilterType } | undefined)
            ?.columnFilterType ?? 'input'

    const filters: Record<ColumnFilterType, ReactNode> = {
        input: <Filter column={column} />,
        select: <Filter column={column} />,
    }

    return filters[filterType]
}

export default TableColumnFilter
