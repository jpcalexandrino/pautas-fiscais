import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface TopMessageProps {
    text: string
    type: 'error' | 'success' | 'loading'
    className?: string
}

const TopMessage = ({ text, type = 'success', className }: TopMessageProps) => {
    let classname = ''

    switch (type) {
        case 'success':
            classname = ''
            break
        case 'loading':
            classname = 'bg-primary/10 text-primary'
            break
        case 'error':
            classname = 'text-destructive bg-destructive/10'
            break
    }
    return (
        <AnimatePresence>
            <motion.div
                className={cn(
                    'mb-4 w-full py-1 text-center text-xs',
                    classname,
                    className
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                {text}
            </motion.div>
        </AnimatePresence>
    )
}

export default TopMessage
