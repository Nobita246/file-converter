const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const pdfService = require('../services/pdfService');
const conversionService = require('../services/conversionService');
const cleanupService = require('../services/cleanupService');
const path = require('path');
const fs = require('fs');

/**
 * PDF Page Extraction
 */
router.post('/extract', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { range } = req.body;
        const inputPath = req.file.path;
        const outputPath = inputPath.replace(path.extname(inputPath), '_extracted.pdf');

        await pdfService.extractPages(inputPath, outputPath, range);

        res.download(outputPath, (err) => {
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Image Resizing
 */
router.post('/resize', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { width, height, maintainAspectRatio } = req.body;
        const inputPath = req.file.path;
        const outputPath = inputPath.replace(path.extname(inputPath), '_resized' + path.extname(inputPath));

        await conversionService.resizeImage(inputPath, outputPath, {
            width,
            height,
            maintainAspectRatio: maintainAspectRatio === 'true'
        });

        res.download(outputPath, (err) => {
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PDF Compression
 */
router.post('/compress', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { level } = req.body;
        const inputPath = req.file.path;
        const outputPath = inputPath.replace(path.extname(inputPath), '_compressed.pdf');

        await pdfService.compressPdf(inputPath, outputPath, level);

        res.download(outputPath, (err) => {
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
