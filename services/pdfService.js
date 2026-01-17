const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

class PdfService {
  /**
   * Merge multiple PDFs into one
   */
  async mergePdfs(pdfPaths, outputPath) {
    const mergedPdf = await PDFDocument.create();
    for (const pdfPath of pdfPaths) {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);
    return outputPath;
  }

  /**
   * Rotate all pages in a PDF
   */
  async rotatePdf(inputPath, outputPath, rotationAngle) {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = pdf.getPages();
    pages.forEach(page => {
      page.setRotation(degrees(rotationAngle));
    });
    const rotatedPdfBytes = await pdf.save();
    fs.writeFileSync(outputPath, rotatedPdfBytes);
    return outputPath;
  }

  /**
   * Split PDF by individual pages (returns array of paths)
   */
  async splitPdf(inputPath, outputDir) {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();
    const outputPaths = [];

    for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);
        const newPdfBytes = await newPdf.save();
        const outputPath = path.join(outputDir, `page_${i + 1}_${path.basename(inputPath)}`);
        fs.writeFileSync(outputPath, newPdfBytes);
        outputPaths.push(outputPath);
    }
    return outputPaths;
  }

  /**
   * Add text watermark to PDF
   */
  async addWatermark(inputPath, outputPath, text) {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pages = pdf.getPages();

    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width / 4,
        y: height / 2,
        size: 50,
        font: font,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.5,
        rotate: degrees(45),
      });
    });

    const watermarkedPdfBytes = await pdf.save();
    fs.writeFileSync(outputPath, watermarkedPdfBytes);
    return outputPath;
  }

  /**
   * Password protect PDF
   */
  async protectPdf(inputPath, outputPath, password) {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    // pdf-lib doesn't support built-in encryption yet, would need qpdf or similar
    // For this project, we'll document it as a limitation or use a shell-based tool if available
    // For now, let's keep it as a placeholder or use a library that supports it
    // Actually, let's stick to pdf-lib for basic ops and mention password protection needs extra tools
    throw new Error('Password protection requires additional system libraries (like qpdf)');
  }
}

module.exports = new PdfService();
