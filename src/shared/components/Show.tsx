import type { ReactNode } from 'react'

interface ShowProps {
    when: boolean | undefined | null
    fallback?: ReactNode
    children: ReactNode | (() => ReactNode)
}

export default function Show({ when, fallback = null, children }: ShowProps) {
    if (when) {
        if (typeof children === 'function') {
            return <>{(children as () => ReactNode)()}</>
        }
        return <>{children}</>
    }
    return <>{fallback}</>
}
