# File Converter – Universal File & PDF Toolkit 🎯

File Converter is a robust, production-ready web platform built with **Node.js** and **Express**, designed for seamless file conversion and advanced document manipulation. It features a premium, responsive **Glassmorphism UI** with full **Dark/Light Mode** support.

---

## 🚀 Features

### 1. Universal Converter (Guided FROM → TO Flow)
A redesigned conversion engine that ensures 100% valid file processing through an explicit "Input Format → Output Format" selection.
- **🖼 Images**: Convert between PNG, JPG, and WEBP. High-performance processing via `sharp`.
- **📄 Documents**: Convert DOCX, TXT, HTML, and Markdown directly to PDF.
- **🎥 Media**: 
  - Extract Audio (MP3) from MP4 Videos.
  - Create high-quality GIFs from MP4 clips using `fluent-ffmpeg`.
- **✍️ Markdown**: Convert MD files to clean HTML or PDFs with syntax highlighting.
- **🔍 Global Preview**: Interactive visual preview for images and PDFs before you download.

### 2. PDF Toolkit
A high-performance module for managing PDF documents directly in the browser.
- **🔗 Merge**: Combine multiple PDF files into a single document in seconds.
- **🔄 Rotate**: Correct page orientation (90°, 180°, 270°).
- **🎨 Watermark**: Secure your documents by adding custom text overlays with transparency control.
- **✂️ Split**: Separate multi-page PDFs into individual files, delivered in a tidy ZIP archive.

### 3. Docs Toolkit (Advanced)
Built for power users needing deeper document control.
- **🛠 DOCX Modification**: Strip all images or hyperlinks from Word documents to create "clean" versions.
- **🔍 Metadata Inspector**: Extract internal document properties (Author, Created Date, Application Version, etc.) from DOCX files.
- **💻 Markdown to PDF**: Renders Markdown with full **Code Syntax Highlighting** (via `highlight.js`) and custom line spacing.

### 4. Advanced Controls (Panel) 🕹️
A dedicated tab for surgical precision over your media and documents.
- **🖼 Image Resizer**: Adjust dimensions with custom width/height and optional aspect ratio locking.
- **📄 PDF Extractor**: Extract specific pages or ranges (e.g., 1, 3, 5-10) into a new PDF.
- **🗜 PDF Compressor**: Optimize and re-serialize PDF files for reduced file size.

---

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [FFmpeg](https://ffmpeg.org/) (The project uses `ffmpeg-static` for portability, but system-level FFmpeg is recommended for production)

### Step-by-Step Setup

1. **Clone the Project**
   ```bash
   git clone <your-repository-url>
   cd file-converter
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   *This installs all core libraries including `sharp`, `puppeteer`, `pdf-lib`, `docx`, `pizzip`, `marked`, and `fluent-ffmpeg`.*

3. **Verify Directory Structure**
   The application will automatically create an `uploads/` directory on the first run. Ensure you have write permissions in the project folder.

4. **Launch the Application**
   ```bash
   # Development mode (Standard)
   npm start
   ```
   Access the dashboard at: `http://localhost:3000`

---

## 🛠 Tech Stack

- **Backend**: Node.js & Express.js
- **Frontend**: Vanilla HTML5, CSS3 (Custom Variables, Glassmorphism), JavaScript (ES6+).
- **Core Libraries**:
  - `sharp`: Image resizing and format conversion.
  - `puppeteer`: Chrome-based PDF generation from HTML/MD.
  - `pdf-lib`: Native PDF editing (merging, rotating, extracting).
  - `docx` & `pizzip`: Direct XML manipulation of Word documents.
  - `marked` & `highlight.js`: Markdown parsing and syntax highlighting.
  - `fluent-ffmpeg`: Media processing and GIF generation.

---

## 🔐 Security & Reliability

- **Auto-Cleanup**: Temporary files are deleted immediately after the download signal is received to save storage and ensure privacy.
- **Upload Validation**: Strict 50MB file size limit and MIME-type validation.
- **Headless Processing**: Heavy tasks are offloaded to sub-services to keep the main event loop responsive.
- **Modern Security**: `Helmet` middleware integrated for setting secure HTTP headers.

---
