import { createFileRoute } from '@tanstack/react-router';
import PautasRevisaoPage from '@features/pautas/pages/PautasRevisaoPage';

export const Route = createFileRoute('/_authenticated/revisao')({
  component: PautasRevisaoPage,
});
