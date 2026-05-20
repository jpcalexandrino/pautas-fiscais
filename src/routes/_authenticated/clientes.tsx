import { createFileRoute } from '@tanstack/react-router'
import ClientsPage from '@/pages/ClientsPage'

export const Route = createFileRoute('/_authenticated/clientes')({
  component: ClientsPage,
})
