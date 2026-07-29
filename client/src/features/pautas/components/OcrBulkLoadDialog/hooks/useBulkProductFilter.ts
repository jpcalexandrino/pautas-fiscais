import { useState, useEffect, useMemo } from 'react';
import type { Produto, BulkItem } from '../types';
import { normalizeText } from '../../../utils/ocrHelpers';

interface UseBulkProductFilterProps {
  produtos: Produto[];
  activeItemIdx: number | null;
  activeItem: BulkItem | null;
}

export function useBulkProductFilter({
  produtos,
  activeItemIdx,
  activeItem,
}: UseBulkProductFilterProps) {
  const [productSearch, setProductSearch] = useState('');
  const [embalagemFilter, setEmbalagemFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('');

  const uniqueEmbalagens = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.embalagem) set.add(p.embalagem.toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [produtos]);

  useEffect(() => {
    setProductSearch('');
    setEmbalagemFilter('all');
    setVolumeFilter('');
  }, [activeItemIdx]);

  const filteredProducts = useMemo(() => {
    return produtos.filter((p) => {
      const normSearch = normalizeText(productSearch);
      const matchesSearch =
        normalizeText(p.descricao_interna).includes(normSearch) ||
        (p.gtin_13 && p.gtin_13.includes(normSearch));

      const matchesEmbalagem =
        embalagemFilter === 'all' ||
        (p.embalagem && p.embalagem.toUpperCase().trim() === embalagemFilter);

      const matchesVolume =
        !volumeFilter.trim() ||
        (() => {
          const normFilter = volumeFilter.toLowerCase().replace(/\s*(?:ml|g|l|kg)\b/gi, '').trim();
          const prodVolume = p.conteudo_volume ? String(p.conteudo_volume) : '';
          return (
            prodVolume.includes(normFilter) ||
            p.descricao_interna.toLowerCase().includes(volumeFilter.toLowerCase().trim())
          );
        })();

      return matchesSearch && matchesEmbalagem && matchesVolume;
    });
  }, [produtos, productSearch, embalagemFilter, volumeFilter]);

  const selectedProductsForActiveItem = useMemo(() => {
    if (!activeItem) return [];
    return produtos.filter((p) => activeItem.matchedProductIds.includes(p.id));
  }, [produtos, activeItem?.matchedProductIds]);

  return {
    productSearch,
    setProductSearch,
    embalagemFilter,
    setEmbalagemFilter,
    volumeFilter,
    setVolumeFilter,
    uniqueEmbalagens,
    filteredProducts,
    selectedProductsForActiveItem,
  };
}
