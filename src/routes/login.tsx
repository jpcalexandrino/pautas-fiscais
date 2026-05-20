import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '@/pages/LoginPage'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: async ({ context }: { context: any }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
})
