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
   * Extract specific pages from a PDF
   * @param {string} rangeStr - e.g. "1, 3, 5-10"
   */
  async extractPages(inputPath, outputPath, rangeStr) {
    const pdfBytes = fs.readFileSync(inputPath);
    const srcPdf = await PDFDocument.load(pdfBytes);
    const destPdf = await PDFDocument.create();
    
    const pageCount = srcPdf.getPageCount();
    const pagesToExtract = this._parseRange(rangeStr, pageCount);
    
    if (pagesToExtract.length === 0) throw new Error('No valid pages specified in range');
    
    const copiedPages = await destPdf.copyPages(srcPdf, pagesToExtract);
    copiedPages.forEach(page => destPdf.addPage(page));
    
    const destPdfBytes = await destPdf.save();
    fs.writeFileSync(outputPath, destPdfBytes);
    return outputPath;
  }

  /**
   * Basic PDF Compression (optimizing images and metadata)
   */
  async compressPdf(inputPath, outputPath, level) {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    
    // Low-level optimization in pdf-lib is limited, but we can set metadata and 
    // re-serialize which often reduces size of unoptimized PDFs.
    // For true high-level compression (image downsampling), extra libs would be needed.
    // We'll use PDFDocument.save({ useObjectStreams: true }) for better packing.
    
    const compressedBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    
    fs.writeFileSync(outputPath, compressedBytes);
    return outputPath;
  }

  _parseRange(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(',').map(p => p.trim());
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
            pages.add(i - 1); // 0-indexed for pdf-lib
          }
        }
      } else {
        const page = Number(part);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page - 1);
        }
      }
    });
    
    return Array.from(pages).sort((a, b) => a - b);
  }
}

module.exports = new PdfService();
