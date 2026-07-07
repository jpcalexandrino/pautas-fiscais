import TextractGatewayService from './TextractGatewayService';
import EstadoRepository from '../repositories/EstadoRepository';
import DeParaProdutoEstadoRepository from '../repositories/DeParaProdutoEstadoRepository';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';
import CalendarioRepository from '../repositories/CalendarioRepository';
import { parseDateToSkData, parseStringToDate } from '../utils/normalize';
import { PDFSplitter } from './PDFSplitter';

export interface ProcessPautaResult {
  autoInserted: number;
  pendingReview: number;
  totalExtracted: number;
  arquivo: string;
}

class PautaFiscalService {
  /**
   * Processa o upload de uma pauta fiscal em PDF.
   */
  async processUpload(
    buffer: Buffer,
    filename: string,
    uf: string,
    dataPauta?: string,
    contexto: string = 'proprio'
  ): Promise<ProcessPautaResult> {
    const estado = await this._getEstado(uf);

    // 1. OCR via Textract (com cache)
    let textractJson: unknown;
    const cachedOcr = await PautaFiscalRepository.findOcrByFilename(filename, contexto);

    if (cachedOcr.rows.length > 0) {
      textractJson = cachedOcr.rows[0].textract_json;
      if (dataPauta) {
        await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta, contexto);
      }
    } else {
      let finalBuffer = buffer;
      if (uf.toUpperCase() === 'SE') {
        try {
          finalBuffer = await PDFSplitter.splitVertically(buffer);
        } catch (err) {
          console.error('Failed to split PDF vertically:', err);
        }
      }
      const textractResult = await TextractGatewayService.extractFromPdf(finalBuffer, filename, uf);
      textractJson = textractResult.data;
      await PautaFiscalRepository.upsertOcr(filename, uf, textractJson, null, dataPauta, contexto);
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
    contexto?: string;
  }): Promise<void> {
    const estado = await this._getEstado(params.uf);
    const fk_data = params.data_pauta ? parseDateToSkData(params.data_pauta) : null;

    if (fk_data && params.data_pauta) {
      const dateObj = parseStringToDate(params.data_pauta);
      if (dateObj) {
        await CalendarioRepository.ensureDate(dateObj);
      }
    }

    const ctx = params.contexto || 'proprio';

    for (const fk_produto of params.fk_produtos) {
      await PautaFiscalRepository.create({
        fk_produto,
        fk_estado: estado.sk_estado,
        fk_data,
        valor_pauta: params.valor_pauta,
        arquivo_origem: params.arquivo_origem,
        status: 'confirmado',
        contexto: ctx
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
      await PautaFiscalRepository.addConfirmedCell(params.arquivo_origem, params.cellKey, ctx);
    }
  }

  private async _getEstado(uf: string) {
    const estadoResult = await EstadoRepository.getByUf(uf);
    if (estadoResult.rows.length === 0) throw new Error(`Estado ${uf} não encontrado`);
    return estadoResult.rows[0];
  }
}

export default new PautaFiscalService();
