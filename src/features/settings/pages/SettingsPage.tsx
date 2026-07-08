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

      {/* Settings Navigation Cards Compact */}
      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors duration-150 cursor-pointer w-full sm:w-[220px]",
              activeTab === 'users'
                ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary shadow-sm"
                : "border-muted bg-card hover:bg-muted/40 text-foreground"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Controle de Usuários</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('terms')}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors duration-150 cursor-pointer w-full sm:w-[220px]",
            activeTab === 'terms'
              ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary shadow-sm"
              : "border-muted bg-card hover:bg-muted/40 text-foreground"
          )}
        >
          <Tag className="w-4 h-4 shrink-0" />
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm font-medium truncate">Termos das Pautas</span>
            {terms.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary shrink-0 ml-2">
                {terms.length}
              </span>
            )}
          </div>
        </button>
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
