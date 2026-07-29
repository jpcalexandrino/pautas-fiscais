import { createFileRoute } from '@tanstack/react-router';
import ProdutosPage from '@features/produtos/pages/ProdutosPage';

export const Route = createFileRoute('/_authenticated/produtos')({
  component: ProdutosPage,
});
