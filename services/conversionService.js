const sharp = require('sharp');
const puppeteer = require('puppeteer');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { PDFDocument } = require('pdf-lib');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class ConversionService {
  /**
   * Convert image between formats (JPG, PNG, WEBP)
   */
  async convertImage(inputPath, outputFormat) {
    const outputPath = inputPath.replace(path.extname(inputPath), `.${outputFormat}`);
    await sharp(inputPath)
      .toFormat(outputFormat)
      .toFile(outputPath);
    return outputPath;
  }

  /**
   * Convert single image to PDF
   */
  async imageToPdf(inputPath, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const base64 = fs.readFileSync(inputPath).toString('base64');
    const htmlContent = `<html><body style="margin:0;padding:0;"><img src="data:image/${path.extname(inputPath).slice(1)};base64,${base64}" style="width:100%;"></body></html>`;
    await page.setContent(htmlContent);
    await page.pdf({ path: outputPath, format: 'A4' });
    await browser.close();
    return outputPath;
  }

  /**
   * DOCX to PDF
   */
  async docxToPdf(inputPath, outputPath) {
    const result = await mammoth.convertToHtml({ path: inputPath });
    const html = result.value;
    return await this.htmlToPdf(html, outputPath);
  }

  /**
   * HTML to PDF
   */
  async htmlToPdf(htmlContent, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: outputPath, format: 'A4' });
    await browser.close();
    return outputPath;
  }

  /**
   * TXT to PDF
   */
  async txtToPdf(inputPath, outputPath) {
    const text = fs.readFileSync(inputPath, 'utf-8');
    const html = `<html><body><pre style="white-space: pre-wrap;">${text}</pre></body></html>`;
    return await this.htmlToPdf(html, outputPath);
  }

  /**
   * Video to MP3
   */
  async videoToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  /**
   * Video to GIF
   */
  async videoToGif(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size('480x?')
        .fps(10)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  /**
   * Custom Image Resize
   */
  async resizeImage(inputPath, outputPath, options) {
    const { width, height, maintainAspectRatio } = options;
    const resizeOptions = {};
    
    if (width) resizeOptions.width = parseInt(width);
    if (height) resizeOptions.height = parseInt(height);
    if (maintainAspectRatio === false) resizeOptions.fit = 'fill';

    await sharp(inputPath)
      .resize(resizeOptions)
      .toFile(outputPath);
    
    return outputPath;
  }
}

module.exports = new ConversionService();
