const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const conversionService = require('../services/conversionService');
const cleanupService = require('../services/cleanupService');
const path = require('path');

/**
 * Handle image/document/text conversions
 */
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const { targetFormat } = req.body;
        if (!targetFormat) return res.status(400).json({ error: 'Target format missing' });

        const inputPath = req.file.path;
        let outputPath;

        // Routing logic based on type and format
        const ext = path.extname(inputPath).toLowerCase();

        if (['jpg', 'png', 'webp'].includes(targetFormat)) {
            outputPath = await conversionService.convertImage(inputPath, targetFormat);
        } else if (targetFormat === 'pdf') {
            if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
                outputPath = await conversionService.imageToPdf(inputPath, inputPath.replace(ext, '.pdf'));
            } else if (ext === '.docx') {
                outputPath = await conversionService.docxToPdf(inputPath, inputPath.replace(ext, '.pdf'));
            } else if (ext === '.txt') {
                outputPath = await conversionService.txtToPdf(inputPath, inputPath.replace(ext, '.pdf'));
            } else if (ext === '.html' || ext === '.htm') {
                const html = fs.readFileSync(inputPath, 'utf-8');
                outputPath = await conversionService.htmlToPdf(html, inputPath.replace(ext, '.pdf'));
            } else if (ext === '.md') {
                const { marked } = require('marked');
                const md = fs.readFileSync(inputPath, 'utf-8');
                outputPath = await conversionService.htmlToPdf(marked.parse(md), inputPath.replace(ext, '.pdf'));
            } else {
                return res.status(400).json({ error: 'Unsupported conversion to PDF' });
            }
        } else if (targetFormat === 'mp3' && ext === '.mp4') {
            outputPath = await conversionService.videoToMp3(inputPath, inputPath.replace(ext, '.mp3'));
        } else if (targetFormat === 'gif' && ext === '.mp4') {
            outputPath = await conversionService.videoToGif(inputPath, inputPath.replace(ext, '.gif'));
        } else if (targetFormat === 'html' && ext === '.md') {
             const { marked } = require('marked');
             const md = fs.readFileSync(inputPath, 'utf-8');
             const html = marked.parse(md);
             outputPath = inputPath.replace(ext, '.html');
             fs.writeFileSync(outputPath, html);
        } else {
            return res.status(400).json({ error: 'Unsupported target format for this file type' });
        }

        res.download(outputPath, (err) => {
            // Cleanup files after download
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
            if (err) console.error('Error during download:', err);
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
