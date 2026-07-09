import { useContext } from 'react'
import { TableContext, type TableContextType } from '../contexts/TableContext'

export const useTableContext = <T>() => {
    const context = useContext(TableContext) as TableContextType<T>

    if (!context)
        throw new Error(
            'useTableContext must be used within a TableContextProvider'
        )

    return context
}
