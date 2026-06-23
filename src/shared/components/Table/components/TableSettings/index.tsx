import type { Table } from '@tanstack/react-table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
    RotateCcw,
    Eye,
    EyeOff,
    Settings2,
    PinOff,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
// import TableColumnOrderDialog from '../TableColumnOrderDialog'
// import useDisclosure from '@/hooks/useDisclosure'

interface TableSettingsProps<TData> {
    table: Table<TData>
}

const TableSettings = <T,>({ table }: TableSettingsProps<T>) => {
    // const { isOpen, onClose, onOpen } = useDisclosure()

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 cursor-pointer">
                        <Settings2 size={14} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                                <Eye size={14} />
                                Colunas
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="max-h-75 overflow-y-auto">
                                    <DropdownMenuItem
                                        className="justify-center gap-3 focus:bg-transparent focus:text-neutral-500"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        <button
                                            className="px-1 rounded-md hover:text-foreground hover:bg-muted"
                                            onClick={() => {
                                                table.toggleAllColumnsVisible(
                                                    !table.getIsAllColumnsVisible()
                                                )
                                            }}
                                        >
                                            {table.getIsAllColumnsVisible()
                                                ? 'Ocultar tudo'
                                                : 'Mostrar tudo'}
                                        </button>
                                        <button
                                            className="px-1 rounded-md hover:text-foreground hover:bg-muted"
                                            onClick={() =>
                                                table.resetColumnPinning(true)
                                            }
                                        >
                                            Desfixar tudo
                                        </button>
                                    </DropdownMenuItem>
                                    {table
                                        .getAllColumns()
                                        .filter(
                                            (column) =>
                                                typeof column.accessorFn !==
                                                    'undefined' &&
                                                column.getCanHide()
                                        )
                                        .map((column) => {
                                            return (
                                                <DropdownMenuItem
                                                    key={column.id}
                                                    className="flex items-center justify-between gap-2"
                                                    onClick={(e) =>
                                                        e.preventDefault()
                                                    }
                                                >
                                                    <span>
                                                        {typeof column.columnDef.header === 'string'
                                                            ? column.columnDef.header
                                                            : (column.columnDef.id || column.id || '')}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="p-1 rounded-md hover:bg-muted"
                                                            onClick={() =>
                                                                column.toggleVisibility()
                                                            }
                                                        >
                                                            {column.getIsVisible() ? (
                                                                <Eye
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <EyeOff
                                                                    size={14}
                                                                />
                                                            )}
                                                        </button>
                                                        <button
                                                            className={cn(
                                                                'p-1 rounded-md hover:bg-muted',
                                                                column.getIsPinned() ===
                                                                    'left' &&
                                                                    'text-primary bg-primary/10'
                                                            )}
                                                            onClick={() =>
                                                                column.pin(
                                                                    'left'
                                                                )
                                                            }
                                                        >
                                                            <ArrowLeft
                                                                size={14}
                                                            />
                                                        </button>
                                                        <button
                                                            className={cn(
                                                                'p-1 rounded-md hover:bg-muted',
                                                                column.getIsPinned() ===
                                                                    'right' &&
                                                                    'text-primary bg-primary/10'
                                                            )}
                                                            onClick={() =>
                                                                column.pin(
                                                                    'right'
                                                                )
                                                            }
                                                        >
                                                            <ArrowRight
                                                                size={14}
                                                            />
                                                        </button>
                                                        <button
                                                            className={cn(
                                                                'p-1 rounded-md text-orange-400 hover:bg-muted',
                                                                !column.getIsPinned() &&
                                                                    'text-muted-foreground'
                                                            )}
                                                            onClick={() =>
                                                                column.pin(
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            <PinOff size={14} />
                                                        </button>
                                                    </div>
                                                </DropdownMenuItem>
                                            )
                                        })}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={() => {
                                table.resetColumnOrder()
                                table.reset()
                            }}
                        >
                            <RotateCcw size={14} />
                            Resetar tabela
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            {/* {
                <TableColumnOrderDialog
                    table={table}
                    isOpen={isOpen}
                    onClose={onClose}
                />
            } */}
        </>
    )
}

export default TableSettings
