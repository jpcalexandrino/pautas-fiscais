import { createFileRoute } from '@tanstack/react-router'
import ImportPage from '@/pages/ImportPage'

export const Route = createFileRoute('/_authenticated/importacao')({
  component: ImportPage,
})
