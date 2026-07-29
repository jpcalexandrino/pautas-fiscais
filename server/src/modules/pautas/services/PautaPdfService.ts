import { PDFParse } from 'pdf-parse';

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  isScanned: boolean;
  pdfBase64?: string;
}

class PautaPdfService {
  async extractFromBuffer(buffer: Buffer): Promise<PdfExtractionResult> {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    await parser.destroy();

    const text = (textResult.text || '').trim();
    const numPages = infoResult.total || textResult.total || 1;

    const charsPerPage = text.length / Math.max(numPages, 1);
    const isScanned = text.length < 50 || charsPerPage < 30;

    const result: PdfExtractionResult = {
      text,
      numPages,
      isScanned,
    };

    if (isScanned) {
      result.pdfBase64 = buffer.toString('base64');
    }

    return result;
  }
}

export default new PautaPdfService();
