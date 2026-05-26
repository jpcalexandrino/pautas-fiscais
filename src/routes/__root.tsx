import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProviders } from '@app/providers/AppProviders'
import { PDFProvider } from '@features/reports/context/ReportContext'

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <PDFProvider>
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools initialIsOpen={false} />
      </PDFProvider>
    </AppProviders>
  ),
})
