import { Button } from '@/components/ui/button'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { type Header, flexRender } from '@tanstack/react-table'
import {
   ArrowDown,
   ArrowLeft,
   ArrowRight,
   ArrowUp,
   ChevronsUpDown,
   EyeOff,
   Pin,
   PinOff,
   RotateCcw,
} from 'lucide-react'

interface HeaderActionsProps<TData> {
   header: Header<TData, any>
}

const HeaderActions = <T,>({ header }: HeaderActionsProps<T>) => {
   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button
               variant="ghost"
               className="flex flex-1 px-1 text-left py-0.5 w-full gap-2 hover:bg-muted hover:text-foreground"
            >
               <div>{header.column.getIsPinned() && <Pin size={14} />}</div>
               <span className="flex-1 overflow-hidden text-black dark:text-white">
                  {header.isPlaceholder
                     ? null
                     : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                       )}
               </span>
               <div>
                  {header.column.getCanSort() &&
                     ({
                        asc: <ArrowUp size={16} />,
                        desc: <ArrowDown size={16} />,
                     }[header.column.getIsSorted() as string] ?? (
                        <ChevronsUpDown size={16} />
                     ))}
               </div>
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" className=" border-neutral-300">
            {header.column.getCanSort() && (
               <>
                  <DropdownMenuItem
                     className="gap-2 focus:cursor-pointer group"
                     onClick={() => header.column.toggleSorting(false)}
                  >
                     <ArrowUp
                        className="text-muted-foreground group-hover:text-foreground"
                        size={14}
                     />{' '}
                     Asc
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="gap-2 focus:cursor-pointer group"
                     onClick={() => header.column.toggleSorting(true)}
                  >
                     <ArrowDown
                        className="text-muted-foreground group-hover:text-foreground"
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
                        className="text-muted-foreground group-hover:text-foreground"
                        size={14}
                     />
                     Resetar ordem
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
               </>
            )}
            <DropdownMenuItem
               className="gap-2 focus:cursor-pointer group"
               onClick={() => header.column.pin('left')}
            >
               <ArrowLeft
                  className="text-muted-foreground group-hover:text-foreground"
                  size={14}
               />
               Fixar à esquerda
            </DropdownMenuItem>
            <DropdownMenuItem
               className="gap-2 focus:cursor-pointer group"
               onClick={() => header.column.pin('right')}
            >
               <ArrowRight
                  className="text-muted-foreground group-hover:text-foreground"
                  size={14}
               />
               Fixar à direita
            </DropdownMenuItem>
            <DropdownMenuItem
               className="gap-2 focus:cursor-pointer group"
               onClick={() => header.column.pin(false)}
            >
               <PinOff
                  className="text-muted-foreground group-hover:text-foreground"
                  size={14}
               />
               Desfixar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
               className="gap-2 focus:cursor-pointer group"
               onClick={() => header.column.toggleVisibility(false)}
            >
               <EyeOff
                  className="text-muted-foreground group-hover:text-foreground"
                  size={14}
               />{' '}
               Ocultar
            </DropdownMenuItem>
            <DropdownMenuItem
               className="gap-2 focus:cursor-pointer group"
               onClick={() => {
                  header.column.clearSorting()
                  header.column.resetSize()
               }}
            >
               <RotateCcw
                  className="text-muted-foreground group-hover:text-foreground"
                  size={14}
               />
               Resetar coluna
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}

export default HeaderActions
