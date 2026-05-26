import { createContext, useContext, type ReactNode } from 'react';
import { useEquipment } from '../hooks/useEquipment';

export interface EquipmentContextType {
  getEquipmentByClient: (clientId: string | number) => Promise<any[]>;
  createEquipment: (data: any) => Promise<any>;
  updateEquipment: (id: string | number, data: any) => Promise<any>;
  deleteEquipment: (id: string | number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const EquipmentContext = createContext<EquipmentContextType | null>(null);

interface EquipmentProviderProps {
  children: ReactNode;
}

export function EquipmentProvider({ children }: EquipmentProviderProps) {
  const hookData = useEquipment();

  return (
    <EquipmentContext.Provider value={hookData}>
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipmentContext() {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipmentContext deve ser usado dentro de um EquipmentProvider');
  }
  return context;
}

export default EquipmentContext;
