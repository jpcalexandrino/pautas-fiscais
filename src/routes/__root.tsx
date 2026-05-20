import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider } from '@/contexts/AppContext'
import { DataProvider } from '@/contexts/DataContext'
import { PDFProvider } from '@/contexts/PDFContext'
import { AlertProvider } from '@/contexts/AlertContext'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <DataProvider>
            <PDFProvider>
              <AlertProvider>
                <TooltipProvider>
                  <SidebarProvider
                    style={
                      {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                      } as React.CSSProperties
                    }
                  >
                    <Outlet />
                    <Toaster position="top-right" richColors />
                    <TanStackRouterDevtools />
                    <ReactQueryDevtools initialIsOpen={false} />
                  </SidebarProvider>
                </TooltipProvider>
              </AlertProvider>
            </PDFProvider>
          </DataProvider>
        </AppProvider>
      </QueryClientProvider>
    </ThemeProvider>
  ),
})
