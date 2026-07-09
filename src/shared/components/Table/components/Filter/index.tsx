import { DebouncedInput } from '@/components/DebouncedInput'
import type { Column, Table } from '@tanstack/react-table'
import { useMemo } from 'react'
import { X } from 'lucide-react'

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

    const hasMinFilter = typeof firstValue === 'number' &&
        (columnFilterValue as [number, number])?.[0] !== undefined &&
        (columnFilterValue as [number, number])?.[0] !== '' &&
        (columnFilterValue as [number, number])?.[0] !== null

    const hasMaxFilter = typeof firstValue === 'number' &&
        (columnFilterValue as [number, number])?.[1] !== undefined &&
        (columnFilterValue as [number, number])?.[1] !== '' &&
        (columnFilterValue as [number, number])?.[1] !== null

    const hasTextFilter = typeof firstValue !== 'number' &&
        columnFilterValue !== undefined &&
        columnFilterValue !== '' &&
        columnFilterValue !== null

    return typeof firstValue === 'number' ? (
        <div className="flex w-full gap-2">
            <div className="relative flex items-center w-1/2">
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
                    className="w-full p-1 pr-6 border rounded-md bg-background border-input text-foreground text-ellipsis"
                />
                {hasMinFilter && (
                    <button
                        onClick={() =>
                            column.setFilterValue((old: [number, number]) => [
                                undefined,
                                old?.[1],
                            ])
                        }
                        className="absolute right-1.5 p-0.5 rounded-sm hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                        title="Limpar mínimo"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            <div className="relative flex items-center w-1/2">
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
                    className="w-full p-1 pr-6 border rounded-md bg-background border-input text-foreground text-ellipsis"
                />
                {hasMaxFilter && (
                    <button
                        onClick={() =>
                            column.setFilterValue((old: [number, number]) => [
                                old?.[0],
                                undefined,
                            ])
                        }
                        className="absolute right-1.5 p-0.5 rounded-sm hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                        title="Limpar máximo"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    ) : (
        <>
            <datalist id={column.id + 'list'}>
                {sortedUniqueValues.slice(0, 5000).map((value: any) => (
                    <option value={value} key={value} />
                ))}
            </datalist>
            <div className="relative flex items-center w-full">
                <DebouncedInput
                    type="text"
                    value={(columnFilterValue ?? '') as string}
                    onChange={(value) => column.setFilterValue(value)}
                    placeholder={`Buscar... (${
                        column.getFacetedUniqueValues().size
                    })`}
                    className="w-full p-1 pr-6 border rounded-md bg-background border-input text-foreground text-ellipsis"
                    list={column.id + 'list'}
                />
                {hasTextFilter && (
                    <button
                        onClick={() => column.setFilterValue(undefined)}
                        className="absolute right-1.5 p-0.5 rounded-sm hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                        title="Limpar filtro"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            <div className="h-1" />
        </>
    )
}
