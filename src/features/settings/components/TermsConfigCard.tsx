import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTerms } from '../hooks/useTerms';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export function TermsConfigCard() {
  const [activeType, setActiveType] = useState<'proprio' | 'terceiros'>('proprio');
  const { terms, isLoading, createTerm, deleteTerm } = useTerms(activeType);
  const { user } = useAuth();
  const { showConfirm } = useAlert();
  const isAdmin = user?.role === 'admin';

  const [newTerm, setNewTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;

    setIsSubmitting(true);
    try {
      await createTerm(newTerm.trim(), activeType);
      toast.success('Termo adicionado com sucesso!');
      setNewTerm('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar termo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, termText: string) => {
    const confirmed = await showConfirm(
      `Deseja realmente remover o termo "${termText}"? Novas pautas importadas não filtrarão mais por esta palavra-chave.`,
      'Excluir Termo',
      'error'
    );
    
    if (!confirmed) return;

    try {
      await deleteTerm(id);
      toast.success('Termo removido com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover termo.');
    }
  };

  return (
    <Card className="shadow-lg border border-muted/60 dark:border-muted/30">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Termos de Busca
        </CardTitle>
        <CardDescription>
          Gerencie os termos e marcas que o sistema utiliza para identificar produtos e tabelas nas pautas fiscais.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tabs para distinguir próprio vs terceiros */}
        <div className="flex border-b border-muted">
          <button
            onClick={() => setActiveType('proprio')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeType === 'proprio'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Próprios
          </button>
          <button
            onClick={() => setActiveType('terceiros')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeType === 'terceiros'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Terceiros
          </button>
        </div>

        {isAdmin ? (
          <form onSubmit={handleAddTerm} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="newTerm" className="sr-only">Novo Termo</Label>
              <Input
                id="newTerm"
                placeholder={activeType === 'proprio' ? "Ex: dopamina, imperio, puro malte" : "Ex: heineken, amstel, skol"}
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !newTerm.trim()} className="gap-2 shrink-0">
              {isSubmitting ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </Button>
          </form>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p>Apenas usuários administradores podem adicionar ou remover termos de busca.</p>
          </div>
        )}

        {isLoading && terms.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-6 h-6 text-primary" />
          </div>
        ) : terms.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground text-sm space-y-2">
            <HelpCircle className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p>Nenhum termo cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Termos Ativos ({terms.length})
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {terms.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all duration-200 group animate-fade-in"
                >
                  <span className="text-sm font-medium truncate pr-2 select-all" title={t.termo}>
                    {t.termo}
                  </span>
                  
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id, t.termo)}
                      className="size-7 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-md transition-opacity duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-md flex gap-2">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            <strong>Como funciona:</strong> Ao fazer a leitura de uma pauta fiscal em PDF, o sistema só compactará e exibirá páginas e tabelas que possuam pelo menos um destes termos/palavras-chave em suas linhas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
