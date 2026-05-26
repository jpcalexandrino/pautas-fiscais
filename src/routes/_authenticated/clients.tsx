import { createFileRoute } from '@tanstack/react-router'
import ClientsPage from '@features/clients/pages/ClientsPage'

export const Route = createFileRoute('/_authenticated/clients')({
  component: ClientsPage,
})
