/**
 * Composição centralizada de todos os providers da aplicação.
 * A ordem importa: providers internos podem depender dos externos.
 *
 * Ordem:
 *   ThemeProvider           (infraestrutura visual, sem deps)
 *   QueryClientProvider     (cache HTTP, sem deps)
 *   AppProvider             (config global, sem deps)
 *   FaturaProvider          (usa useQuery internamente)
 *   ClientProvider          (usa useQuery internamente)
 *   EquipmentProvider       (usa useMutation internamente)
 *   UserProvider            (usa useQuery internamente)
 *   AlertProvider           (UI utilitário, sem deps de domínio)
 */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { AppProvider } from '@/contexts/AppContext';
import { FaturaProvider } from '@features/faturas/context/FaturaContext';
import { ClientProvider } from '@features/clients/context/ClientContext';
import { EquipmentProvider } from '@features/equipment/context/EquipmentContext';
import { UserProvider } from '@features/users/context/UserContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <FaturaProvider>
            <ClientProvider>
              <EquipmentProvider>
                <UserProvider>
                  <AlertProvider>
                    <TooltipProvider>
                      <SidebarProvider
                        style={
                          {
                            '--sidebar-width': 'calc(var(--spacing) * 72)',
                            '--header-height': 'calc(var(--spacing) * 12)',
                          } as React.CSSProperties
                        }
                      >
                        {children}
                        <Toaster position="top-right" richColors />
                      </SidebarProvider>
                    </TooltipProvider>
                  </AlertProvider>
                </UserProvider>
              </EquipmentProvider>
            </ClientProvider>
          </FaturaProvider>
        </AppProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
