import { createFileRoute } from '@tanstack/react-router'
import EquipmentPage from '@features/equipment/pages/EquipmentPage'

export const Route = createFileRoute('/_authenticated/equipment')({
  component: EquipmentPage,
})
