const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const pdfService = require('../services/pdfService');
const cleanupService = require('../services/cleanupService');
const path = require('path');
const fs = require('fs');

/**
 * Merge PDFs
 */
router.post('/merge', upload.array('files'), async (req, res, next) => {
    try {
        if (!req.files || req.files.length < 2) return res.status(400).json({ error: 'Upload at least 2 PDF files' });
        
        const inputPaths = req.files.map(f => f.path);
        const outputPath = path.join('uploads', `merged_${Date.now()}.pdf`);

        await pdfService.mergePdfs(inputPaths, outputPath);

        res.download(outputPath, (err) => {
            inputPaths.forEach(p => cleanupService.deleteFile(p));
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Rotate PDF
 */
router.post('/rotate', upload.single('file'), async (req, res, next) => {
    try {
        const { angle } = req.body;
        if (!req.file || !angle) return res.status(400).json({ error: 'File or angle missing' });

        const inputPath = req.file.path;
        const outputPath = path.join('uploads', `rotated_${Date.now()}.pdf`);

        await pdfService.rotatePdf(inputPath, outputPath, parseInt(angle));

        res.download(outputPath, (err) => {
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Watermark PDF
 */
router.post('/watermark', upload.single('file'), async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!req.file || !text) return res.status(400).json({ error: 'File or text missing' });

        const inputPath = req.file.path;
        const outputPath = path.join('uploads', `watermarked_${Date.now()}.pdf`);

        await pdfService.addWatermark(inputPath, outputPath, text);

        res.download(outputPath, (err) => {
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Split PDF - Returns a ZIP of pages
 */
const archiver = require('archiver');
router.post('/split', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'File missing' });

        const inputPath = req.file.path;
        const outputDir = path.join('uploads', `split_${Date.now()}`);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        const pagePaths = await pdfService.splitPdf(inputPath, outputDir);
        
        const zipPath = `${outputDir}.zip`;
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            res.download(zipPath, (err) => {
                cleanupService.deleteFile(inputPath);
                cleanupService.deleteFile(zipPath);
                fs.rmSync(outputDir, { recursive: true, force: true });
            });
        });

        archive.pipe(output);
        pagePaths.forEach(p => archive.file(p, { name: path.basename(p) }));
        await archive.finalize();

    } catch (error) {
        next(error);
    }
});

module.exports = router;
