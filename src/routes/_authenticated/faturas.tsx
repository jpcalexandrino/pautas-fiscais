import { createFileRoute } from '@tanstack/react-router'
import FaturasPage from '@features/faturas/pages/FaturasPage'

export const Route = createFileRoute('/_authenticated/faturas')({
  component: FaturasPage,
})
