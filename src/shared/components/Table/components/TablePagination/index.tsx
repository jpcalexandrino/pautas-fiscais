import { useEffect, type JSX } from 'react'
import { cn } from '@/lib/utils'
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react'

import PaginationButton from './components/PaginationButton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { OnPaginationStateChangeFn } from '../../type'

export const DEFAULT_PAGE_SIZE = 25

const pageSizes = [10, 20, 25, 50, 75, 100, 500, 1000, 5000]

interface TablePaginationProps {
    totalPages: number
    totalItems: number
    selectedPage: number
    pageSize?: number
    enablePageSizeChange?: boolean
    onPaginationChange: OnPaginationStateChangeFn
}

const TablePagination = ({
    totalPages,
    totalItems,
    selectedPage,
    enablePageSizeChange = true,
    pageSize = DEFAULT_PAGE_SIZE,
    onPaginationChange,
}: TablePaginationProps) => {
    const handlePageChange = (page: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: page,
        }))
    }

    const renderPageNumbers = () => {
        const pageButtons: JSX.Element[] = []
        const totalVisiblePages = 5

        if (totalPages === 0) {
            pageButtons.push(
                <PaginationButton key="page-1" page={1} disabled />
            )
        } else if (totalPages <= totalVisiblePages) {
            for (let i = 0; i < totalPages; i++) {
                pageButtons.push(
                    <PaginationButton
                        key={`page-${i}`}
                        page={i + 1}
                        disabled={i === selectedPage}
                        onClick={() => handlePageChange(i)}
                    />
                )
            }
        } else {
            let leftOffset = Math.max(
                0,
                selectedPage - Math.floor(totalVisiblePages / 2)
            )
            let rightOffset = leftOffset + totalVisiblePages - 1

            if (rightOffset >= totalPages) {
                rightOffset = totalPages - 1
                leftOffset = Math.max(0, rightOffset - totalVisiblePages + 1)
            }

            for (let i = leftOffset; i <= rightOffset; i++) {
                pageButtons.push(
                    <PaginationButton
                        key={`page-${i}`}
                        page={i + 1}
                        disabled={i === selectedPage}
                        onClick={() => handlePageChange(i)}
                    />
                )
            }
        }
        return pageButtons
    }

    useEffect(() => {
        if (totalPages !== 0 && selectedPage >= totalPages) {
            handlePageChange(0)
        }
    }, [selectedPage, totalPages])

    const isFirstPage = selectedPage === 0
    const isLastPage = selectedPage >= totalPages - 1

    return (
        <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
                {enablePageSizeChange ? (
                    <>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => {
                                onPaginationChange((prev) => ({
                                    ...prev,
                                    pageSize: Number(value),
                                }))
                            }}
                        >
                            <SelectTrigger className="w-fit">
                                <SelectValue className="text-sm text-muted-foreground" />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizes.map((size) => (
                                    <SelectItem
                                        key={size}
                                        value={size.toString()}
                                    >
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p>de</p>
                    </>
                ) : null}
                <p>
                    <span className="font-semibold">{totalItems}</span>{' '}
                    registros
                </p>
            </div>

            <div className="flex items-center p-2">
                <button
                    className={cn(
                        'text-muted-foreground h-7 w-[24px] flex items-center justify-center',
                        isFirstPage
                            ? 'text-muted-foreground'
                            : 'hover:bg-neutral-100'
                    )}
                    onClick={() => handlePageChange(0)}
                    disabled={isFirstPage}
                >
                    <ChevronsLeft size={18} strokeWidth={2} />
                </button>
                <button
                    className={cn(
                        'text-muted-foreground h-7 w-[24px] flex items-center justify-center',
                        isFirstPage
                            ? 'text-muted-foreground'
                            : 'hover:bg-neutral-100'
                    )}
                    onClick={() =>
                        handlePageChange(Math.max(0, selectedPage - 1))
                    }
                    disabled={isFirstPage}
                >
                    <ChevronLeft size={16} strokeWidth={2} />
                </button>
                <ul className="flex items-center">{renderPageNumbers()}</ul>
                <button
                    className={cn(
                        'text-muted-foreground h-7 w-[24px] flex items-center justify-center',
                        isLastPage
                            ? 'text-muted-foreground'
                            : 'hover:bg-neutral-100'
                    )}
                    onClick={() =>
                        handlePageChange(
                            Math.min(totalPages - 1, selectedPage + 1)
                        )
                    }
                    disabled={isLastPage}
                >
                    <ChevronRight size={16} strokeWidth={2} />
                </button>
                <button
                    className={cn(
                        'text-muted-foreground h-7 w-[24px] flex items-center justify-center',
                        isLastPage
                            ? 'text-muted-foreground'
                            : 'hover:bg-neutral-100'
                    )}
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={isLastPage}
                >
                    <ChevronsRight size={18} strokeWidth={2} />
                </button>
            </div>
        </div>
    )
}

export default TablePagination
