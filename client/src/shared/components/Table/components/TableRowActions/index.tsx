import { Pencil, Trash } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { JSX } from 'react'

interface Action {
    label: string
    icon?: JSX.Element
    action: () => void
}

interface Submenu {
    title: string
    items: Action[]
}

type TableRowActionsProps = {
    actions?: Action[]
    submenus?: Submenu[]
    onClickDelete?: () => void
    onClickEdit?: () => void
}

const TableRowActions = ({
    actions,
    submenus,
    onClickDelete,
    onClickEdit,
}: TableRowActionsProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        className="hover:bg-transparent dark:hover:bg-transparent"
                        size="icon"
                        variant="ghost"
                    />
                }
            >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="w-4 h-4 text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-none" align="end">
                {submenus &&
                    submenus.map((submenu) => (
                        <div key={submenu.title}>
                            <DropdownMenuLabel className="py-1">
                                {submenu.title}
                            </DropdownMenuLabel>
                            {submenu.items.map((action) => (
                                <DropdownMenuItem
                                    className="gap-2"
                                    onClick={action.action}
                                >
                                    {action.icon}
                                    {action.label}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                        </div>
                    ))}
                <DropdownMenuLabel className="py-1">Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions &&
                    actions.map((action) => (
                        <DropdownMenuItem
                            className="gap-2"
                            onClick={action.action}
                        >
                            {action.icon}
                            {action.label}
                        </DropdownMenuItem>
                    ))}
                {onClickEdit && (
                    <DropdownMenuItem className="gap-2" onClick={onClickEdit}>
                        <Pencil size={14} />
                        Editar
                    </DropdownMenuItem>
                )}
                {onClickDelete && (
                    <DropdownMenuItem
                        className="gap-2 text-red-500 focus:text-red-500"
                        onClick={onClickDelete}
                    >
                        <Trash size={14} />
                        Excluir
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default TableRowActions
