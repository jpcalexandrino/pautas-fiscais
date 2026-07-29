/**
 * Composição centralizada dos providers da aplicação.
 * Ordem: Theme → Query → App → User/Produto → Alert → UI shell.
 */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { AppProvider } from '@/contexts/AppContext';
import { UserProvider } from '@features/users/context/UserContext';
import { ProdutoProvider } from '@features/produtos/context/ProdutoContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
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
          <UserProvider>
            <ProdutoProvider>
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
            </ProdutoProvider>
          </UserProvider>
        </AppProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
