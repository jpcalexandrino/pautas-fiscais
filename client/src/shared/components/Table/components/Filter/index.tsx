import { DebouncedInput } from '@/components/DebouncedInput'
import type { Column } from '@tanstack/react-table'
import { useState } from 'react'
import Datalist from './components/Datalist'
import { ListFilter } from 'lucide-react'

export const Filter = ({ column }: { column: Column<any, unknown> }) => {
    const columnFilterValue = column.getFilterValue()
    const [isOpen, setOpen] = useState(false)

    const columnTitle = column.columnDef.header

    return (
        <>
            {isOpen && <Datalist column={column} />}
            <div className="flex items-center w-full bg-background border border-input gap-2 rounded-lg pl-2.5 h-9 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring mt-2 transition-colors">
                <ListFilter size={14} className="text-muted-foreground shrink-0" />
                <DebouncedInput
                    type="text"
                    value={(columnFilterValue ?? '') as string}
                    onChange={(value) => column.setFilterValue(value)}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    placeholder={`Filtrar por ${columnTitle?.toString().toLowerCase()}`}
                    list={isOpen ? column.id + 'list' : undefined}
                    className="w-full h-full text-xs font-normal bg-transparent border-none outline-none focus:outline-none text-foreground placeholder:text-muted-foreground/70"
                />
            </div>
        </>
    )
}
