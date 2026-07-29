import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PaginationButtonProps {
    page: number
    disabled?: boolean
    onClick?: () => void
}

const PaginationButton = ({
    onClick,
    page,
    disabled,
}: PaginationButtonProps) => {
    return (
        <li className="min-w-[24px]">
            <Button
                variant={disabled ? 'default' : 'ghost'}
                size="icon-xs"
                className={cn(
                    'w-full cursor-pointer h-7 text-sm',
                    disabled
                        ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary/95'
                        : 'text-foreground hover:bg-slate-100'
                )}
                onClick={onClick}
                disabled={disabled}
            >
                {page}
            </Button>
        </li>
    )
}

export default PaginationButton
