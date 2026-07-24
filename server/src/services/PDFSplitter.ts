/**
 * PDFSplitter — Divide páginas de PDF com layout de duas colunas.
 *
 * Usado principalmente para a pauta de Sergipe (SE), onde o PDF possui
 * duas colunas de produtos lado a lado. O split transforma cada página
 * original em duas páginas sequenciais (esquerda, depois direita),
 * permitindo que o Textract processe cada coluna isoladamente sem
 * confundir dados entre colunas.
 *
 * Pipeline SE: PDF → PDFSplitter → PdfPreprocessor → Textract (CSV) → SECompactor
 */

import { PDFDocument } from 'pdf-lib';
import { Logger } from '../utils/logger';

const logger = new Logger('PDFSplitter');

export interface SplitOptions {
  /**
   * Proporção do ponto de corte (0.0 a 1.0).
   * Default: 0.5 (metade exata da página).
   * Pode ser ajustado se as colunas forem assimétricas (ex: 0.48 para cortar mais à esquerda).
   */
  splitRatio?: number;

  /**
   * Margem de gutter em pontos (pts) a remover do corte.
   * Remove essa quantidade de pixels de cada lado do ponto de corte
   * para evitar artefatos de OCR causados pelo espaço entre colunas.
   * Default: 0 (sem remoção de gutter).
   */
  gutterMargin?: number;

  /**
   * Se true, processa apenas páginas com largura > altura (landscape ou multi-coluna).
   * Páginas portrait são adicionadas sem split.
   * Default: false (processa todas).
   */
  onlyWidePages?: boolean;
}

export class PDFSplitter {
  /**
   * Receives a PDF Buffer, crops each page vertically in half (left column & right column),
   * and returns a new PDF Buffer containing the sequential pages (P1_Left, P1_Right, P2_Left, P2_Right, etc.).
   */
  static async splitVertically(buffer: Buffer, options: SplitOptions = {}): Promise<Buffer> {
    const {
      splitRatio = 0.5,
      gutterMargin = 0,
      onlyWidePages = false,
    } = options;

    const pdfDoc = await PDFDocument.load(buffer);
    const splitPdfDoc = await PDFDocument.create();
    const pages = pdfDoc.getPages();

    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      const page = pages[pageIdx];
      const { width, height } = page.getSize();

      // Se onlyWidePages e a página é portrait, copia sem split
      if (onlyWidePages && width <= height) {
        const [copiedPage] = await splitPdfDoc.copyPages(pdfDoc, [pageIdx]);
        splitPdfDoc.addPage(copiedPage);
        logger.info(`[SPLIT] Página ${pageIdx + 1}: portrait (${Math.round(width)}x${Math.round(height)}), copiada sem split.`);
        continue;
      }

      const splitPoint = width * splitRatio;
      const leftWidth = splitPoint - gutterMargin;
      const rightStart = splitPoint + gutterMargin;
      const rightWidth = width - rightStart;

      // Validação de dimensões
      if (leftWidth <= 0 || rightWidth <= 0) {
        logger.warn(`[SPLIT] Página ${pageIdx + 1}: dimensões inválidas após split (left=${leftWidth}, right=${rightWidth}). Copiando sem split.`);
        const [copiedPage] = await splitPdfDoc.copyPages(pdfDoc, [pageIdx]);
        splitPdfDoc.addPage(copiedPage);
        continue;
      }

      // Clone page for the left column
      const [leftPage] = await splitPdfDoc.copyPages(pdfDoc, [pageIdx]);
      // Clone page for the right column
      const [rightPage] = await splitPdfDoc.copyPages(pdfDoc, [pageIdx]);

      // Crop Left Column: Keep left half (x=0, width=leftWidth)
      leftPage.setMediaBox(0, 0, leftWidth, height);
      splitPdfDoc.addPage(leftPage);

      // Crop Right Column: Keep right half (x=rightStart, width=rightWidth)
      rightPage.setMediaBox(rightStart, 0, rightWidth, height);
      splitPdfDoc.addPage(rightPage);
    }

    const totalOriginal = pages.length;
    const totalSplit = splitPdfDoc.getPageCount();
    logger.info(`[SPLIT] PDF splitado: ${totalOriginal} páginas originais → ${totalSplit} páginas (ratio=${splitRatio}, gutter=${gutterMargin}pt).`);

    const pdfBytes = await splitPdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
