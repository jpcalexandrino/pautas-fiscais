import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Calendar, Layers, ShieldCheck, Check, RefreshCw } from 'lucide-react';
import TableComponent from '@/components/Table';
import { type ColumnDef, type TableState } from '@tanstack/react-table';
import { useAuth } from '@/contexts/AuthContext';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

interface AuditLog {
  id: number;
  fk_usuario: number | null;
  nome_usuario: string | null;
  acao: string;
  detalhes: Record<string, any>;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

const parseOcrAlteration = (alt: string) => {
  const changeRegex = /^Tabela\s+(\d+),\s+L(\d+),\s+col\s+"([^"]+)":\s+"([^"]*)"\s+➔\s+"([^"]*)"$/i;
  const changeMatch = alt.match(changeRegex);
  if (changeMatch) {
    const [, tab, line, col, fromVal, toVal] = changeMatch;
    return {
      type: 'change',
      tabela: tab,
      linha: line,
      coluna: col,
      de: fromVal,
      para: toVal
    };
  }

  const addRegex = /^Tabela\s+(\d+),\s+L(\d+):\s+Adicionou linha\s+\[(.*)\]$/i;
  const addMatch = alt.match(addRegex);
  if (addMatch) {
    const [, tab, line, content] = addMatch;
    return {
      type: 'add',
      tabela: tab,
      linha: line,
      conteudo: content
    };
  }

  const removeRegex = /^Tabela\s+(\d+),\s+L(\d+):\s+Removeu linha\s+\[(.*)\]$/i;
  const removeMatch = alt.match(removeRegex);
  if (removeMatch) {
    const [, tab, line, content] = removeMatch;
    return {
      type: 'remove',
      tabela: tab,
      linha: line,
      conteudo: content
    };
  }

  const removeTableRegex = /^Removeu Tabela\s+(\d+)(?:\s+\(Linhas:\s+(.*)\))?$/i;
  const removeTableMatch = alt.match(removeTableRegex);
  if (removeTableMatch) {
    return {
      type: 'remove_table',
      tabela: removeTableMatch[1],
      linhas: removeTableMatch[2] ? removeTableMatch[2].split(' ; ') : []
    };
  }

  const addTableRegex = /^Adicionou tabela\s+(\d+)$/i;
  const addTableMatch = alt.match(addTableRegex);
  if (addTableMatch) {
    return {
      type: 'add_table',
      tabela: addTableMatch[1]
    };
  }

  return {
    type: 'raw',
    text: alt
  };
};

