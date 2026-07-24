import sharp from 'sharp';
import { PDFDocument, degrees } from 'pdf-lib';
import { Logger } from '../utils/logger';

const logger = new Logger('PdfPreprocessorService');

export interface PreprocessOptions {
  contrastBoost?: boolean;
  sharpen?: boolean;
  normalizeGrayscale?: boolean;
}

export class PdfPreprocessorService {
  /**
   * Processa uma imagem (PNG/JPEG/TIFF) aplicando filtros visuais de OCR:
   * 1. Conversão para Grayscale (Escala de cinza)
   * 2. Normalização de contraste (min-max expansion)
   * 3. Nitidez (Sharpen) de bordas numéricas e vírgulas
   * 4. Ajuste linear de contraste para isolar texto
   */
  static async preprocessImageBuffer(
    buffer: Buffer,
    options: PreprocessOptions = {}
  ): Promise<Buffer> {
    const {
      contrastBoost = true,
      sharpen = true,
      normalizeGrayscale = true,
    } = options;

    try {
      let pipeline = sharp(buffer);

      if (normalizeGrayscale) {
        pipeline = pipeline.grayscale().normalize();
      }

      if (sharpen) {
        // Reforça bordas pequenas (números, vírgulas e pontos decimais)
        pipeline = pipeline.sharpen({
          sigma: 1.5,
          m1: 1.0,
          m2: 2.0,
        });
      }

      if (contrastBoost) {
        // Ajuste no ganho de brilho/contraste para escurecer textos e clarear fundo
        pipeline = pipeline.linear(1.15, -15);
      }

      const processedBuffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
      logger.info(`[PREPROCESS] Imagem otimizada com sucesso. Tamanho final: ${processedBuffer.length} bytes.`);
      return processedBuffer;
    } catch (err) {
      logger.error(`[PREPROCESS] Erro ao processar buffer de imagem: ${(err as Error).message}. Retornando buffer original.`);
      return buffer;
    }
  }

  /**
   * Sanitiza e otimiza um documento PDF ajustando mediaBox, rotações e alinhamento de páginas.
   */
  static async preprocessPdfBuffer(buffer: Buffer): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      let modified = false;

      for (const page of pages) {
        // Corrige rotações estranhas que desalinham tabelas (ex: 90, 180 ou 270 graus)
        const rotation = page.getRotation().angle;
        if (rotation !== 0) {
          page.setRotation(degrees(0));
          modified = true;
        }

        // Garante que o MediaBox corresponda à área visível real da página
        const { width, height } = page.getSize();
        if (width > 0 && height > 0) {
          page.setMediaBox(0, 0, width, height);
        }
      }

      if (modified) {
        const savedBytes = await pdfDoc.save();
        logger.info('[PREPROCESS] PDF ajustado e corrigido com sucesso.');
        return Buffer.from(savedBytes);
      }

      return buffer;
    } catch (err) {
      logger.error(`[PREPROCESS] Erro ao sanitizar PDF: ${(err as Error).message}`);
      return buffer;
    }
  }

  /**
   * Método principal para pré-processar um documento (PDF ou Imagem) antes do envio ao OCR Textract.
   */
  static async preprocess(buffer: Buffer, filename: string): Promise<Buffer> {
    const ext = (filename.split('.').pop() || '').toLowerCase();

    if (['jpg', 'jpeg', 'png', 'tif', 'tiff', 'webp'].includes(ext)) {
      return this.preprocessImageBuffer(buffer);
    }

    if (ext === 'pdf') {
      return this.preprocessPdfBuffer(buffer);
    }

    return buffer;
  }
}
