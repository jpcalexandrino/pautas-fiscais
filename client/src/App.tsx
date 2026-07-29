import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthContextType } from '@/contexts/AuthContext'

const router = createRouter({
  routeTree,
  context: {
    auth: undefined as AuthContextType | undefined,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  const auth = useAuth()

  return (
    <RouterProvider
      router={router}
      context={{ auth }}
    />
  )
}