export default function AuditPage() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(() => sessionStorage.getItem('audit_logs_start_date') || '');
  const [endDate, setEndDate] = useState(() => sessionStorage.getItem('audit_logs_end_date') || '');
  const [actionFilter, setActionFilter] = useState(() => sessionStorage.getItem('audit_logs_action_filter') || 'all');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [tableState, setTableState] = useState<Partial<TableState>>({
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
  });

  useEffect(() => {
    sessionStorage.setItem('audit_logs_start_date', startDate);
  }, [startDate]);

  useEffect(() => {
    sessionStorage.setItem('audit_logs_end_date', endDate);
  }, [endDate]);

  useEffect(() => {
    sessionStorage.setItem('audit_logs_action_filter', actionFilter);
  }, [actionFilter]);

  const { data: logs = [], isLoading, isFetching, refetch } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await apiFetch('/audit');
      if (!response.ok) throw new Error('Falha ao carregar logs de auditoria');
      return await response.json();
    },
    enabled: !!localStorage.getItem('token') && user?.role === 'admin',
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-2 animate-fade-in">
        <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-sm text-muted-foreground">Esta tela é permitida apenas para administradores do sistema.</p>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'IMPORT_ARQUIVO':
        return <span className="inline-flex items-center rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Upload de Pauta</span>;
      case 'ASSOCIACAO_PRODUTO':
        return <span className="inline-flex items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Associação Manual</span>;
      case 'CRIAR_DE_PARA':
        return <span className="inline-flex items-center rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Novo De-Para</span>;
      case 'ATUALIZAR_DE_PARA':
        return <span className="inline-flex items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Editar De-Para</span>;
      case 'EXCLUIR_DE_PARA':
        return <span className="inline-flex items-center rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Excluir De-Para</span>;
      case 'IMPORTACAO_LOTE_DE_PARA':
        return <span className="inline-flex items-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Carga De-Para Lote</span>;
      case 'ATUALIZACAO_TABELA_OCR':
        return <span className="inline-flex items-center rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Editar Tabela OCR</span>;
      case 'EXCLUSAO_PAUTA':
        return <span className="inline-flex items-center rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Exclusão de Pauta</span>;
      case 'EXCLUSAO_ARQUIVO_OCR':
        return <span className="inline-flex items-center rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Exclusão de Arquivo</span>;
      case 'CRIAR_TERMO':
        return <span className="inline-flex items-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Novo Termo</span>;
      case 'EXCLUIR_TERMO':
        return <span className="inline-flex items-center rounded-lg bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20 px-2.5 py-0.5 text-[11px] font-semibold">Excluir Termo</span>;
      default:
        return <span className="inline-flex items-center rounded-lg bg-muted text-muted-foreground border border-border px-2.5 py-0.5 text-[11px] font-semibold">{action}</span>;
    }
  };

  const getActionDetails = (row: AuditLog) => {
    const d = row.detalhes || {};
    switch (row.acao) {
      case 'IMPORT_ARQUIVO':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">{d.filename}</div>
            <div className="text-[10px] text-muted-foreground flex gap-3">
              <span>UF: <strong className="text-foreground">{d.uf}</strong></span>
              <span>Vigência: <strong className="text-foreground">{d.dataPauta}</strong></span>
              <span>Contexto: <strong className="text-foreground capitalize">{d.contexto}</strong></span>
            </div>
          </div>
        );
      case 'EXCLUSAO_PAUTA':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-rose-600 dark:text-rose-400">Pauta Removida ({d.uf})</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
              <span>Vigência: <strong className="text-foreground">{d.data_pauta}</strong></span>
              <span>Preço: <strong className="text-foreground">R$ {d.valor_pauta}</strong></span>
              <span>Justificativa: <strong className="text-foreground">{d.justificativa}</strong></span>
            </div>
          </div>
        );
      case 'EXCLUSAO_ARQUIVO_OCR':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-rose-600 dark:text-rose-400">Arquivo OCR Excluído</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
              <span>Arquivo: <strong className="text-foreground">{d.filename}</strong></span>
              <span>UF: <strong className="text-foreground">{d.uf}</strong></span>
              <span>Contexto: <strong className="text-foreground capitalize">{d.contexto}</strong></span>
            </div>
          </div>
        );
      case 'ASSOCIACAO_PRODUTO':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">&ldquo;{d.descricao_estado}&rdquo;</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 mb-0.5">
              <span>Valor: <strong className="text-foreground">R$ {d.valor_pauta}</strong></span>
              <span>Origem: <strong className="text-foreground">{d.arquivo_origem}</strong></span>
              <span>Contexto: <strong className="text-foreground capitalize">{d.contexto}</strong></span>
              {d.salvouDePara && <span className="text-emerald-600 font-semibold">✓ Salvo De-Para</span>}
            </div>
            {d.produtos_descritores && d.produtos_descritores.length > 0 && (
              <div className="text-[10px] text-muted-foreground truncate">
                Produto(s): <strong className="text-foreground">{d.produtos_descritores.join(', ')}</strong>
              </div>
            )}
          </div>
        );
      case 'CRIAR_DE_PARA':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">&ldquo;{d.termo}&rdquo; ({d.uf})</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
              <span>Associado: <strong className="text-foreground">{d.produto_descricao || `ID: ${d.produto_id}`}</strong></span>
              {d.produto_gtin && <span>GTIN: <strong className="text-foreground">{d.produto_gtin}</strong></span>}
            </div>
          </div>
        );
      case 'ATUALIZAR_DE_PARA':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">&ldquo;{d.termo}&rdquo; ({d.uf})</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="line-through opacity-70">{d.produto_anterior_descricao || `ID: ${d.produto_anterior_id}`}</span>
              <span>➔</span>
              <strong className="text-foreground">{d.produto_novo_descricao || `ID: ${d.produto_novo_id}`}</strong>
            </div>
          </div>
        );
      case 'EXCLUIR_DE_PARA':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-rose-600 dark:text-rose-400">Termo Removido: &ldquo;{d.termo}&rdquo; ({d.uf})</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
              <span>Mapeado: <strong className="text-foreground">{d.produto_descricao || `ID: ${d.produto_id}`}</strong></span>
            </div>
          </div>
        );
      case 'IMPORTACAO_LOTE_DE_PARA':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">Importação Lote De-Para</div>
            <div className="text-[10px] text-muted-foreground flex gap-3">
              <span>Lidos: <strong className="text-foreground">{d.processedCount}</strong></span>
              <span>Novos: <strong className="text-foreground">{d.insertedCount}</strong></span>
              <span>Editados: <strong className="text-foreground">{d.updatedCount}</strong></span>
              {d.errorCount > 0 && <span className="text-rose-500 font-semibold">Erros: {d.errorCount}</span>}
            </div>
          </div>
        );
      case 'ATUALIZACAO_TABELA_OCR':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">Tabela OCR editada</div>
            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
              <span>Arquivo: <strong className="text-foreground">{d.filename}</strong></span>
              <span>Alterações: <strong className="text-foreground">{d.total_alteracoes || (d.alteracoes ? d.alteracoes.length : 0)}</strong></span>
            </div>
          </div>
        );
      case 'CRIAR_TERMO':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">&ldquo;{d.termo}&rdquo;</div>
            <div className="text-[10px] text-muted-foreground">
              Tipo: <strong className="text-foreground capitalize">{d.tipo || 'próprio'}</strong>
            </div>
          </div>
        );
      case 'EXCLUIR_TERMO':
        return (
          <div className="space-y-0.5">
            <div className="font-medium text-pink-600 dark:text-pink-400">Termo Removido: &ldquo;{d.termo}&rdquo;</div>
            <div className="text-[10px] text-muted-foreground">
              Tipo: <strong className="text-foreground capitalize">{d.tipo || 'próprio'}</strong>
            </div>
          </div>
        );
      default:
        return <div className="text-xs">{JSON.stringify(d)}</div>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.acao === actionFilter;
    
    const logDate = new Date(log.created_at);
    const logDateTime = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();

    let matchesStartDate = true;
    if (startDate) {
      const start = new Date(startDate);
      const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      matchesStartDate = logDateTime >= startTime;
    }

    let matchesEndDate = true;
    if (endDate) {
      const end = new Date(endDate);
      const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      matchesEndDate = logDateTime <= endTime;
    }

    return matchesAction && matchesStartDate && matchesEndDate;
  });

  const paginatedLogs = useMemo(() => {
    const pageIndex = tableState.pagination?.pageIndex ?? 0;
    const pageSize = tableState.pagination?.pageSize ?? 20;
    const start = pageIndex * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, tableState.pagination]);

  const columns: ColumnDef<any>[] = [
    {
      accessorFn: (row) => new Date(row.created_at).toLocaleString('pt-BR'),
      id: 'created_at',
      header: 'Data / Hora',
      size: 160,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(row.original.created_at).toLocaleString('pt-BR')}
        </div>
      ),
    },
    {
      accessorFn: (row) => row.user_name || row.nome_usuario || 'Sistema',
      id: 'fk_usuario',
      header: 'Usuário',
      size: 200,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            {row.original.user_name || row.original.nome_usuario || 'Sistema'}
          </div>
          {(row.original.user_email) && (
            <div className="text-[10px] text-muted-foreground pl-5">{row.original.user_email}</div>
          )}
        </div>
      ),
    },
    {
      accessorFn: (row) => {
        switch (row.acao) {
          case 'IMPORT_ARQUIVO': return 'Upload de Pauta';
          case 'ASSOCIACAO_PRODUTO': return 'Associação Manual';
          case 'CRIAR_DE_PARA': return 'Novo De-Para';
          case 'ATUALIZAR_DE_PARA': return 'Editar De-Para';
          case 'EXCLUIR_DE_PARA': return 'Excluir De-Para';
          case 'IMPORTACAO_LOTE_DE_PARA': return 'Carga De-Para Lote';
          case 'ATUALIZACAO_TABELA_OCR': return 'Editar Tabela OCR';
          case 'CRIAR_TERMO': return 'Novo Termo';
          case 'EXCLUIR_TERMO': return 'Excluir Termo';
          default: return row.acao;
        }
      },
      id: 'acao',
      header: 'Ação',
      size: 150,
      cell: ({ row }) => getActionBadge(row.original.acao),
    },
    // {
    //   accessorFn: (row) => {
    //     const d = row.detalhes || {};
    //     switch (row.acao) {
    //       case 'IMPORT_ARQUIVO':
    //         return `${d.filename || ''} (Estado: ${d.uf || ''}, Vigência: ${d.dataPauta || ''}, Contexto: ${d.contexto || ''})`;
    //       case 'ASSOCIACAO_PRODUTO':
    //         return `Termo: "${d.descricao_estado || ''}" (Valor: R$ ${d.valor_pauta || ''}, Origem: ${d.arquivo_origem || ''}, Contexto: ${d.contexto || ''})${d.produtos_descritores ? `, Associado a: ${d.produtos_descritores.join(', ')}` : ''}`;
    //       case 'CRIAR_DE_PARA':
    //         return `Termo: "${d.termo || ''}" (${d.uf || ''}), Associado a: ${d.produto_descricao || ''} (${d.produto_gtin || ''})`;
    //       case 'ATUALIZAR_DE_PARA':
    //         return `Termo: "${d.termo || ''}" (${d.uf || ''}), Alterado de: ${d.produto_anterior_descricao || ''} para: ${d.produto_novo_descricao || ''}`;
    //       case 'EXCLUIR_DE_PARA':
    //         return `Termo Removido: "${d.termo || ''}" (${d.uf || ''}), Mapeado para: ${d.produto_descricao || ''}`;
    //       case 'IMPORTACAO_LOTE_DE_PARA':
    //         return `Importação Lote De-Para: Lidos: ${d.processedCount || 0}, Novos: ${d.insertedCount || 0}, Editados: ${d.updatedCount || 0}`;
    //       case 'ATUALIZACAO_TABELA_OCR':
    //         return `Editar Tabela OCR: Arquivo: ${d.filename || ''}, Contexto: ${d.contexto || ''}${d.alteracoes ? `, Alterações: ${d.alteracoes.join(', ')}` : ''}`;
    //       default:
    //         return JSON.stringify(d);
    //     }
    //   },
    //   id: 'detalhes',
    //   header: 'Detalhes da Operação',
    //   size: 400,
    //   cell: ({ row }) => getActionDetails(row.original),
    // },
    {
      id: 'actions',
      header: 'Ações',
      size: 120,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedAuditLog(row.original)}
          className="text-xs h-8 px-2.5 cursor-pointer font-semibold hover:bg-primary/5 hover:text-primary transition-all rounded-lg"
        >
          Visualizar
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in pb-10 space-y-6 px-2 sm:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Logs de Auditoria
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rastreabilidade e histórico de alterações, uploads de arquivos e mapeamentos De-Para.
          </p>
        </div>
      </div>

      <div className="bg-muted/40 border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Período - De</Label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Data início"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Período - Até</Label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Data fim"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Ação</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="text-xs bg-background h-9 rounded-xl border-border/40 min-w-[170px]">
              <SelectValue placeholder="Filtrar por Ação" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="IMPORT_ARQUIVO">Upload de Pauta</SelectItem>
              <SelectItem value="ASSOCIACAO_PRODUTO">Associação Manual</SelectItem>
              <SelectItem value="CRIAR_DE_PARA">Novo De-Para</SelectItem>
              <SelectItem value="ATUALIZAR_DE_PARA">Editar De-Para</SelectItem>
              <SelectItem value="EXCLUIR_DE_PARA">Excluir De-Para</SelectItem>
              <SelectItem value="IMPORTACAO_LOTE_DE_PARA">Carga De-Para Lote</SelectItem>
              <SelectItem value="ATUALIZACAO_TABELA_OCR">Editar Tabela OCR</SelectItem>
              <SelectItem value="EXCLUSAO_PAUTA">Exclusão de Pauta</SelectItem>
              <SelectItem value="EXCLUSAO_ARQUIVO_OCR">Exclusão de Arquivo OCR</SelectItem>
              <SelectItem value="CRIAR_TERMO">Novo Termo</SelectItem>
              <SelectItem value="EXCLUIR_TERMO">Excluir Termo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(startDate || endDate || actionFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setActionFilter('all');
            }}
            className="text-xs font-semibold hover:text-destructive h-9 px-3 cursor-pointer text-muted-foreground rounded-xl"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando logs de auditoria...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-card shadow-xs border-dashed text-muted-foreground space-y-2">
          <Search className="size-8 mx-auto text-muted-foreground/50" />
          <h3 className="font-semibold text-foreground text-sm">Nenhum log encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Não há registros de log que correspondam aos filtros de busca atuais.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-xs">
          <TableComponent
            className="max-h-[750px]"
            columns={columns}
            data={paginatedLogs}
            tableState={tableState}
            onPaginationChange={(updater: any) => {
              setTableState((prev) => {
                const current = prev.pagination ?? { pageIndex: 0, pageSize: 20 };
                const next = typeof updater === 'function' ? updater(current) : updater;
                return {
                  ...prev,
                  pagination: next,
                };
              });
            }}
            pagination={{
              totalItems: filteredLogs.length,
              totalPages: Math.ceil(filteredLogs.length / (tableState.pagination?.pageSize ?? 20)),
              pageSize: tableState.pagination?.pageSize ?? 20,
            }}
          />
        </div>
      )}
      {/* Dialog Detalhado de Auditoria */}
      <Dialog open={selectedAuditLog !== null} onOpenChange={(open) => !open && setSelectedAuditLog(null)}>
        <DialogContent className="sm:max-w-2xl max-w-2xl w-[92vw] max-h-[85vh] flex flex-col rounded-2xl gap-4 bg-background border border-border/40">
          <DialogHeader className="border-b border-border/30 pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                Detalhamento do Log
              </DialogTitle>
              {selectedAuditLog && getActionBadge(selectedAuditLog.acao)}
            </div>
            <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
              Histórico detalhado do evento registrado pelo sistema.
            </DialogDescription>
          </DialogHeader>

          {selectedAuditLog && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0 scrollbar-thin text-xs">
              {/* Metadata Box */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-muted/30 border border-border/30 rounded-xl">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Usuário Executor</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {selectedAuditLog.user_name || selectedAuditLog.nome_usuario || 'Sistema'}
                  </div>
                  {selectedAuditLog.user_email && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">{selectedAuditLog.user_email}</div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Data / Hora do Evento</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {new Date(selectedAuditLog.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Action Content Panel */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Dados Registrados</h4>
                
                {(() => {
                  const d = selectedAuditLog.detalhes || {};
                  switch (selectedAuditLog.acao) {
                    case 'IMPORT_ARQUIVO':
                      return (
                        <div className="border border-border/30 rounded-xl p-4 space-y-3 bg-card shadow-2xs">
                          <div className="font-semibold text-foreground text-sm border-b border-border/20 pb-2 flex items-center justify-between">
                            <span className="truncate">{d.filename}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">{d.contexto}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Estado (UF): <strong>{d.uf}</strong></div>
                            <div>Vigência da Pauta: <strong>{d.dataPauta}</strong></div>
                          </div>
                        </div>
                      );
                    case 'EXCLUSAO_PAUTA':
                      const pautasAfetadas: any[] = d.pautas_afetadas || [];
                      return (
                        <div className="border border-rose-500/20 bg-rose-500/[0.02] rounded-xl p-4 space-y-3 shadow-2xs">
                          <div className="font-semibold text-rose-600 dark:text-rose-400 text-sm border-b border-rose-500/15 pb-2 flex items-center justify-between">
                            <span>Exclusão de Pauta Fiscal</span>
                            <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full font-bold uppercase">{d.uf || (pautasAfetadas[0]?.uf)}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Data da Pauta: <strong>{d.data_pauta || (pautasAfetadas[0]?.data)}</strong></div>
                            <div>Total de Produtos Afetados: <strong className="text-rose-600 font-bold">{d.total_excluidos || pautasAfetadas.length}</strong></div>
                            {d.apaga_de_para && (
                              <div className="col-span-2 text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 p-1.5 rounded-md border border-rose-500/15">
                                ✕ As associações no histórico De-Para também foram apagadas.
                              </div>
                            )}
                          </div>

                          <div className="bg-background/80 border border-rose-500/15 p-2.5 rounded-lg space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Justificativa da Exclusão:</span>
                            <p className="text-xs italic text-foreground font-medium">{d.justificativa}</p>
                          </div>

                          {/* Lista detalhada dos produtos excluídos e seus valores */}
                          {pautasAfetadas.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Produtos Excluídos ({pautasAfetadas.length})
                              </span>
                              <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/20 max-h-56 overflow-y-auto scrollbar-thin">
                                {pautasAfetadas.map((prod: any, idx: number) => (
                                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/10 transition-colors">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="font-semibold text-foreground truncate" title={prod.produto}>
                                        {prod.produto || 'Produto sem descrição'}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        {prod.codigo_interno && <span>Cód: <strong className="text-foreground">{prod.codigo_interno}</strong></span>}
                                        {prod.gtin_13 && <span>GTIN: <strong className="text-foreground">{prod.gtin_13}</strong></span>}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/15 inline-block">
                                        R$ {Number(prod.valor_pauta || d.valor_pauta).toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    case 'EXCLUSAO_ARQUIVO_OCR':
                      return (
                        <div className="border border-rose-500/20 bg-rose-500/[0.02] rounded-xl p-4 space-y-3 shadow-2xs">
                          <div className="font-semibold text-rose-600 dark:text-rose-400 text-sm border-b border-rose-500/15 pb-2 flex items-center justify-between">
                            <span className="truncate">{d.filename}</span>
                            <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded font-bold uppercase">{d.contexto}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Estado (UF): <strong>{d.uf}</strong></div>
                            <div>Arquivo Removido: <strong>{d.filename}</strong></div>
                          </div>
                        </div>
                      );
                    case 'ASSOCIACAO_PRODUTO':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Termo extraído do PDF</span>
                            <div className="font-semibold text-sm text-foreground bg-muted/40 p-2 border rounded-lg">
                              &ldquo;{d.descricao_estado}&rdquo;
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs border-y py-2.5 my-1">
                            <div>Preço Pauta: <strong className="text-primary font-bold">R$ {d.valor_pauta}</strong></div>
                            <div>Estado (UF): <strong>{d.uf}</strong></div>
                            <div>Arquivo Origem: <strong className="truncate block mt-0.5 max-w-[200px]" title={d.arquivo_origem}>{d.arquivo_origem}</strong></div>
                            <div>Mapeado no contexto: <strong className="capitalize">{d.contexto}</strong></div>
                          </div>
                          {d.produtos_descritores && d.produtos_descritores.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Produtos Associados</span>
                              <div className="space-y-1.5">
                                {d.produtos_descritores.map((prod: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2 p-2 border rounded-lg bg-emerald-500/5 text-emerald-900 dark:text-emerald-300 border-emerald-500/10 font-medium">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{prod}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {d.salvouDePara && (
                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center">
                              ✓ Mapeamento gravado na base De-Para para automações futuras
                            </div>
                          )}
                        </div>
                      );
                    case 'CRIAR_DE_PARA':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Termo Mapeado (De)</span>
                            <div className="font-semibold text-sm text-foreground bg-muted/40 p-2 border rounded-lg">
                              &ldquo;{d.termo}&rdquo; ({d.uf})
                            </div>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Produto Interno (Para)</span>
                            <div className="p-3 border border-emerald-500/10 bg-emerald-500/5 rounded-lg space-y-1">
                              <div className="font-semibold text-foreground">{d.produto_descricao}</div>
                              {d.produto_gtin && <div className="text-[10px] text-muted-foreground">GTIN: {d.produto_gtin}</div>}
                              <div className="text-[9px] text-muted-foreground">ID do Produto: {d.produto_id}</div>
                            </div>
                          </div>
                        </div>
                      );
                    case 'ATUALIZAR_DE_PARA':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Termo Mapeado</span>
                            <div className="font-semibold text-sm text-foreground bg-muted/40 p-2 border rounded-lg">
                              &ldquo;{d.termo}&rdquo; ({d.uf})
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Mapeamento Anterior (De)</span>
                              <div className="p-3 border bg-muted/30 rounded-lg space-y-1 opacity-70">
                                <div className="font-semibold text-muted-foreground line-through">{d.produto_anterior_descricao}</div>
                                {d.produto_anterior_gtin && <div className="text-[10px] text-muted-foreground">GTIN: {d.produto_anterior_gtin}</div>}
                                <div className="text-[9px] text-muted-foreground">ID: {d.produto_anterior_id}</div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Mapeamento Atualizado (Para)</span>
                              <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg space-y-1">
                                <div className="font-semibold text-primary font-bold">{d.produto_novo_descricao}</div>
                                {d.produto_novo_gtin && <div className="text-[10px] text-muted-foreground">GTIN: {d.produto_novo_gtin}</div>}
                                <div className="text-[9px] text-muted-foreground">ID: {d.produto_novo_id}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    case 'EXCLUIR_DE_PARA':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase text-rose-600">Termo Removido</span>
                            <div className="font-semibold text-sm text-rose-700 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg">
                              &ldquo;{d.termo}&rdquo; ({d.uf})
                            </div>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Estava Mapeado para</span>
                            <div className="p-3 border bg-muted/30 rounded-lg space-y-1">
                              <div className="font-semibold text-foreground">{d.produto_descricao}</div>
                              {d.produto_gtin && <div className="text-[10px] text-muted-foreground">GTIN: {d.produto_gtin}</div>}
                              <div className="text-[9px] text-muted-foreground">ID: {d.produto_id}</div>
                            </div>
                          </div>
                        </div>
                      );
                    case 'IMPORTACAO_LOTE_DE_PARA':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 bg-muted/40 border rounded-lg">
                              <div className="text-[10px] text-muted-foreground uppercase font-bold">Lidos</div>
                              <div className="text-lg font-black text-foreground">{d.processedCount}</div>
                            </div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                              <div className="text-[10px] text-emerald-600 uppercase font-bold">Novos</div>
                              <div className="text-lg font-black text-emerald-700">{d.insertedCount}</div>
                            </div>
                            <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                              <div className="text-[10px] text-blue-600 uppercase font-bold">Editados</div>
                              <div className="text-lg font-black text-blue-700">{d.updatedCount}</div>
                            </div>
                            <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                              <div className="text-[10px] text-rose-600 uppercase font-bold">Erros</div>
                              <div className="text-lg font-black text-rose-700">{d.errorCount}</div>
                            </div>
                          </div>
                        </div>
                      );
                    case 'ATUALIZACAO_TABELA_OCR':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="grid grid-cols-2 gap-3 text-xs border-b pb-3">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Arquivo da Pauta</span>
                              <strong className="text-foreground truncate block" title={d.filename}>{d.filename}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Contexto</span>
                              <strong className="text-foreground capitalize block">{d.contexto}</strong>
                            </div>
                          </div>
                          {d.alteracoes && d.alteracoes.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Histórico de Células Editadas ({d.total_alteracoes})</span>
                              <div className="border rounded-xl overflow-hidden bg-background divide-y max-h-72 overflow-y-auto shadow-inner">
                                {d.alteracoes.map((alt: string, i: number) => {
                                  const parsed = parseOcrAlteration(alt);
                                  if (parsed.type === 'change') {
                                    return (
                                      <div key={i} className="p-3 flex flex-col gap-2 text-[11px] hover:bg-muted/10 transition-colors">
                                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                          <span className="bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                            Tab {parsed.tabela} • Linha {parsed.linha}
                                          </span>
                                          <span className="bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                            Coluna: {parsed.coluna}
                                          </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
                                          <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md line-through decoration-rose-500 break-words leading-relaxed flex-1" title={parsed.de}>
                                            {parsed.de || 'vazio'}
                                          </span>
                                          <span className="text-muted-foreground text-xs self-center shrink-0">➔</span>
                                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold break-words leading-relaxed flex-1" title={parsed.para}>
                                            {parsed.para || 'vazio'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  } else if (parsed.type === 'add') {
                                    return (
                                      <div key={i} className="p-2.5 flex flex-col gap-1.5 text-[11px] hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-1.5">
                                          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                            Tab {parsed.tabela} • Adicionou Linha {parsed.linha}
                                          </span>
                                        </div>
                                        <div className="text-muted-foreground bg-muted/20 p-1.5 rounded-lg text-[10px] break-all">
                                          {parsed.conteudo}
                                        </div>
                                      </div>
                                    );
                                  } else if (parsed.type === 'remove') {
                                    return (
                                      <div key={i} className="p-2.5 flex flex-col gap-1.5 text-[11px] hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-1.5">
                                          <span className="bg-rose-500/15 text-rose-700 dark:text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                            Tab {parsed.tabela} • Removeu Linha {parsed.linha}
                                          </span>
                                        </div>
                                        <div className="text-muted-foreground bg-muted/20 p-1.5 rounded-lg text-[10px] line-through opacity-70 break-all">
                                          {parsed.conteudo}
                                        </div>
                                      </div>
                                    );
                                  } else if (parsed.type === 'remove_table') {
                                    return (
                                      <div key={i} className="p-2.5 flex flex-col gap-1.5 text-[11px] hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center justify-between">
                                          <span className="bg-rose-500/15 text-rose-700 dark:text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                            Tabela {parsed.tabela} Removida
                                          </span>
                                          <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                            Tabela inteira excluída {parsed.linhas?.length ? `(${parsed.linhas.length} linha${parsed.linhas.length > 1 ? 's' : ''})` : ''}
                                          </span>
                                        </div>
                                        {parsed.linhas && parsed.linhas.length > 0 && (
                                          <div className="space-y-1 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 max-h-36 overflow-y-auto">
                                            {parsed.linhas.map((linhaStr: string, lIdx: number) => (
                                              <div key={lIdx} className="text-[10px] text-rose-900/80 dark:text-rose-300/80 line-through opacity-80 break-all flex items-start gap-1">
                                                <span className="text-rose-500 font-bold">•</span>
                                                <span>{linhaStr}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } else if (parsed.type === 'add_table') {
                                    return (
                                      <div key={i} className="p-2.5 flex items-center justify-between text-[11px] hover:bg-muted/10 transition-colors">
                                        <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                          Tabela {parsed.tabela} Adicionada
                                        </span>
                                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                          Nova tabela criada
                                        </span>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={i} className="p-2.5 flex items-start gap-1.5 text-[10px] text-muted-foreground">
                                      <span className="text-primary font-bold shrink-0">•</span>
                                      <span>{parsed.text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    case 'CRIAR_TERMO':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Termo Cadastrado</span>
                            <div className="font-semibold text-sm text-foreground bg-muted/40 p-2 border rounded-lg">
                              &ldquo;{d.termo}&rdquo;
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2.5">
                            <div>Tipo do Termo: <strong className="capitalize">{d.tipo || 'próprio'}</strong></div>
                            <div>ID do Registro: <strong>{d.id}</strong></div>
                          </div>
                        </div>
                      );
                    case 'EXCLUIR_TERMO':
                      return (
                        <div className="border rounded-xl p-4 space-y-3 bg-card shadow-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase text-rose-600">Termo Excluído</span>
                            <div className="font-semibold text-sm text-rose-700 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg">
                              &ldquo;{d.termo}&rdquo;
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2.5">
                            <div>Tipo do Termo: <strong className="capitalize">{d.tipo || 'próprio'}</strong></div>
                            <div>ID do Registro: <strong>{d.id}</strong></div>
                          </div>
                        </div>
                      );
                    default:
                      return <pre className="p-3 bg-muted border rounded-xl overflow-x-auto text-[10px]">{JSON.stringify(d, null, 2)}</pre>;
                  }
                })()}
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedAuditLog(null)}>
              Fechar Detalhes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
