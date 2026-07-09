import type { ReactNode } from 'react'

interface IfProps {
    condition: boolean | undefined | null
    onTrue?: ReactNode
    children?: ReactNode
}

export default function If({ condition, onTrue, children }: IfProps) {
    if (condition) {
        return <>{onTrue ?? children}</>
    }
    return null
}
