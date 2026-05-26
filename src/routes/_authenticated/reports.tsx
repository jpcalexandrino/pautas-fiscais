import { createFileRoute } from '@tanstack/react-router'
import ReportsPage from '@features/reports/pages/ReportsPage'

export const Route = createFileRoute('/_authenticated/reports')({
  component: ReportsPage,
})
