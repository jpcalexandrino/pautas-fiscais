import { createContext, useContext, type ReactNode } from 'react';
import { useDePara } from '../hooks/useDePara';

const DeParaContext = createContext<ReturnType<typeof useDePara> | null>(null);

export function DeParaProvider({ children }: { children: ReactNode }) {
  const value = useDePara();
  return <DeParaContext.Provider value={value}>{children}</DeParaContext.Provider>;
}

export function useDeParaContext() {
  const ctx = useContext(DeParaContext);
  if (!ctx) throw new Error('useDeParaContext must be used within DeParaProvider');
  return ctx;
}
