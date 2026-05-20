import { createFileRoute } from '@tanstack/react-router'
import PDFPage from '@/pages/PDFPage'

export const Route = createFileRoute('/_authenticated/relatorio')({
  component: PDFPage,
})
