import type { Column } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { Filter } from '../Filter'
import type { ColumnFilterType } from '@/tanstack'

type TableColumnFilterProps = {
    column: Column<any>
}

const TableColumnFilter = ({ column }: TableColumnFilterProps) => {
    const filterType: ColumnFilterType =
        column.columnDef.meta?.header?.columnFilterType ?? 'input'

    const filters: Record<ColumnFilterType, ReactNode> = {
        input: <Filter column={column} />,
        select: <Filter column={column} />,
    }

    return filters[filterType]
}

export default TableColumnFilter
