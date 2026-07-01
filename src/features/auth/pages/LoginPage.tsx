import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User, Lock, DoorOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: '/' });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!', { description: 'Bem-vindo(a)!' });
      navigate({ to: '/' });
    } catch (err: any) {
      toast.error('Ops!', { description: err.message || 'E-mail ou senha incorretos.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="relative z-10 w-full max-w-120 animate-fade-in">
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex items-center justify-center size-16 mb-4 bg-primary dark:bg-primary rounded-md border border-primary dark:border-primary">
            <FileText className="text-white size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Pricer</h1>
          <p className="text-muted-foreground text-sm">Entre com suas credenciais para acessar o sistema</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-sm">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 p-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    placeholder="exemplo@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1.5 size-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              {/* Botão Entrar */}
              <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-bold shadow-sm">
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" /> Entrando...
                  </>
                ) : (
                  <>
                    <DoorOpen className="mr-2 h-4 w-4" /> Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
