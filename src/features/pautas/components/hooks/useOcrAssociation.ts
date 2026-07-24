import { useState } from 'react';
import { toast } from 'sonner';
import { useDePara } from '@features/de-para/hooks/useDePara';
import {
  inferItemDescription,
  normalizeText,
  calculateProductMatchScore,
  cleanPriceString,
} from '../../utils/ocrHelpers';

interface Produto {
  id: number;
  descricao_interna: string;
  gtin_13?: string;
  embalagem?: string;
  conteudo_volume?: number;
}

interface SelectedCellData {
  tabelaIdx: number;
  rIdx: number;
  cIdx: number;
  value: string;
  inferredDesc: string;
}

interface UseOcrAssociationProps {
  uf: string;
  dataPauta: string;
  filename: string;
  contexto: string;
  filteredCatalogProducts: Produto[];
  onConfirmManual: (params: any) => Promise<any>;
  markCellConfirmed: (cellKey: string) => void;
}

export function useOcrAssociation({
  uf,
  dataPauta,
  filename,
  contexto,
  filteredCatalogProducts,
  onConfirmManual,
  markCellConfirmed,
}: UseOcrAssociationProps) {
  const { items: deParas } = useDePara(uf);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState<SelectedCellData | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [saveDePara, setSaveDePara] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleCellClick = (
    tabelaIdx: number,
    rIdx: number,
    cIdx: number,
    value: string,
    row: string[],
    headers: string[]
  ) => {
    if (!dataPauta) {
      toast.warning('Atenção', {
        description: 'Selecione a Data de Vigência da Pauta no topo antes de fazer a associação manual.',
      });
      return;
    }

    const inferredDesc = inferItemDescription(row, headers, cIdx, uf);

    setSelectedCellData({
      tabelaIdx,
      rIdx,
      cIdx,
      value,
      inferredDesc,
    });

    const normInferred = normalizeText(inferredDesc);
    const exactDeParaMatches = (deParas || []).filter(
      (dp: any) => normalizeText(dp.termo_descricao_estado) === normInferred
    );

    if (exactDeParaMatches.length > 0) {
      setSelectedProductIds(exactDeParaMatches.map((dp: any) => dp.fk_produto));
      setSaveDePara(false);
    } else {
      const bestMatch = filteredCatalogProducts
        .map((p) => ({
          p,
          score: calculateProductMatchScore(inferredDesc, p),
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      setSelectedProductIds(bestMatch ? [bestMatch.p.id] : []);
      setSaveDePara(true);
    }
    setProductSearch('');
    setModalOpen(true);
  };

  const handleConfirmAssociation = async () => {
    if (!selectedCellData || selectedProductIds.length === 0) return;

    setIsSaving(true);
    const cellKey = `${selectedCellData.tabelaIdx}-${selectedCellData.rIdx}-${selectedCellData.cIdx}`;

    try {
      const cleanValue = cleanPriceString(selectedCellData.value);
      const valorNum = parseFloat(cleanValue.replace(',', '.'));

      await onConfirmManual({
        fk_produtos: selectedProductIds,
        uf,
        descricao_estado: selectedCellData.inferredDesc,
        valor_pauta: valorNum,
        data_pauta: dataPauta,
        arquivo_origem: filename,
        salvar_de_para: saveDePara,
        cell_key: cellKey,
        contexto,
      });

      markCellConfirmed(cellKey);

      toast.success('Pauta Gravada', {
        description: `Preço R$ ${valorNum.toFixed(2)} associado com sucesso.`,
      });
      setModalOpen(false);
    } catch (err: any) {
      toast.error('Erro ao gravar', {
        description: err.message || 'Falha ao processar requisição.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    selectedCellData,
    productSearch,
    setProductSearch,
    selectedProductIds,
    setSelectedProductIds,
    saveDePara,
    setSaveDePara,
    isSaving,
    handleCellClick,
    handleConfirmAssociation,
  };
}
