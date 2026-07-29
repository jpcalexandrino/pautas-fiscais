import { createContext, useContext, type ReactNode } from 'react';
import { APP_CONFIG } from '@shared/utils/constants';

interface AppContextType {
  appName: string;
  appVersion: string;
  appDescription: string;
  locale: string;
  currency: string;
}

const AppContext = createContext<AppContextType | null>(null);

/**
 * Provê variáveis globais da aplicação reutilizáveis em todos os componentes
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const value: AppContextType = {
    // Config da aplicação
    appName: APP_CONFIG.name,
    appVersion: APP_CONFIG.version,
    appDescription: APP_CONFIG.description,
    locale: APP_CONFIG.locale,
    currency: APP_CONFIG.currency,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}

export default AppContext;
