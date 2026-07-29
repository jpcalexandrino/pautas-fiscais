import { createFileRoute } from '@tanstack/react-router';
import PautasImportPage from '@features/pautas/pages/PautasImportPage';

export const Route = createFileRoute('/_authenticated/import')({
  component: PautasImportPage,
});
