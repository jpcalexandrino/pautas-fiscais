/**
 * TextractGatewayService
 *
 * Responsável por enviar o buffer do PDF ao gateway BSynapse/Textract
 * e retornar o JSON bruto com os dados extraídos pelo OCR.
 *
 * Variáveis de ambiente necessárias:
 *   SYNAPSE_API_URL        — URL base do gateway BSynapse
 *   SYNAPSE_API_KEY        — Chave de autenticação
 *   SYNAPSE_TEXTRACT_SLUG  — Slug do endpoint Textract no BSynapse
 */

export interface TextractGatewayResult {
  /** JSON bruto retornado pelo gateway Textract. Pode ter qualquer estrutura. */
  data: unknown;
  /** Nome do arquivo original, para rastreabilidade. */
  filename: string;
}

class TextractGatewayService {
  /**
   * Envia o buffer do PDF ao BSynapse/Textract e retorna o JSON bruto.
   */
  async extractFromPdf(
    buffer: Buffer,
    filename: string,
    uf?: string
  ): Promise<TextractGatewayResult> {
    const SYNAPSE_API_URL = process.env.SYNAPSE_API_URL;
    const SYNAPSE_API_KEY = process.env.SYNAPSE_API_KEY_TEXTRACT;
    const SYNAPSE_TEXTRACT_SLUG = process.env.SYNAPSE_TEXTRACT_SLUG;

    if (!SYNAPSE_API_URL || !SYNAPSE_API_KEY || !SYNAPSE_TEXTRACT_SLUG) {
      throw new Error(
        'Gateway Textract: SYNAPSE_API_URL, SYNAPSE_API_KEY e SYNAPSE_TEXTRACT_SLUG devem estar configurados.'
      );
    }

    const format = (uf && ['SE', 'SP'].includes(uf.toUpperCase())) ? 'csv' : 'json';
    const fullUrl = `${SYNAPSE_API_URL}/${SYNAPSE_TEXTRACT_SLUG}/direct?format=${format}`;

    // O endpoint /direct espera multipart/form-data com o PDF na chave "file"
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
    formData.append('file', blob, filename);

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'x-api-key': SYNAPSE_API_KEY,
        },
        body: formData,
      });
    } catch (networkError) {
      throw new Error(
        `Falha de conexão com o gateway Textract: ${(networkError as Error).message}`
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Gateway Textract retornou status ${response.status}: ${body}`
      );
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData: unknown;
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => {
        throw new Error('Gateway Textract retornou resposta inválida (não é JSON).');
      });
    } else {
      const text = await response.text();
      responseData = { format: 'csv', csv: text };
    }

    return { data: responseData, filename };
  }
}

export default new TextractGatewayService();
