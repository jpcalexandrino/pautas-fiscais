import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, AlertCircle, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;

    // Split terms by comma, semicolon or new lines
    const parsedTerms = newTerm
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (parsedTerms.length === 0) return;

    setIsSubmitting(true);
    let addedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      for (const termText of parsedTerms) {
        // Client-side case-insensitive duplicate check
        const isDuplicate = terms.some(
          (t) => t.termo.toLowerCase() === termText.toLowerCase()
        );

        if (isDuplicate) {
          skippedCount++;
          continue;
        }

        try {
          await createTerm(termText, activeType);
          addedCount++;
        } catch (err) {
          failedCount++;
        }
      }

      if (parsedTerms.length === 1) {
        if (addedCount === 1) {
          toast.success('Termo adicionado com sucesso!');
        } else if (skippedCount === 1) {
          toast.warning('Este termo já está cadastrado!');
        } else {
          toast.error('Erro ao adicionar o termo.');
        }
      } else {
        toast.success(
          `Adicionados: ${addedCount} | Pulados (já existentes): ${skippedCount}${
            failedCount > 0 ? ` | Erros: ${failedCount}` : ''
          }`
        );
      }
      setNewTerm('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar termos.');
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

  const filteredTerms = terms.filter((t) =>
    t.termo.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            onClick={() => {
              setActiveType('proprio');
              setSearchQuery('');
              setShowSearch(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeType === 'proprio'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Próprios
          </button>
          <button
            onClick={() => {
              setActiveType('terceiros');
              setSearchQuery('');
              setShowSearch(false);
            }}
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
          <form onSubmit={handleAddTerm} className="space-y-1.5">
            <Label htmlFor="newTerm" className="mb-4 font-semibold text-muted-foreground">Cadastre um termo</Label>
            <div className="flex gap-2">
              <Input
                id="newTerm"
                placeholder={
                  activeType === 'proprio'
                    ? "Ex: dopamina, imperio, puro malte (ou separados por vírgula)"
                    : "Ex: heineken, amstel, skol (ou separados por vírgula)"
                }
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting || !newTerm.trim()} className="gap-2 shrink-0">
                {isSubmitting ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p>Apenas usuários administradores podem adicionar ou remover termos de busca.</p>
          </div>
        )}

        {/* Cabeçalho da Lista de Termos com Botão de Busca */}
        {terms.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center border-b border-muted/30 pb-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Termos Ativos ({filteredTerms.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) {
                    setSearchQuery('');
                  }
                }}
                className="h-7 px-2.5 text-muted-foreground hover:text-foreground gap-1.5 text-xs hover:bg-muted"
              >
                <Search className="w-3.5 h-3.5" />
                {showSearch ? 'Fechar busca' : 'Pesquisar'}
              </Button>
            </div>

            {showSearch && (
              <div className="relative animate-fade-in">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Pesquisar termos nesta lista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full h-9"
                />
              </div>
            )}
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
        ) : filteredTerms.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground text-sm space-y-2 animate-fade-in">
            <Search className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p>Nenhum termo corresponde à pesquisa "{searchQuery}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredTerms.map((t) => (
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
                    className="size-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-md transition-opacity duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
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
