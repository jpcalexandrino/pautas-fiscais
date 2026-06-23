import { createFileRoute } from '@tanstack/react-router';
import PautasDadosPage from '@features/pautas/pages/PautasDadosPage';

export const Route = createFileRoute('/_authenticated/dados')({
  component: PautasDadosPage,
});
