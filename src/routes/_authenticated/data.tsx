import { createFileRoute } from '@tanstack/react-router'
import DataPage from '@features/data/pages/DataPage'

export const Route = createFileRoute('/_authenticated/data')({
  component: DataPage,
})
