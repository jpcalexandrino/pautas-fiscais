import { useQuery } from '@tanstack/react-query';
import { apiJson, hasAuthToken } from '@/shared/api/http';
import type { Pauta } from '@/shared/types';

export type HomeOcrFile = {
  id: number;
  filename: string;
  uf: string;
  data_pauta?: string;
  total_prices: number;
  confirmed_count: number;
  pending_count: number;
};

export function useHomeDashboard() {
  return useQuery({
    queryKey: ['home-dashboard'],
    enabled: hasAuthToken(),
    queryFn: async () => {
      const [pautas, ocrFiles, produtos, dePara] = await Promise.all([
        apiJson<Pauta[]>('/pautas', undefined, 'Falha ao carregar pautas'),
        apiJson<HomeOcrFile[]>('/pautas/ocr-files', undefined, 'Falha ao carregar OCR'),
        apiJson<unknown[]>('/produtos', undefined, 'Falha ao carregar produtos'),
        apiJson<unknown[]>('/de-para', undefined, 'Falha ao carregar De-Para'),
      ]);

      const pendentesCount = ocrFiles.reduce(
        (acc, file) => acc + (file.pending_count || 0),
        0,
      );

      return {
        pautas,
        ocrFiles,
        stats: {
          pautasCount: pautas.length,
          pendentesCount,
          produtosCount: produtos.length,
          deParaCount: dePara.length,
        },
      };
    },
  });
}
