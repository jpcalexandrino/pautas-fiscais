import { createFileRoute, Navigate } from '@tanstack/react-router'
import MainLayout from '@shared/components/layout/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'

function AuthGuard() {
  const { isAuthenticated, isLoading, token } = useAuth()

  // Loading com token → mantém layout visível
  if (isLoading && token) {
    return <MainLayout isLoading />
  }

  // Loading inicial sem token
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  // Não autenticado → redirect correto
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <MainLayout />
}

export const Route = createFileRoute('/_authenticated')({
  component: AuthGuard,
})