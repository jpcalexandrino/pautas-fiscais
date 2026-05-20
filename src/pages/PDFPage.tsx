import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Download, Mail } from 'lucide-react';

import { useData, mapFromDb } from '../contexts/DataContext';
import { usePDF } from '../contexts/PDFContext';
import { useAlert } from '../contexts/AlertContext';
import { formatMesReferencia } from '../utils/formatters';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import PDFDocument from '../components/pdf/PDFDocument';
import { PDFEmptyState } from '@/components/pdf/PDFEmptyState';
import { PDFReportCard } from '@/components/pdf/PDFReportCard';

export default function PDFPage() {
  const navigate = useNavigate();
  const { state, saveRows, getClients, getEquipmentByClient, getFaturas } = useData();
  const rows = state.rows;
  const { selectedRows } = usePDF();
  const { showAlert } = useAlert();

  const [equipmentMap, setEquipmentMap] = useState<Record<string, any[]>>({});
  const [previousMonthMap, setPreviousMonthMap] = useState<Record<string, any>>({});
  const [historicalDataMap, setHistoricalDataMap] = useState<Record<string, any[]>>({});
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState<Record<number | string, boolean>>({});
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [openPreviews, setOpenPreviews] = useState<Record<number | string, boolean>>({});
  const [sendingEmail, setSendingEmail] = useState<Record<number | string, boolean>>({});
  const [batchEmailing, setBatchEmailing] = useState(false);

  const selectedData = selectedRows
    .filter((i) => i >= 0 && i < rows.length)
    .map((i) => rows[i]);

  const parseDate = (d: any) => {
    if (!d) return null;
    if (d instanceof Date) return { m: d.getMonth() + 1, y: d.getFullYear() };
    const s = String(d).trim().split(' ')[0];
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) return { m: parseInt(p[1], 10), y: parseInt(p[2], 10) };
      if (p.length === 2) return { m: parseInt(p[0], 10), y: parseInt(p[1], 10) };
    } else if (s.includes('-')) {
      const p = s.split('-');
      if (p.length >= 2) return { m: parseInt(p[1], 10), y: parseInt(p[0], 10) };
    }
    return null;
  };

  const getRowKey = (row: any): string => {
    const inst = String(row.instalacao || '').trim().replace(/^0+/, '');
    const date = parseDate(row.mesReferencia);
    if (date) {
      return `${inst}_${date.y}-${String(date.m).padStart(2, '0')}`;
    }
    return `${inst}_${String(row.mesReferencia || '').trim()}`;
  };

  useEffect(() => {
    async function fetchInitialData() {
      const rawHistory = await getFaturas();
      const allClients = await getClients();
      const dbHistory = (rawHistory || []).map(mapFromDb);
      
      const historyMap = new Map<string, any>();
      dbHistory.forEach((r: any) => historyMap.set(`${getRowKey(r)}`, r));
      rows.forEach((r: any) => historyMap.set(`${getRowKey(r)}`, r));
      
      return { allClients, allHistoryFaturas: Array.from(historyMap.values()) };
    }

    function matchClientForFatura(row: any, allClients: any[]) {
      const cleanUC = (s: any) => String(s || '').trim().replace(/^0+/, '');

      return allClients.find((c: any) => {
        const ucDB = cleanUC(c.uc_number);
        const ucFatura = cleanUC(row.instalacao);
        return ucDB !== '' && ucFatura !== '' && ucDB === ucFatura;
      });
    }

    function findPreviousMonthFatura(row: any, allHistoryFaturas: any[]) {
      const currentRef = parseDate(row.mesReferencia);
      if (!currentRef) return null;

      let targetM = currentRef.m - 1;
      let targetY = currentRef.y;
      if (targetM === 0) { targetM = 12; targetY--; }

      const cleanUC = (s: any) => String(s || '').trim().replace(/^0+/, '');
      const ucFaturaClean = cleanUC(row.instalacao);

      return allHistoryFaturas.find((r: any) => {
        if (ucFaturaClean !== cleanUC(r.instalacao)) return false;
        const rRef = parseDate(r.mesReferencia);
        return rRef && rRef.m === targetM && rRef.y === targetY;
      });
    }

    async function loadExtraData() {
      try {
        const { allClients, allHistoryFaturas } = await fetchInitialData();
        const equipMap: Record<string, any[]> = {};
        const prevMap: Record<string, any> = {};
        const histMap: Record<string, any[]> = {};
        const sugMap: Record<string, string> = {};

        const { apiFetch } = await import('../api/client');

        for (const row of selectedData) {
          const key = getRowKey(row);
          const client = matchClientForFatura(row, allClients);

          if (client) {
            try {
              equipMap[key] = await getEquipmentByClient(client.id);
            } catch (err) {
              console.error('Erro ao carregar equipamentos:', err);
            }
          }

          const prevRow = findPreviousMonthFatura(row, allHistoryFaturas);
          if (prevRow) prevMap[key] = prevRow;

          // Get history for charts (all faturas for this UC)
          const ucFaturaClean = String(row.instalacao || '').trim().replace(/^0+/, '');
          histMap[key] = allHistoryFaturas
            .filter((r: any) => String(r.instalacao || '').trim().replace(/^0+/, '') === ucFaturaClean)
            .sort((a, b) => {
              const dA = parseDate(a.mesReferencia);
              const dB = parseDate(b.mesReferencia);
              if (!dA || !dB) return 0;
              return (dA.y * 12 + dA.m) - (dB.y * 12 + dB.m);
            });

          try {
            const response = await apiFetch('/ai/optimize', {
              method: 'POST',
              body: JSON.stringify({ 
                fatura: row, 
                equipment: equipMap[key] || [],
                previousMonthData: prevMap[key]
              }),
            });

            if (response.ok) {
              const result = await response.json();
              sugMap[key] = result.suggestions;
            }
          } catch (err) {
            console.error('Erro ao obter sugestões de IA:', err);
          }
        }
        setEquipmentMap(equipMap);
        setPreviousMonthMap(prevMap);
        setHistoricalDataMap(histMap);
        setSuggestionsMap(sugMap);
      } catch (err) {
        console.error('Erro ao carregar dados extras:', err);
      }
    }

    if (selectedData.length > 0) {
      loadExtraData();
    }
  }, [selectedData.length, getClients, getEquipmentByClient, rows]);

  const handleDownload = async (row: any, idx: number) => {
    try {
      setDownloading(prev => ({ ...prev, [idx]: true }));
      await saveRows([row]);
      const key = getRowKey(row);
      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <PDFDocument
          data={row}
          equipment={equipmentMap[key] || []}
          previousMonthData={previousMonthMap[key]}
          suggestions={suggestionsMap[key]}
          historicalData={historicalDataMap[key] || []}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${(row.instalacao || 'fatura').replace(/[/\\]/g, '-')}-${(row.mesReferencia || 'ref').replace(/[/\\]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Erro ao gerar/salvar PDF:', err);
      showAlert('Erro ao gerar o PDF. Verifique os dados.', 'Erro', 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleDownloadAll = async () => {
    if (batchDownloading) return;
    try {
      setBatchDownloading(true);
      await saveRows(selectedData);
      const { pdf } = await import('@react-pdf/renderer');
      for (let i = 0; i < selectedData.length; i++) {
        const row = selectedData[i];
        const key = getRowKey(row);
        const doc = (
          <PDFDocument
            data={row}
            equipment={equipmentMap[key] || []}
            previousMonthData={previousMonthMap[key]}
            suggestions={suggestionsMap[key]}
          />
        );
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-${(row.instalacao || 'fatura').replace(/[/\\]/g, '-')}-${(row.mesReferencia || 'ref').replace(/[/\\]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(r => setTimeout(r, 300));
        URL.revokeObjectURL(url);
      }
      showAlert('Todos os PDFs foram gerados e o download foi iniciado.', 'Sucesso', 'success');
    } catch (err) {
      console.error('Erro no download em lote:', err);
      showAlert('Erro ao processar o download em lote.', 'Erro', 'error');
    } finally {
      setBatchDownloading(false);
    }
  };

  const handleSendEmail = async (row: any, idx: number) => {
    try {
      setSendingEmail(prev => ({ ...prev, [idx]: true }));
      await saveRows([row]);
      const key = getRowKey(row);
      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <PDFDocument
          data={row}
          equipment={equipmentMap[key] || []}
          previousMonthData={previousMonthMap[key]}
          suggestions={suggestionsMap[key]}
          historicalData={historicalDataMap[key] || []}
        />
      );
      const blob = await pdf(doc).toBlob();

      const formData = new FormData();
      formData.append('pdf', blob, `relatorio-${(row.instalacao || 'fatura').replace(/[/\\]/g, '-')}.pdf`);
      formData.append('to', 'jalexandrino@cervejariacidadeimperial.com.br');
      formData.append('subject', `Relatório de Energia - ${row.nomeDoSite || row.nomeDoCliente || 'Audit Energy'}`);
      formData.append('body', `Olá,\n\nSegue em anexo o relatório de auditoria energética referente ao mês de ${formatMesReferencia(row.mesReferencia)}.\n\nAtenciosamente,\nEquipe Audit Energy`);

      const { apiUpload } = await import('../api/client');
      const response = await apiUpload('/email/send-pdf', formData);

      if (response.ok) {
        showAlert('E-mail enviado com sucesso!', 'Sucesso', 'success');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar e-mail');
      }
    } catch (err: any) {
      console.error('Erro ao enviar e-mail:', err);
      showAlert(`Erro ao enviar e-mail: ${err.message}`, 'Erro', 'error');
    } finally {
      setSendingEmail(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleSendAllEmails = async () => {
    if (batchEmailing) return;
    try {
      setBatchEmailing(true);
      await saveRows(selectedData);
      const { pdf } = await import('@react-pdf/renderer');
      const { apiUpload } = await import('../api/client');

      for (let i = 0; i < selectedData.length; i++) {
        const row = selectedData[i];
        const key = getRowKey(row);
        const doc = (
          <PDFDocument
            data={row}
            equipment={equipmentMap[key] || []}
            previousMonthData={previousMonthMap[key]}
            suggestions={suggestionsMap[key]}
          />
        );
        const blob = await pdf(doc).toBlob();

        const formData = new FormData();
        formData.append('pdf', blob, `relatorio-${(row.instalacao || 'fatura').replace(/[/\\]/g, '-')}.pdf`);
        formData.append('to', 'jalexandrino@cervejariacidadeimperial.com.br');
        formData.append('subject', `Relatório de Energia - ${row.nomeDoSite || row.nomeDoCliente || 'Audit Energy'}`);
        formData.append('body', `Olá,\n\nSegue em anexo o relatório de auditoria energética referente ao mês de ${formatMesReferencia(row.mesReferencia)}.`);

        await apiUpload('/email/send-pdf', formData);
        await new Promise(r => setTimeout(r, 500));
      }
      showAlert('Todos os e-mails foram enviados com sucesso.', 'Sucesso', 'success');
    } catch (err) {
      console.error('Erro no envio de e-mails em lote:', err);
      showAlert('Erro ao processar o envio de e-mails em lote.', 'Erro', 'error');
    } finally {
      setBatchEmailing(false);
    }
  };

  if (selectedData.length === 0) {
    return <PDFEmptyState onBack={() => navigate({ to: '/dados' })} />;
  }

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios PDF</h1>
          <p className="text-sm text-muted-foreground">Gerencie e exporte os relatórios das faturas selecionadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadAll} disabled={batchDownloading} className="gap-2">
            {batchDownloading ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            Baixar Todos ({selectedData.length})
          </Button>
          <Button variant="outline" onClick={handleSendAllEmails} disabled={batchEmailing} className="gap-2">
            {batchEmailing ? <Spinner className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            E-mail Todos
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {selectedData.map((row, idx) => {
          const key = getRowKey(row);
          return (
            <PDFReportCard 
              key={idx}
              row={row}
              idx={idx}
              equipment={equipmentMap[key] || []}
              previousMonthData={previousMonthMap[key]}
              historicalData={historicalDataMap[key] || []}
              suggestions={suggestionsMap[key]}
              isPreviewOpen={openPreviews[idx]}
              isDownloading={downloading[idx]}
              isSendingEmail={sendingEmail[idx]}
              onTogglePreview={() => setOpenPreviews(prev => ({ ...prev, [idx]: !prev[idx] }))}
              onDownload={() => handleDownload(row, idx)}
              onSendEmail={() => handleSendEmail(row, idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

