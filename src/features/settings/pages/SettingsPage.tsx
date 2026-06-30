import React, { useState, useEffect } from 'react';
import { Users, Settings, Tag, Sliders } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTerms } from '../hooks/useTerms';
import UsersPage from '@features/users/pages/UsersPage';
import { TermsConfigCard } from '../components/TermsConfigCard';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ActiveTab = 'users' | 'terms';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { terms } = useTerms();

  // If not admin, the only option is 'terms'
  const [activeTab, setActiveTab] = useState<ActiveTab>('terms');

  useEffect(() => {
    if (isAdmin) {
      setActiveTab('users');
    } else {
      setActiveTab('terms');
    }
  }, [isAdmin]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajuste as preferências e configurações globais do sistema.
        </p>
      </div>

      {/* Settings Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isAdmin && (
          <Card
            onClick={() => setActiveTab('users')}
            className={cn(
              "cursor-pointer transition-all duration-300 border hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
              activeTab === 'users'
                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                : "border-muted bg-card hover:bg-muted/10"
            )}
          >
            <CardContent className="flex items-start gap-4 p-5">
              <div className={cn(
                "p-3 rounded-lg border",
                activeTab === 'users'
                  ? "bg-primary border-primary text-white"
                  : "bg-muted border-muted text-muted-foreground"
              )}>
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base">Controle de Usuários</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gerencie acessos, atribua perfis (admin/user) e controle quem pode usar o sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          onClick={() => setActiveTab('terms')}
          className={cn(
            "cursor-pointer transition-all duration-300 border hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
            activeTab === 'terms'
              ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
              : "border-muted bg-card hover:bg-muted/10"
          )}
        >
          <CardContent className="flex items-start gap-4 p-5">
            <div className={cn(
              "p-3 rounded-lg border",
              activeTab === 'terms'
                ? "bg-primary border-primary text-white"
                : "bg-muted border-muted text-muted-foreground"
            )}>
              <Tag className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base">Termos das Pautas</h3>
                {terms.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                    {terms.length} {terms.length === 1 ? 'termo' : 'termos'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cadastre ou delete os termos e marcas de produtos a serem detectados e lidos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Configuration Panel */}
      <div className="pt-2 border-t border-muted/60 dark:border-muted/30">
        {activeTab === 'users' && isAdmin ? (
          <UsersPage />
        ) : (
          <TermsConfigCard />
        )}
      </div>
    </div>
  );
}
