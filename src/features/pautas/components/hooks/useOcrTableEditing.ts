import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { EstruturaTabela } from '../OcrTablesViewer';

interface UseOcrTableEditingProps {
  tabelas: EstruturaTabela[];
  dbConfirmedCells?: string[];
  filename: string;
  contexto: string;
  updateOcrTables?: (params: {
    filename: string;
    tabelas: any[];
    confirmedCells?: string[];
    contexto?: string;
  }) => Promise<any>;
}

export function useOcrTableEditing({
  tabelas,
  dbConfirmedCells,
  filename,
  contexto,
  updateOcrTables,
}: UseOcrTableEditingProps) {
  const [localTabelas, setLocalTabelas] = useState<EstruturaTabela[]>([]);
  const [confirmedCells, setConfirmedCells] = useState<Set<string>>(new Set());
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [inlineEditingCell, setInlineEditingCell] = useState<{
    tabelaIdx: number;
    rIdx: number;
    cIdx: number;
    value: string;
  } | null>(null);

  const [inlineEditingHeader, setInlineEditingHeader] = useState<{
    tabelaIdx: number;
    cIdx: number;
    value: string;
  } | null>(null);

  // Sincroniza a cópia local quando tabelas externas mudam
  useEffect(() => {
    setLocalTabelas(tabelas);
  }, [tabelas]);

  // Sincroniza as células confirmadas salvas no banco
  useEffect(() => {
    if (dbConfirmedCells) {
      setConfirmedCells(new Set(dbConfirmedCells));
    } else {
      setConfirmedCells(new Set());
    }
  }, [dbConfirmedCells, filename]);

  const handleToggleEditingMode = () => {
    if (isEditingMode) {
      setLocalTabelas(tabelas);
      setIsEditingMode(false);
    } else {
      setLocalTabelas(JSON.parse(JSON.stringify(tabelas)));
      setIsEditingMode(true);
    }
  };

  const handleCellEdit = (tabelaIdx: number, rIdx: number, cIdx: number, value: string) => {
    setLocalTabelas((prev) =>
      prev.map((t) => {
        if (t.tabelaIndex !== tabelaIdx) return t;
        const newRows = [...t.rows];
        newRows[rIdx] = [...newRows[rIdx]];
        newRows[rIdx][cIdx] = value;
        return { ...t, rows: newRows };
      })
    );
  };

  const handleHeaderEdit = (tabelaIdx: number, cIdx: number, value: string) => {
    setLocalTabelas((prev) =>
      prev.map((t) => {
        if (t.tabelaIndex !== tabelaIdx) return t;
        const newHeaders = [...t.headers];
        newHeaders[cIdx] = value;
        return { ...t, headers: newHeaders };
      })
    );
  };

  const handleDeleteRow = (tabelaIdx: number, rIdx: number) => {
    setLocalTabelas((prev) =>
      prev.map((t) => {
        if (t.tabelaIndex !== tabelaIdx) return t;
        const newRows = t.rows.filter((_, idx) => idx !== rIdx);
        return { ...t, rows: newRows };
      })
    );

    setConfirmedCells((prev) => {
      const next = new Set<string>();
      prev.forEach((key) => {
        const parts = key.split('-');
        if (parts.length === 3) {
          const tIdx = parseInt(parts[0], 10);
          const rowIdx = parseInt(parts[1], 10);
          const colIdx = parseInt(parts[2], 10);

          if (tIdx === tabelaIdx) {
            if (rowIdx < rIdx) {
              next.add(key);
            } else if (rowIdx > rIdx) {
              next.add(`${tIdx}-${rowIdx - 1}-${colIdx}`);
            }
          } else {
            next.add(key);
          }
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const handleDeleteTable = (tabelaIdx: number) => {
    setLocalTabelas((prev) => prev.filter((t) => t.tabelaIndex !== tabelaIdx));

    setConfirmedCells((prev) => {
      const next = new Set<string>();
      prev.forEach((key) => {
        const parts = key.split('-');
        if (parts.length === 3) {
          const tIdx = parseInt(parts[0], 10);
          if (tIdx !== tabelaIdx) {
            next.add(key);
          }
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const handleAddRow = (tabelaIdx: number) => {
    setLocalTabelas((prev) =>
      prev.map((t) => {
        if (t.tabelaIndex !== tabelaIdx) return t;
        const newRow = Array(t.headers.length).fill('');
        return { ...t, rows: [...t.rows, newRow] };
      })
    );
  };

  const handleSaveEdits = async () => {
    if (!updateOcrTables) return;
    try {
      await updateOcrTables({
        filename,
        tabelas: localTabelas,
        confirmedCells: Array.from(confirmedCells),
        contexto,
      });
      toast.success('Tabelas atualizadas com sucesso!');
      setIsEditingMode(false);
    } catch (err: any) {
      toast.error('Erro ao salvar alterações', {
        description: err.message || 'Erro inesperado.',
      });
    }
  };

  const handleSaveInlineCell = async (tabelaIdx: number, rIdx: number, cIdx: number, value: string) => {
    const updatedTabelas = localTabelas.map((t) => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newRows = [...t.rows];
      newRows[rIdx] = [...newRows[rIdx]];
      newRows[rIdx][cIdx] = value;
      return { ...t, rows: newRows };
    });
    setLocalTabelas(updatedTabelas);

    if (updateOcrTables) {
      try {
        await updateOcrTables({
          filename,
          tabelas: updatedTabelas,
          confirmedCells: Array.from(confirmedCells),
          contexto,
        });
        toast.success('Célula atualizada com sucesso!');
      } catch (err: any) {
        toast.error('Erro ao salvar alteração', {
          description: err.message || 'Erro inesperado.',
        });
        setLocalTabelas(tabelas);
      }
    }
    setInlineEditingCell(null);
  };

  const handleSaveInlineHeader = async (tabelaIdx: number, cIdx: number, value: string) => {
    const updatedTabelas = localTabelas.map((t) => {
      if (t.tabelaIndex !== tabelaIdx) return t;
      const newHeaders = [...t.headers];
      newHeaders[cIdx] = value;
      return { ...t, headers: newHeaders };
    });
    setLocalTabelas(updatedTabelas);

    if (updateOcrTables) {
      try {
        await updateOcrTables({
          filename,
          tabelas: updatedTabelas,
          confirmedCells: Array.from(confirmedCells),
          contexto,
        });
        toast.success('Cabeçalho atualizado com sucesso!');
      } catch (err: any) {
        toast.error('Erro ao salvar alteração', {
          description: err.message || 'Erro inesperado.',
        });
        setLocalTabelas(tabelas);
      }
    }
    setInlineEditingHeader(null);
  };

  const markCellConfirmed = (cellKey: string) => {
    setConfirmedCells((prev) => {
      const next = new Set(prev);
      next.add(cellKey);
      return next;
    });
  };

  return {
    localTabelas,
    setLocalTabelas,
    confirmedCells,
    setConfirmedCells,
    markCellConfirmed,
    isEditingMode,
    inlineEditingCell,
    setInlineEditingCell,
    inlineEditingHeader,
    setInlineEditingHeader,
    handleToggleEditingMode,
    handleCellEdit,
    handleHeaderEdit,
    handleDeleteRow,
    handleDeleteTable,
    handleAddRow,
    handleSaveEdits,
    handleSaveInlineCell,
    handleSaveInlineHeader,
  };
}
