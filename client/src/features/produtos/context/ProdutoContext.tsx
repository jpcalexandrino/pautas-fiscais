import { createContext, useContext, type ReactNode } from 'react';
import { useProdutos } from '../hooks/useProdutos';

const ProdutoContext = createContext<ReturnType<typeof useProdutos> | null>(null);

export function ProdutoProvider({ children }: { children: ReactNode }) {
  const value = useProdutos();
  return <ProdutoContext.Provider value={value}>{children}</ProdutoContext.Provider>;
}

export function useProduto() {
  const ctx = useContext(ProdutoContext);
  if (!ctx) throw new Error('useProduto must be used within ProdutoProvider');
  return ctx;
}
