const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const docsService = require('../services/docsService');
const cleanupService = require('../services/cleanupService');
const path = require('path');
const fs = require('fs');

/**
 * Advanced Conversion (Markdown to PDF, etc.)
 */
router.post('/convert', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'File missing' });
        
        const options = JSON.parse(req.body.options || '{}');
        const inputPath = req.file.path;
        const targetFormat = req.body.targetFormat || 'pdf';
        const outputPath = path.join('uploads', `docs_${Date.now()}.${targetFormat}`);

        const ext = path.extname(inputPath).toLowerCase();
        
        if (ext === '.md' && targetFormat === 'pdf') {
            await docsService.markdownToPdf(inputPath, outputPath, options);
        } else {
            return res.status(400).json({ error: 'Unsupported advanced conversion' });
        }

        res.download(outputPath, (err) => {
            cleanupService.deleteFile(inputPath);
            cleanupService.deleteFile(outputPath);
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Modify Document (Remove images, links)
 */
router.post('/modify', upload.single('file'), async (req, res, next) => {
    try {
        const { removeImages, removeLinks } = req.body;
        if (!req.file) return res.status(400).json({ error: 'File missing' });

        const inputPath = req.file.path;
        const outputPath = path.join('uploads', `modified_${Date.now()}${path.extname(inputPath)}`);

        await docsService.modifyDocx(inputPath, outputPath, {
            removeImages: removeImages === 'true',
            removeLinks: removeLinks === 'true'
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
 * Get Metadata
 */
router.post('/metadata', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'File missing' });
        const metadata = await docsService.getMetadata(req.file.path);
        cleanupService.deleteFile(req.file.path);
        res.json(metadata);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
