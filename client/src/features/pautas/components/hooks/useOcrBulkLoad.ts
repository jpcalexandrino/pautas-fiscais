import { useState } from 'react';
import { toast } from 'sonner';

interface UseOcrBulkLoadProps {
  dataPauta: string;
  contexto: string;
  onConfirmManual: (params: any) => Promise<any>;
  markCellConfirmed: (cellKey: string) => void;
}

export function useOcrBulkLoad({
  dataPauta,
  contexto,
  onConfirmManual,
  markCellConfirmed,
}: UseOcrBulkLoadProps) {
  const [bulkLoadOpen, setBulkLoadOpen] = useState(false);
  const [selectedBulkTable, setSelectedBulkTable] = useState<any | null>(null);

  const handleBulkLoadClick = (tabela: any) => {
    if (!dataPauta) {
      toast.warning('Atenção', {
        description: 'Selecione a Data de Vigência da Pauta no topo antes de iniciar a carga em lote.',
      });
      return;
    }
    setSelectedBulkTable(tabela);
    setBulkLoadOpen(true);
  };

  const handleConfirmBulk = async (payloads: any[]) => {
    let successCount = 0;
    let failCount = 0;
    let lastError = '';

    for (const payload of payloads) {
      try {
        await onConfirmManual({ ...payload, contexto });
        markCellConfirmed(payload.cell_key);
        successCount++;
      } catch (err: any) {
        console.error('Erro na carga em lote do item:', payload.descricao_estado, err);
        lastError = err?.message || String(err);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success('Carga em Lote Concluída', {
        description: `${successCount} itens importados com sucesso.${
          failCount > 0 ? ` ${failCount} falhas. Detalhe: ${lastError}` : ''
        }`,
      });
    } else if (failCount > 0) {
      toast.error('Erro na Carga em Lote', {
        description: `Falha ao importar os ${failCount} itens selecionados. Detalhe: ${lastError}`,
      });
    }
  };

  return {
    bulkLoadOpen,
    setBulkLoadOpen,
    selectedBulkTable,
    handleBulkLoadClick,
    handleConfirmBulk,
  };
}
