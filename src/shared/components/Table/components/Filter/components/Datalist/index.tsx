import type { Column } from '@tanstack/react-table'
import { useMemo } from 'react'

const Datalist = ({ column }: { column: Column<any, unknown> }) => {
    const sortedUniqueValues = useMemo(
        () => Array.from(column.getFacetedUniqueValues().keys()).sort(),
        [column.getFacetedUniqueValues()]
    )
    return (
        <datalist id={column.id + 'list'}>
            {sortedUniqueValues.slice(0, 5000).map((value: any) => (
                <option value={value} key={value} />
            ))}
        </datalist>
    )
}

export default Datalist
