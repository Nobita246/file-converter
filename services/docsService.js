const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const pizzip = require('pizzip');
const { marked } = require('marked');
const hljs = require('highlight.js');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const conversionService = require('./conversionService');

class DocsService {
    /**
     * Markdown to PDF with code highlighting
     */
    async markdownToPdf(inputPath, outputPath, options = {}) {
        const markdown = fs.readFileSync(inputPath, 'utf-8');
        
        // Setup marked with highlight.js
        marked.setOptions({
            highlight: function(code, lang) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            },
            langPrefix: 'hljs language-'
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css">
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; line-height: ${options.lineSpacing || 1.6}; }
                    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    code { font-family: 'Fira Code', monospace; }
                </style>
            </head>
            <body>
                ${marked.parse(markdown)}
            </body>
            </html>
        `;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        await page.pdf({ 
            path: outputPath, 
            format: options.pageSize || 'A4',
            landscape: options.orientation === 'landscape',
            margin: options.margins || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });
        await browser.close();
        return outputPath;
    }

    /**
     * DOCX Modification (Basic placeholder for "Remove Images/Links")
     * Real modification of existing DOCX requires manual XML manipulation with PizZip.
     */
    async modifyDocx(inputPath, outputPath, options = {}) {
        const content = fs.readFileSync(inputPath);
        const zip = new pizzip(content);
        
        // This is a complex operation as it involves parsing word/document.xml and word/_rels/document.xml.rels
        // For a university project, we can implement basic "Text Normalization" or mention it as a feature.
        // For now, let's implement a wrapper that could potentially strip certain tags.
        
        if (options.removeImages) {
            // Logic to find and remove <w:drawing> tags from document.xml
            let docXml = zip.files['word/document.xml'].asText();
            docXml = docXml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, '');
            zip.file('word/document.xml', docXml);
        }

        if (options.removeLinks) {
            // Logic to remove <w:hyperlink> tags but keep internal text
            let docXml = zip.files['word/document.xml'].asText();
            docXml = docXml.replace(/<w:hyperlink[\s\S]*?>(<w:r>[\s\S]*?<\/w:r>)<\/w:hyperlink>/g, '$1');
            zip.file('word/document.xml', docXml);
        }

        const buffer = zip.generate({ type: 'nodebuffer' });
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    }

    /**
     * Merge multiple DOCX files using pizzip (Basic concatenation)
     */
    async mergeDocx(filePaths, outputPath) {
        // Merging DOCX is non-trivial because of shared resources like styles, images, and relations.
        // A common strategy is to use 'docx-merger' or similar, but since we are being production-ready
        // and minimal, we'll implement a basic version or use a library if needed.
        // For now, let's use a simpler approach: Convert each to HTML and then back to DOCX (or PDF).
        throw new Error('Advanced DOCX merging requires specialized libraries like docx-merger.');
    }

    /**
     * Metadata Tools (Basic implementation via zip comment or similar)
     */
    async getMetadata(inputPath) {
        const content = fs.readFileSync(inputPath);
        const zip = new pizzip(content);
        try {
            const appXml = zip.files['docProps/app.xml']?.asText();
            const coreXml = zip.files['docProps/core.xml']?.asText();
            
            return {
                creator: coreXml?.match(/<dc:creator>(.*?)<\/dc:creator>/)?.[1] || 'Unknown',
                lastModifiedBy: coreXml?.match(/<cp:lastModifiedBy>(.*?)<\/cp:lastModifiedBy>/)?.[1] || 'Unknown',
                created: coreXml?.match(/<dcterms:created.*?>(.*?)<\/dcterms:created>/)?.[1] || 'Unknown',
                application: appXml?.match(/<Application>(.*?)<\/Application>/)?.[1] || 'Unknown'
            };
        } catch (e) {
            return { error: 'Could not extract metadata' };
        }
    }
}

module.exports = new DocsService();
