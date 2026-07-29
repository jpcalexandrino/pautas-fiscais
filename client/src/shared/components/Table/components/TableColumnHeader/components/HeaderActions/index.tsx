import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { type Header, type Table } from '@tanstack/react-table'
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ChevronsUpDown,
    Expand,
    EyeOff,
    FilterIcon,
    Grid2x2X,
    Group,
    Minimize,
    MoreVertical,
    PinOff,
    RotateCcw,
    Ungroup,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Filter } from '../../../Filter'
import Show from '@/components/Show'

interface HeaderActionsProps<TData> {
    header: Header<TData, any>
    table: Table<TData>
}

const HeaderActions = <T,>({ header, table }: HeaderActionsProps<T>) => {
    const headerDef = header.column.columnDef.header
    const headerTitle =
        typeof headerDef === 'function'
            ? ''
            : header.column.columnDef.header?.toString()

    const renderMenuItem =
        header.column.columnDef.meta?.header?.menu?.renderMenuItem

    const menuClassname = header.column.columnDef.meta?.header?.menu?.className

    const canExpand =
        header.column.getIsGrouped() ||
        header.column.columnDef.meta?.row?.isGrouped

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn('rounded-full', menuClassname)}
                    />
                }
            >
                <MoreVertical className="size-3.5 text-muted-foreground group-hover:text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px]">
                <Show
                    when={header.column.getCanFilter()}
                    fallback={
                        <DropdownMenuGroup>
                            <div className="px-4 py-2">
                                <p className="font-semibold">{headerTitle}</p>
                            </div>
                            <DropdownMenuSeparator />
                        </DropdownMenuGroup>
                    }
                >
                    {() => (
                        <DropdownMenuGroup>
                            <div className="px-2 pt-2 space-y-2">
                                <div className="flex gap-2 items-center">
                                    <FilterIcon
                                        size={14}
                                        className="text-muted-foreground"
                                    />
                                    <p className="text-xs font-semibold">
                                        {header.column.columnDef.header?.toString()}
                                    </p>
                                </div>
                                <Filter column={header.column} />
                            </div>
                            <DropdownMenuSeparator />
                        </DropdownMenuGroup>
                    )}
                </Show>
                {renderMenuItem && (
                    <DropdownMenuGroup>
                        {renderMenuItem({ header })}
                        <DropdownMenuSeparator />
                    </DropdownMenuGroup>
                )}
                <DropdownMenuGroup>
                    {header.column.getCanSort() && (
                        <>
                            <DropdownMenuItem
                                className="gap-2 focus:cursor-pointer group"
                                onClick={() =>
                                    header.column.toggleSorting(false)
                                }
                            >
                                <ArrowUp
                                    className="text-muted-foreground group-hover:text-primary-600"
                                    size={14}
                                />{' '}
                                Asc
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 focus:cursor-pointer group"
                                onClick={() =>
                                    header.column.toggleSorting(true)
                                }
                            >
                                <ArrowDown
                                    className="text-muted-foreground group-hover:text-primary-600"
                                    size={14}
                                />
                                Desc
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 focus:cursor-pointer group"
                                onClick={() => {
                                    header.column.clearSorting()
                                }}
                            >
                                <ChevronsUpDown
                                    className="text-muted-foreground group-hover:text-primary-600"
                                    size={14}
                                />
                                Resetar ordem
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {canExpand && (
                        <DropdownMenuItem
                            className="gap-2 focus:cursor-pointer group"
                            onClick={() => {
                                table.toggleAllRowsExpanded()
                            }}
                        >
                            {table.getIsAllRowsExpanded() ? (
                                <>
                                    <Minimize
                                        className="text-muted-foreground group-hover:text-primary-600"
                                        size={14}
                                    />
                                    Minimizar linhas
                                </>
                            ) : (
                                <>
                                    <Expand
                                        className="text-muted-foreground group-hover:text-primary-600"
                                        size={14}
                                    />
                                    Expandir linhas
                                </>
                            )}
                        </DropdownMenuItem>
                    )}
                    {header.column.getCanGroup() && (
                        <DropdownMenuItem
                            className="gap-2 focus:cursor-pointer group"
                            onClick={() => {
                                header.column.toggleGrouping()
                            }}
                        >
                            {header.column.getIsGrouped() ? (
                                <>
                                    <Ungroup
                                        className="text-muted-foreground group-hover:text-primary-600"
                                        size={14}
                                    />
                                    Desagrupar
                                </>
                            ) : (
                                <>
                                    <Group
                                        className="text-muted-foreground group-hover:text-primary-600"
                                        size={14}
                                    />
                                    Agrupar
                                </>
                            )}
                        </DropdownMenuItem>
                    )}
                    {header.column.getCanPin() && (
                        <>
                            <DropdownMenuItem
                                className="gap-2 focus:cursor-pointer group"
                                onClick={() => header.column.pin('left')}
                            >
                                <ArrowLeft
                                    className="text-muted-foreground group-hover:text-primary-600"
                                    size={14}
                                />
                                Fixar à esquerda
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 focus:cursor-pointer group"
                                onClick={() => header.column.pin('right')}
                            >
                                <ArrowRight
                                    className="text-muted-foreground group-hover:text-primary-600"
                                    size={14}
                                />
                                Fixar à direita
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 focus:cursor-pointer group"
                                onClick={() => header.column.pin(false)}
                            >
                                <PinOff
                                    className="text-muted-foreground group-hover:text-primary-600"
                                    size={14}
                                />
                                Desfixar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                </DropdownMenuGroup>
                {header.column.getCanHide() && (
                    <DropdownMenuItem
                        className="gap-2 focus:cursor-pointer group"
                        onClick={() => header.column.toggleVisibility(false)}
                    >
                        <EyeOff
                            className="text-muted-foreground group-hover:text-primary-600"
                            size={14}
                        />{' '}
                        Ocultar
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    className="gap-2 focus:cursor-pointer group"
                    onClick={() => {
                        header.column.clearSorting()
                        header.column.resetSize()
                    }}
                >
                    <RotateCcw
                        className="text-muted-foreground group-hover:text-primary-600"
                        size={14}
                    />
                    Resetar coluna
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="gap-2 focus:cursor-pointer group"
                    onClick={() => {
                        table.reset()
                    }}
                >
                    <Grid2x2X
                        className="text-muted-foreground group-hover:text-primary-600"
                        size={14}
                    />
                    Resetar tabela
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default HeaderActions
