import type { ColumnOrderState, Table } from '@tanstack/react-table'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Settings2 } from 'lucide-react'
import ColumnList from './components/ColumnList'
// import TableColumnOrderDialog from '../TableColumnOrderDialog'
// import useDisclosure from '@/hooks/useDisclosure'

interface TableSettingsProps<TData> {
    table: Table<TData>
    columnOrder: ColumnOrderState
}

const TableSettings = <T,>({ table, columnOrder }: TableSettingsProps<T>) => {
    return (
        <>
            <Sheet modal={false}>
                <SheetTrigger
                    render={
                        <Button
                            className="gap-2 p-0 cursor-pointer w-9 h-9"
                            variant="ghost"
                        />
                    }
                >
                    <Settings2 size={14} />
                </SheetTrigger>
                <SheetContent className="flex flex-col p-0 sm:max-w-[480px]">
                    <SheetHeader className="p-6 pb-0">
                        <SheetTitle>Configurações da tabela</SheetTitle>
                    </SheetHeader>
                    <ColumnList table={table} columnOrder={columnOrder} />
                </SheetContent>
            </Sheet>
        </>
    )
}

export default TableSettings
