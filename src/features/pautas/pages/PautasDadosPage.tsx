import { useState } from 'react';
import { Download, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { usePautas, useEstados } from '../hooks/usePautas';
import { PautasDataTable, formatDateToBR } from '../components/PautasDataTable';
import { toast } from 'sonner';

export default function PautasDadosPage() {
  const { pautas, loading, refetchPautas } = usePautas();
  const { data: estados = [] } = useEstados();
  const [tableInstance, setTableInstance] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const handleRefresh = async () => {
    try {
      await refetchPautas();
    } catch (err) {
      toast.error('Erro ao atualizar', {
        description: err instanceof Error ? err.message : 'Erro inesperado.',
      });
    }
  };

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    try {
      const dataToExport = tableInstance
        ? tableInstance.getFilteredRowModel().rows.map((row: any) => row.original)
        : pautas;

      const rows = dataToExport.map((p: any) => ({
        UF: p.uf,
        Estado: p.nome_estado,
        'Código ERP': p.codigo_interno,
        GTIN: p.gtin_13,
        Produto: p.descricao_interna,
        Embalagem: p.embalagem,
        Volume: p.conteudo_volume != null ? Number(p.conteudo_volume) : null,
        'Valor PMPF': p.valor_pauta != null ? Number(p.valor_pauta) : null,
        Data: formatDateToBR(p.data),
        Arquivo: p.arquivo_origem,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      // Aplica formatação de moeda R$ na coluna 'Valor PMPF' (coluna H, índice 7)
      if (ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: 7 }); // Coluna H
          const cell = ws[cellRef];
          if (cell && typeof cell.v === 'number') {
            cell.z = '"R$ "#,##0.00';
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pautas');

      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
      const filename = `pautas_fiscais_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success('Exportação concluída', {
        description: `Arquivo ${filename} gerado com sucesso.`,
      });
    } catch (err) {
      toast.error('Erro ao exportar XLSX', {
        description: err instanceof Error ? err.message : 'Erro inesperado.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dados de Pauta</h1>
          <p className="text-sm text-muted-foreground">
            Planilhamento consolidado de pautas fiscais processadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || pautas.length === 0 || exporting}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 h-7"
            disabled={loading || pautas.length === 0 || exporting}
          >
            {exporting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Exportar Excel
              </>
            )}
          </Button>
        </div>
      </div>
      <PautasDataTable
        pautas={pautas}
        estados={estados}
        loading={loading}
        getTableInstance={setTableInstance}
      />
    </div>
  );
}
