import TextractGatewayService from './TextractGatewayService';
import PautaAIService from './PautaAIService';
import PautaMatchingService, { stripAnnotations } from './PautaMatchingService';
import ProdutoRepository from '../repositories/ProdutoRepository';
import EstadoRepository from '../repositories/EstadoRepository';
import DeParaProdutoEstadoRepository from '../repositories/DeParaProdutoEstadoRepository';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';
import CalendarioRepository from '../repositories/CalendarioRepository';
import { parseDateToSkData, parseStringToDate } from '../utils/normalize';
import type { PautaItemExtraido } from './PautaAIService';

export interface ProcessPautaResult {
  autoInserted: number;
  pendingReview: number;
  totalExtracted: number;
  arquivo: string;
}

class PautaFiscalService {
  /**
   * Processa o upload de uma pauta fiscal em PDF.
   *
   * Fluxo:
   * 1. Envia o PDF ao gateway Textract → recebe JSON bruto
   * 2. Envia o JSON ao AI Gateway → recebe itens estruturados
   * 3. Faz o matching de cada item com o catálogo/De-Para
   * 4. Persiste em batch como confirmado (match automático) ou pendente (revisão manual)
   */
  async processUpload(
    buffer: Buffer,
    filename: string,
    uf: string,
    dataPauta?: string
  ): Promise<ProcessPautaResult> {
    const estado = await this._getEstado(uf);

    // 1. OCR via Textract (com cache)
    let textractJson: unknown;
    const cachedOcr = await PautaFiscalRepository.findOcrByFilename(filename);

    if (cachedOcr.rows.length > 0) {
      textractJson = cachedOcr.rows[0].textract_json;
      if (dataPauta) {
        await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta);
      }
    } else {
      const textractResult = await TextractGatewayService.extractFromPdf(buffer, filename);
      textractJson = textractResult.data;
      await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta);
    }

    return {
      autoInserted: 0,
      pendingReview: 0,
      totalExtracted: 0,
      arquivo: filename,
    };
  }





  async confirmManual(params: {
    fk_produtos: number[];
    uf: string;
    descricao_estado: string;
    valor_pauta: number;
    data_pauta: string;
    arquivo_origem: string;
    salvarDePara?: boolean;
    cellKey?: string;
  }): Promise<void> {
    const estado = await this._getEstado(params.uf);
    const fk_data = params.data_pauta ? parseDateToSkData(params.data_pauta) : null;

    if (fk_data && params.data_pauta) {
      const dateObj = parseStringToDate(params.data_pauta);
      if (dateObj) {
        await CalendarioRepository.ensureDate(dateObj);
      }
    }

    for (const fk_produto of params.fk_produtos) {
      await PautaFiscalRepository.create({
        fk_produto,
        fk_estado: estado.sk_estado,
        fk_data,
        valor_pauta: params.valor_pauta,
        arquivo_origem: params.arquivo_origem,
        status: 'confirmado',
      });

      if (params.salvarDePara) {
        await DeParaProdutoEstadoRepository.create({
          fk_estado_nk: estado.nk_uf,
          termo_descricao_estado: params.descricao_estado,
          fk_produto_sk: fk_produto,
        }).catch(() => {
          // ignora duplicata de De-Para
        });
      }
    }

    if (params.cellKey) {
      await PautaFiscalRepository.addConfirmedCell(params.arquivo_origem, params.cellKey);
    }
  }

  private async _getEstado(uf: string) {
    const estadoResult = await EstadoRepository.getByUf(uf);
    if (estadoResult.rows.length === 0) throw new Error(`Estado ${uf} não encontrado`);
    return estadoResult.rows[0];
  }


}

export default new PautaFiscalService();
