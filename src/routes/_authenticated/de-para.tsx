import { createFileRoute } from '@tanstack/react-router';
import DeParaPage from '@features/de-para/pages/DeParaPage';

export const Route = createFileRoute('/_authenticated/de-para')({
  component: DeParaPage,
});
