import { createFileRoute } from '@tanstack/react-router'
import EquipmentPage from '@/pages/EquipmentPage'

export const Route = createFileRoute('/_authenticated/equipamentos')({
  component: EquipmentPage,
})
