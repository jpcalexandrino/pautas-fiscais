import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CloudLightning } from 'lucide-react';
import { useData, mapFromDb } from '../contexts/DataContext';
import { useAlert } from '../contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaturaHistoryTable } from '../components/faturas/FaturaHistoryTable';
import { formatMesReferencia, parseMesReferencia } from '../utils/formatters';
import PDFDocument from '../components/pdf/PDFDocument';
import ClientSelector from '../components/clients/ClientSelector';
import { useFaturas } from '../hooks/useFaturas';
import { FaturaSyncDialog } from '../components/faturas/FaturaSyncDialog';

export default function FaturasPage() {
  const { getFaturas, getClients, getEquipmentByClient } = useData();
  const { showAlert } = useAlert();
  const { syncPowerHub, syncing } = useFaturas();

  const [faturas, setFaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | number>('');

  // Dialog State
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);

  const handleSyncPowerHub = async (params: { installationId: string; referenceMonth: string }) => {
    setIsSyncDialogOpen(false); // Close dialog

    try {
      const result = await syncPowerHub(params);

      const { newImported, duplicatesSkipped, totalFetched } = result.stats || {};

      showAlert(
        <div className="mt-3 space-y-4 w-full">
          <p className="text-sm text-muted-foreground leading-relaxed">
            O processo de sincronização com o PowerHUB foi concluído. Veja o resumo da importação realizada abaixo:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-muted/40 text-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analisadas</span>
              <span className="mt-1 text-2xl font-bold text-foreground">{totalFetched || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-center">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Importadas</span>
              <span className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{newImported || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-center">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Ignoradas</span>
              <span className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{duplicatesSkipped || 0}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded border border-border/60">
            <strong>Observação:</strong> Faturas ignoradas já existiam na nossa base de dados e não foram duplicadas.
          </div>
        </div>,
        'Sincronização Concluída',
        'success'
      );

      // Reload invoices table
      fetchFaturas();
    } catch (err: any) {
      console.error('Erro ao sincronizar com PowerHUB:', err);
      showAlert(
        err.message || 'Ocorreu um erro ao sincronizar com a API PowerHUB.',
        'Erro de Sincronização',
        'error'
      );
    }
  };




  const fetchFaturas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFaturas();
      setFaturas((data || []).map(mapFromDb));
    } catch (err) {
      console.error('Erro ao buscar faturas:', err);
      showAlert('Erro ao carregar o histórico de faturas.', 'Erro', 'error');
    } finally {
      setLoading(false);
    }
  }, [getFaturas, showAlert]);

  useEffect(() => {
    fetchFaturas();
  }, [fetchFaturas]);

  const loadClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    }
  }, [getClients]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);


  const [columnFilters, setColumnFilters] = useState({
    site: '',
    client: '',
    mes: '',
    instalacao: '',
    consumo: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
  };

  const handleClearFilters = () => {
    setColumnFilters({
      site: '',
      client: '',
      mes: '',
      instalacao: '',
      consumo: ''
    });
    setSortConfig({
      key: '',
      direction: null,
    });
  };

  const filteredFaturas = faturas
    .filter(f => {
      // Filtro por cliente selecionado
      if (selectedClientId) {
        const selectedClient = clients.find(c => String(c.id) === String(selectedClientId));
        if (selectedClient) {
          const cleanUC = (s: any) => String(s || '').trim().replace(/^0+/, '');
          const faturaUC = cleanUC(f.instalacao);
          const ucDB = cleanUC(selectedClient.uc_number);

          const ucMatch = ucDB !== '' && faturaUC !== '' && ucDB === faturaUC;
          if (!ucMatch) return false;
        }
      }


      const siteMatch = (f.nomeDoSite || '').toLowerCase().includes(columnFilters.site.toLowerCase());
      const clientMatch = (f.nomeDoCliente || '').toLowerCase().includes(columnFilters.client.toLowerCase());
      const mesMatch = formatMesReferencia(f.mesReferencia).toLowerCase().includes(columnFilters.mes.toLowerCase());
      const instMatch = (f.instalacao || '').toLowerCase().includes(columnFilters.instalacao.toLowerCase());
      const consumoMatch = String(f.medidaConsumoTUSDForaPonta || '').toLowerCase().includes(columnFilters.consumo.toLowerCase());

      return siteMatch && clientMatch && mesMatch && instMatch && consumoMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;

      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
      const key = sortConfig.key;

      let valA, valB;

      if (key === 'site') {
        valA = a.nomeDoSite || '';
        valB = b.nomeDoSite || '';
      } else if (key === 'client') {
        valA = a.nomeDoCliente || '';
        valB = b.nomeDoCliente || '';
      } else if (key === 'mes') {
        const dA = parseMesReferencia(a.mesReferencia);
        const dB = parseMesReferencia(b.mesReferencia);
        valA = dA ? dA.y * 12 + dA.m : 0;
        valB = dB ? dB.y * 12 + dB.m : 0;
      } else if (key === 'instalacao') {
        valA = a.instalacao || '';
        valB = b.instalacao || '';
      } else if (key === 'consumo') {
        valA = Number(a.medidaConsumoTUSDForaPonta) || 0;
        valB = Number(b.medidaConsumoTUSDForaPonta) || 0;
      } else {
        valA = a[key];
        valB = b[key];
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }

      return String(valA || '').localeCompare(String(valB || '')) * multiplier;
    });




  const handleAction = async (fatura: any, action: 'view' | 'download' | 'email') => {
    try {
      setGeneratingId(fatura.id);

      const allClients = await getClients();
      const cleanUC = (s: any) => String(s || '').trim().replace(/^0+/, '');
      const faturaUC = cleanUC(fatura.instalacao);

      const client = allClients.find((c: any) => {
        const ucDB = cleanUC(c.uc_number);
        return ucDB !== '' && faturaUC !== '' && ucDB === faturaUC;
      });

      let equipment: any[] = [];
      if (client) {
        equipment = await getEquipmentByClient(client.id);
      }

      const currentRef = parseMesReferencia(fatura.mesReferencia);
      let previousMonthData = null;
      if (currentRef) {
        let targetM = currentRef.m - 1;
        let targetY = currentRef.y;
        if (targetM === 0) { targetM = 12; targetY--; }
        previousMonthData = faturas.find((r: any) => {
          if (faturaUC !== cleanUC(r.instalacao)) return false;
          const rRef = parseMesReferencia(r.mesReferencia);
          return rRef && rRef.m === targetM && rRef.y === targetY;
        });
      }

      const historicalData = faturas
        .filter((r: any) => cleanUC(r.instalacao) === faturaUC)
        .sort((a, b) => {
          const dA = parseMesReferencia(a.mesReferencia);
          const dB = parseMesReferencia(b.mesReferencia);
          if (!dA || !dB) return 0;
          return (dA.y * 12 + dA.m) - (dB.y * 12 + dB.m);
        });

      let suggestions = null;
      try {
        const { apiFetch } = await import('../api/client');
        const response = await apiFetch('/ai/optimize', {
          method: 'POST',
          body: JSON.stringify({ fatura: fatura, equipment, previousMonthData }),
        });

        if (response.ok) {
          const result = await response.json();
          suggestions = result.suggestions;
        }
      } catch (err) {
        console.error('Erro ao obter sugestões de IA:', err);
      }

      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <PDFDocument
          data={fatura}
          equipment={equipment}
          previousMonthData={previousMonthData}
          suggestions={suggestions}
          historicalData={historicalData}
        />
      );

      const blob = await pdf(doc).toBlob();

      if (action === 'email') {
        const recipient = client?.contact_email?.trim();
        if (!recipient) {
          throw new Error('E-mail de contato do cliente não encontrado. Atualize o cadastro do cliente antes de enviar.');
        }

        const { apiUpload } = await import('../api/client');
        const formData = new FormData();
        const attachmentName = `relatorio-${(fatura.instalacao || 'fatura').replace(/[/\\]/g, '-')}-${(fatura.mesReferencia || 'ref').replace(/[/\\]/g, '-')}.pdf`;
        formData.append('pdf', blob, attachmentName);
        formData.append('to', recipient);
        formData.append('subject', `Relatório de Energia - ${fatura.nomeDoSite || fatura.nomeDoCliente || 'Audit Energy'}`);
        formData.append('body', `Olá,\n\nSegue em anexo o relatório de auditoria energética referente ao mês de ${formatMesReferencia(fatura.mesReferencia)}.\n\nAtenciosamente,\nEquipe Audit Energy`);

        const response = await apiUpload('/email/send-pdf', formData);
        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult?.error || 'Erro ao enviar e-mail');
        }

        showAlert('E-mail enviado com sucesso!', 'Sucesso', 'success');
        return;
      }

      const url = URL.createObjectURL(blob);
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-${(fatura.instalacao || 'fatura').replace(/[/\\]/g, '-')}-${(fatura.mesReferencia || 'ref').replace(/[/\\]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, '_blank');
      }
      setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      showAlert(err.message || 'Erro ao gerar o PDF. Verifique os dados.', 'Erro', 'error');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Faturas</h1>
          <p className="text-sm text-muted-foreground">Consulte faturas salvas no sistema e gere relatórios.</p>
        </div>
        <div className="flex items-center gap-2">
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            onSelect={setSelectedClientId}
            className="w-full md:w-70"
          />
          <Button variant="outline" size="icon" onClick={fetchFaturas} disabled={loading || syncing}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setIsSyncDialogOpen(true)}
            disabled={loading || syncing}
            variant="outline"
            className="gap-2"
          >
            <CloudLightning className={`h-4 w-4 ${syncing ? 'animate-bounce' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar PowerHub'}</span>
          </Button>
        </div>

      </div>

      <Card className="border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          <FaturaHistoryTable
            faturas={filteredFaturas}
            loading={loading}
            columnFilters={columnFilters}
            onFilterChange={handleColumnFilterChange}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            onAction={handleAction}
            generatingId={generatingId}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      <FaturaSyncDialog
        open={isSyncDialogOpen}
        onOpenChange={setIsSyncDialogOpen}
        clients={clients}
        syncing={syncing}
        onSync={handleSyncPowerHub}
      />
    </div>
  );
}
