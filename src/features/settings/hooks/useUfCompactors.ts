import { useState, useEffect } from 'react';
import { apiFetch } from '@/api/client';

export interface UfCompactorConfig {
  uf: string;
  header_mappings: {
    codigo?: string[];
    descricao?: string[];
    embalagem?: string[];
    volume?: string[];
    preco?: string[];
  };
  features: {
    split_2_columns?: boolean;
    parallel_tables_split?: boolean;
    matrix_header?: boolean;
    subheaders?: boolean;
    ignore_noise?: boolean;
  };
  updated_at?: string;
  updated_by?: string;
}

export function useUfCompactors() {
  const [configs, setConfigs] = useState<UfCompactorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch('/config/uf-compactors');
      const data = await res.json();
      setConfigs(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar configurações de compactadores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const saveConfig = async (
    uf: string,
    headerMappings: Record<string, string[]>,
    features: Record<string, boolean>
  ) => {
    const res = await apiFetch(`/config/uf-compactors/${uf}`, {
      method: 'PUT',
      body: JSON.stringify({
        header_mappings: headerMappings,
        features
      })
    });
    const data = await res.json();
    await fetchConfigs();
    return data;
  };

  const resetConfig = async (uf: string) => {
    await apiFetch(`/config/uf-compactors/${uf}`, {
      method: 'DELETE'
    });
    await fetchConfigs();
  };

  return {
    configs,
    isLoading,
    error,
    refetch: fetchConfigs,
    saveConfig,
    resetConfig
  };
}
