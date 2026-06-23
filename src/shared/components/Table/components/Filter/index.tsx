import { DebouncedInput } from '@/components/DebouncedInput'
import type { Column, Table } from '@tanstack/react-table'
import { useMemo } from 'react'

export const Filter = ({
    column,
    table,
}: {
    column: Column<any, unknown>
    table: Table<any>
}) => {
    const firstValue = table
        .getPreFilteredRowModel()
        .flatRows[0]?.getValue(column.id)

    const columnFilterValue = column.getFilterValue()

    const sortedUniqueValues = useMemo(
        () =>
            typeof firstValue === 'number'
                ? []
                : Array.from(column.getFacetedUniqueValues().keys()).sort(),
        [column.getFacetedUniqueValues()]
    )

    return typeof firstValue === 'number' ? (
        <div className="flex w-full gap-2">
            <DebouncedInput
                type="number"
                min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
                max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
                value={(columnFilterValue as [number, number])?.[0] ?? ''}
                onChange={(value) =>
                    column.setFilterValue((old: [number, number]) => [
                        value,
                        old?.[1],
                    ])
                }
                placeholder={`Min ${
                    column.getFacetedMinMaxValues()?.[0]
                        ? `(${column.getFacetedMinMaxValues()?.[0]})`
                        : ''
                }`}
                className="w-1/2 p-1 border rounded-md bg-background border-input text-foreground text-ellipsis"
            />
            <DebouncedInput
                type="number"
                min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
                max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
                value={(columnFilterValue as [number, number])?.[1] ?? ''}
                onChange={(value) =>
                    column.setFilterValue((old: [number, number]) => [
                        old?.[0],
                        value,
                    ])
                }
                placeholder={`Max ${
                    column.getFacetedMinMaxValues()?.[1]
                        ? `(${column.getFacetedMinMaxValues()?.[1]})`
                        : ''
                }`}
                className="w-1/2 p-1 border rounded-md bg-background border-input text-foreground text-ellipsis"
            />
        </div>
    ) : (
        <>
            <datalist id={column.id + 'list'}>
                {sortedUniqueValues.slice(0, 5000).map((value: any) => (
                    <option value={value} key={value} />
                ))}
            </datalist>
            <DebouncedInput
                type="text"
                value={(columnFilterValue ?? '') as string}
                onChange={(value) => column.setFilterValue(value)}
                placeholder={`Buscar... (${
                    column.getFacetedUniqueValues().size
                })`}
                className="w-full p-1 border rounded-md bg-background border-input text-foreground text-ellipsis"
                list={column.id + 'list'}
            />
            <div className="h-1" />
        </>
    )
}
