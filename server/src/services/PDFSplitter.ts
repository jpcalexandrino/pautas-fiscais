import { PDFDocument } from 'pdf-lib';

export class PDFSplitter {
  /**
   * Receives a PDF Buffer, crops each page vertically in half (left column & right column),
   * and returns a new PDF Buffer containing the sequential pages (P1_Left, P1_Right, P2_Left, P2_Right, etc.).
   */
  static async splitVertically(buffer: Buffer): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(buffer);
    const splitPdfDoc = await PDFDocument.create();

    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const halfWidth = width / 2;

      // Clone page for the left column
      const [leftPage] = await splitPdfDoc.copyPages(pdfDoc, [pdfDoc.getPages().indexOf(page)]);
      // Clone page for the right column
      const [rightPage] = await splitPdfDoc.copyPages(pdfDoc, [pdfDoc.getPages().indexOf(page)]);

      // Crop Left Column: Keep left half (x from 0 to halfWidth)
      leftPage.setMediaBox(0, 0, halfWidth, height);
      splitPdfDoc.addPage(leftPage);

      // Crop Right Column: Keep right half (x from halfWidth to width)
      rightPage.setMediaBox(halfWidth, 0, width, height);
      splitPdfDoc.addPage(rightPage);
    }

    const pdfBytes = await splitPdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
