import { createContext, useContext, type ReactNode } from 'react';
import { useClients } from '../hooks/useClients';

export interface ClientContextType {
  getClients: () => Promise<any[]>;
  createClient: (data: any) => Promise<any>;
  updateClient: (id: string | number, data: any) => Promise<any>;
  deleteClient: (id: string | number) => Promise<boolean>;
  bulkCreateClients: (clients: any[]) => Promise<any>;
  clients: any[];
  loading: boolean;
  error: string | null;
  isError: boolean;
}

const ClientContext = createContext<ClientContextType | null>(null);

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const hookData = useClients();

  return (
    <ClientContext.Provider value={hookData}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient deve ser usado dentro de um ClientProvider');
  }
  return context;
}

export default ClientContext;
