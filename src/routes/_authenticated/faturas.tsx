import { createFileRoute } from '@tanstack/react-router'
import FaturasPage from '@/pages/FaturasPage'

export const Route = createFileRoute('/_authenticated/faturas')({
  component: FaturasPage,
})
