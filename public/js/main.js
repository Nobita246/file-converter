document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Management ---
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'light';

    html.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // --- Tab Management ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (!target) return; // Action buttons in PDF tools don't have data-target

            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // --- Universal Converter Logic ---
    const convDropZone = document.getElementById('conv-drop-zone');
    const convFileInput = document.getElementById('conv-file-input');
    const fileInfo = document.getElementById('file-info');
    const convertBtn = document.getElementById('convert-btn');
    const fromFormatSelect = document.getElementById('from-format');
    const targetFormatSelect = document.getElementById('target-format');
    let selectedFile = null;

    // Conversion Rules Mappings
    const conversionRules = {
        'png': { targets: ['jpg', 'webp', 'pdf'], label: 'PNG Image', accept: '.png' },
        'jpg': { targets: ['png', 'webp', 'pdf'], label: 'JPG Image', accept: '.jpg,.jpeg' },
        'webp': { targets: ['png', 'jpg', 'pdf'], label: 'WEBP Image', accept: '.webp' },
        'pdf': { targets: ['jpg', 'docx'], label: 'PDF Document', accept: '.pdf' },
        'docx': { targets: ['pdf', 'txt'], label: 'Word Document', accept: '.docx' },
        'txt': { targets: ['pdf'], label: 'Text File', accept: '.txt' },
        'html': { targets: ['pdf', 'docx'], label: 'HTML Page', accept: '.html,.htm' },
        'md': { targets: ['pdf', 'html'], label: 'Markdown', accept: '.md' },
        'mp4': { targets: ['mp3', 'gif'], label: 'MP4 Video', accept: '.mp4' },
        'wav': { targets: ['mp3'], label: 'WAV Audio', accept: '.wav' }
    };

    fromFormatSelect.addEventListener('change', () => {
        const fromFormat = fromFormatSelect.value;
        const rule = conversionRules[fromFormat];
        
        // Update Target Dropdown
        targetFormatSelect.innerHTML = '<option value="" disabled selected>Select Output Format</option>';
        rule.targets.forEach(target => {
            const option = document.createElement('option');
            option.value = target;
            option.textContent = target.toUpperCase();
            targetFormatSelect.appendChild(option);
        });
        targetFormatSelect.disabled = false;

        // Update File Input Accept
        convFileInput.accept = rule.accept;
        
        // Reset if selected file doesn't match
        if (selectedFile) {
            const ext = `.${selectedFile.name.split('.').pop().toLowerCase()}`;
            if (!rule.accept.includes(ext) && fromFormat !== 'jpg' && !rule.accept.includes('jpeg')) {
                selectedFile = null;
                fileInfo.textContent = '';
                convertBtn.disabled = true;
                showToast('Please upload a ' + fromFormat.toUpperCase() + ' file', '#f44336');
            }
        }
    });

    targetFormatSelect.addEventListener('change', () => {
        if (selectedFile) convertBtn.disabled = false;
    });

    convDropZone.addEventListener('click', () => {
        if (!fromFormatSelect.value) return showToast('Select "FROM" format first', '#f44336');
        convFileInput.click();
    });

    convDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        convDropZone.classList.add('drag-over');
    });

    convDropZone.addEventListener('dragleave', () => convDropZone.classList.remove('drag-over'));

    convDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        convDropZone.classList.remove('drag-over');
        handleFileSelection(e.dataTransfer.files[0]);
    });

    convFileInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));

    function handleFileSelection(file) {
        if (!file) return;
        
        const fromFormat = fromFormatSelect.value;
        if (!fromFormat) {
            showToast('Select "FROM" format first', '#f44336');
            return;
        }

        const ext = `.${file.name.split('.').pop().toLowerCase()}`;
        const rule = conversionRules[fromFormat];
        
        if (!rule.accept.includes(ext) && !(fromFormat === 'jpg' && ext === '.jpeg')) {
            showToast(`Invalid file! Please upload a ${fromFormat.toUpperCase()} file.`, '#f44336');
            return;
        }

        selectedFile = file;
        fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        if (targetFormatSelect.value) convertBtn.disabled = false;
        showToast(`File "${file.name}" ready!`, '#4caf50');
    }

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const targetFormat = targetFormatSelect.value;
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('targetFormat', targetFormat);

        updateProgress(true, 'Uploading & Processing...', 50);

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = 'Conversion failed. Please try a different format.';
                try {
                    const errData = await response.json();
                    errorMessage = errData.error || errData.message || errorMessage;
                } catch (e) {
                    if (response.status === 404) errorMessage = 'Service unavailable. Is the server running?';
                    if (response.status === 413) errorMessage = 'File is too large! (Max 50MB)';
                }
                throw new Error(errorMessage);
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_${selectedFile.name.split('.')[0]}.${targetFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Success! Converted successfully.', '#6366f1');
            updateProgress(false);
        } catch (error) {
            console.error(error);
            showToast(error.message, '#f44336');
            updateProgress(false);
        }
    });

    // --- PDF Toolkit Logic ---
    const pdfToolArea = document.getElementById('pdf-tool-area');
    const pdfActions = document.querySelectorAll('[data-action]');
    let pdfToolFiles = [];

    const toolTemplates = {
        merge: `
            <div class="drop-zone" id="pdf-merge-drop">
                <i class="fas fa-layer-group"></i>
                <p>Drag & Drop multiple PDFs to merge</p>
                <input type="file" id="pdf-merge-input" multiple accept="application/pdf" hidden>
                <div id="pdf-merge-list" style="margin-top: 1rem; text-align: left; font-size: 0.9rem;"></div>
            </div>
            <button class="primary-btn" id="pdf-merge-btn" style="width: 100%; margin-top: 1rem;" disabled>Merge & Download</button>
        `,
        rotate: `
            <div class="drop-zone" id="pdf-rotate-drop">
                <i class="fas fa-redo"></i>
                <p>Select PDF to rotate</p>
                <input type="file" id="pdf-rotate-input" accept="application/pdf" hidden>
                <div id="pdf-rotate-name" style="margin-top: 1rem; font-weight: 600;"></div>
            </div>
            <div class="controls">
                <select id="pdf-rotate-angle">
                    <option value="90">90° Clockwise</option>
                    <option value="180">180°</option>
                    <option value="270">270° Counter-Clockwise</option>
                </select>
                <button class="primary-btn" id="pdf-rotate-btn" disabled>Rotate & Download</button>
            </div>
        `,
        watermark: `
            <div class="drop-zone" id="pdf-wm-drop">
                <i class="fas fa-stamp"></i>
                <p>Select PDF to watermark</p>
                <input type="file" id="pdf-wm-input" accept="application/pdf" hidden>
                <div id="pdf-wm-name" style="margin-top: 1rem; font-weight: 600;"></div>
            </div>
            <div class="controls">
                <input type="text" id="pdf-wm-text" placeholder="Enter Watermark Text (e.g. CONFIDENTIAL)">
                <button class="primary-btn" id="pdf-wm-btn" disabled>Apply & Download</button>
            </div>
        `,
        split: `
            <div class="drop-zone" id="pdf-split-drop">
                <i class="fas fa-scissors"></i>
                <p>Select PDF to split into separate pages</p>
                <input type="file" id="pdf-split-input" accept="application/pdf" hidden>
                <div id="pdf-split-name" style="margin-top: 1rem; font-weight: 600;"></div>
            </div>
            <button class="primary-btn" id="pdf-split-btn" style="width: 100%; margin-top: 1rem;" disabled>Split & Download (.zip)</button>
        `
    };

    pdfActions.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            pdfActions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Swap UI
            pdfToolArea.innerHTML = toolTemplates[action];
            initToolLogic(action);
            showToast(`PDF ${action.charAt(0).toUpperCase() + action.slice(1)} mode active`, '#6366f1');
        });
    });

    function initToolLogic(action) {
        if (action === 'merge') {
            const drop = document.getElementById('pdf-merge-drop');
            const input = document.getElementById('pdf-merge-input');
            const list = document.getElementById('pdf-merge-list');
            const btn = document.getElementById('pdf-merge-btn');
            let files = [];

            drop.onclick = () => input.click();
            
            // Drag and Drop for Merge
            drop.addEventListener('dragover', (e) => {
                e.preventDefault();
                drop.classList.add('drag-over');
            });

            drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));

            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('drag-over');
                const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
                files = [...files, ...newFiles];
                updateList();
            });

            input.onchange = (e) => {
                const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
                files = [...files, ...newFiles];
                updateList();
                input.value = ''; // Reset input to allow selecting same file again
            };

            window.removePdfFile = (index) => {
                files.splice(index, 1);
                updateList();
            };

            function updateList() {
                list.innerHTML = files.map((f, i) => `
                    <div class="file-item">
                        <span><i class="fas fa-file-pdf"></i> ${f.name}</span>
                        <button class="remove-btn" onclick="removePdfFile(${i})">Remove</button>
                    </div>
                `).join('');
                btn.disabled = files.length < 2;
            }

            btn.onclick = async () => {
                const formData = new FormData();
                files.forEach(f => formData.append('files', f));
                await handlePdfApiCall('/api/pdf-tools/merge', formData, 'merged.pdf');
            };

        } else if (action === 'rotate') {
            const drop = document.getElementById('pdf-rotate-drop');
            const input = document.getElementById('pdf-rotate-input');
            const name = document.getElementById('pdf-rotate-name');
            const btn = document.getElementById('pdf-rotate-btn');
            const angleSelect = document.getElementById('pdf-rotate-angle');
            let file = null;

            drop.onclick = () => input.click();

            drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
            drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('drag-over');
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && droppedFile.type === 'application/pdf') {
                    file = droppedFile;
                    name.textContent = `Selected: ${file.name}`;
                    btn.disabled = false;
                }
            });

            input.onchange = (e) => {
                file = e.target.files[0];
                name.textContent = file ? `Selected: ${file.name}` : '';
                btn.disabled = !file;
            };

            btn.onclick = async () => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('angle', angleSelect.value);
                await handlePdfApiCall('/api/pdf-tools/rotate', formData, 'rotated.pdf');
            };

        } else if (action === 'watermark') {
            const drop = document.getElementById('pdf-wm-drop');
            const input = document.getElementById('pdf-wm-input');
            const name = document.getElementById('pdf-wm-name');
            const btn = document.getElementById('pdf-wm-btn');
            const wmTextInput = document.getElementById('pdf-wm-text');
            let file = null;

            drop.onclick = () => input.click();

            drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
            drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('drag-over');
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && droppedFile.type === 'application/pdf') {
                    file = droppedFile;
                    name.textContent = `Selected: ${file.name}`;
                    btn.disabled = false;
                }
            });

            input.onchange = (e) => {
                file = e.target.files[0];
                name.textContent = file ? `Selected: ${file.name}` : '';
                btn.disabled = !file;
            };

            btn.onclick = async () => {
                const text = wmTextInput.value.trim();
                if (!text) return showToast('Enter watermark text', '#f44336');
                const formData = new FormData();
                formData.append('file', file);
                formData.append('text', text);
                await handlePdfApiCall('/api/pdf-tools/watermark', formData, 'watermarked.pdf');
            };
        } else if (action === 'split') {
            const drop = document.getElementById('pdf-split-drop');
            const input = document.getElementById('pdf-split-input');
            const name = document.getElementById('pdf-split-name');
            const btn = document.getElementById('pdf-split-btn');
            let file = null;

            drop.onclick = () => input.click();

            drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
            drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('drag-over');
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && droppedFile.type === 'application/pdf') {
                    file = droppedFile;
                    name.textContent = `Selected: ${file.name}`;
                    btn.disabled = false;
                }
            });

            input.onchange = (e) => {
                file = e.target.files[0];
                name.textContent = file ? `Selected: ${file.name}` : '';
                btn.disabled = !file;
            };

            btn.onclick = async () => {
                const formData = new FormData();
                formData.append('file', file);
                await handlePdfApiCall('/api/pdf-tools/split', formData, 'pages.zip');
            };
        }
    }

    // --- Docs Toolkit Logic ---
    const docsToolArea = document.getElementById('docs-tool-area');
    const docsActions = document.querySelectorAll('[data-docs-action]');

    const docsTemplates = {
        'md-to-pdf': `
            <div class="drop-zone" id="docs-md-drop">
                <i class="fab fa-markdown"></i>
                <p>Select Markdown file (.md)</p>
                <input type="file" id="docs-md-input" accept=".md" hidden>
                <div id="docs-md-name" style="margin-top: 1rem; font-weight: 600;"></div>
            </div>
            <div class="options-panel">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <label>Line Spacing:</label>
                    <input type="number" id="md-line-spacing" value="1.6" step="0.1" style="width: 80px;">
                </div>
                <button class="primary-btn" id="docs-md-btn" disabled>Convert to PDF</button>
            </div>
        `,
        'modify-docx': `
            <div class="drop-zone" id="docs-docx-drop">
                <i class="fas fa-file-word"></i>
                <p>Select DOCX file to modify</p>
                <input type="file" id="docs-docx-input" accept=".docx" hidden>
                <div id="docs-docx-name" style="margin-top: 1rem; font-weight: 600;"></div>
            </div>
            <div class="options-panel">
                <label class="checkbox-group"><input type="checkbox" id="remove-images"> Remove All Images</label>
                <label class="checkbox-group"><input type="checkbox" id="remove-links"> Remove Hyperlinks</label>
                <button class="primary-btn" id="docs-modify-btn" disabled>Apply Changes</button>
            </div>
        `,
        'metadata': `
            <div class="drop-zone" id="docs-meta-drop">
                <i class="fas fa-search"></i>
                <p>Select Document to view metadata</p>
                <input type="file" id="docs-meta-input" accept=".docx" hidden>
                <div id="docs-meta-name" style="margin-top: 1rem; font-weight: 600;"></div>
            </div>
            <button class="primary-btn" id="docs-meta-btn" style="width: 100%; margin-top: 1rem;" disabled>Extract Metadata</button>
            <div id="meta-result" class="metadata-display" style="display: none;"></div>
        `
    };

    docsActions.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-docs-action');
            docsActions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            docsToolArea.innerHTML = docsTemplates[action];
            initDocsToolLogic(action);
        });
    });

    function initDocsToolLogic(action) {
        if (action === 'md-to-pdf') {
            const drop = document.getElementById('docs-md-drop');
            const input = document.getElementById('docs-md-input');
            const name = document.getElementById('docs-md-name');
            const btn = document.getElementById('docs-md-btn');
            const spacing = document.getElementById('md-line-spacing');
            let file = null;

            drop.onclick = () => input.click();
            input.onchange = (e) => {
                file = e.target.files[0];
                name.textContent = file ? `Selected: ${file.name}` : '';
                btn.disabled = !file;
            };

            btn.onclick = async () => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('options', JSON.stringify({ lineSpacing: spacing.value }));
                await handlePdfApiCall('/api/docs/convert', formData, 'document.pdf');
            };

        } else if (action === 'modify-docx') {
            const drop = document.getElementById('docs-docx-drop');
            const input = document.getElementById('docs-docx-input');
            const name = document.getElementById('docs-docx-name');
            const btn = document.getElementById('docs-modify-btn');
            let file = null;

            drop.onclick = () => input.click();
            input.onchange = (e) => {
                file = e.target.files[0];
                name.textContent = file ? `Selected: ${file.name}` : '';
                btn.disabled = !file;
            };

            btn.onclick = async () => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('removeImages', document.getElementById('remove-images').checked);
                formData.append('removeLinks', document.getElementById('remove-links').checked);
                await handlePdfApiCall('/api/docs/modify', formData, `modified_${file.name}`);
            };

        } else if (action === 'metadata') {
            const drop = document.getElementById('docs-meta-drop');
            const input = document.getElementById('docs-meta-input');
            const name = document.getElementById('docs-meta-name');
            const btn = document.getElementById('docs-meta-btn');
            const result = document.getElementById('meta-result');
            let file = null;

            drop.onclick = () => input.click();
            input.onchange = (e) => {
                file = e.target.files[0];
                name.textContent = file ? `Selected: ${file.name}` : '';
                btn.disabled = !file;
            };

            btn.onclick = async () => {
                const formData = new FormData();
                formData.append('file', file);
                updateProgress(true, 'Extracting Metadata...', 50);
                try {
                    const response = await fetch('/api/docs/metadata', { method: 'POST', body: formData });
                    const data = await response.json();
                    result.style.display = 'block';
                    result.innerHTML = `
                        <strong>Author:</strong> ${data.creator}<br>
                        <strong>Last Modified:</strong> ${data.lastModifiedBy}<br>
                        <strong>Created:</strong> ${data.created}<br>
                        <strong>Application:</strong> ${data.application}
                    `;
                    showToast('Metadata extracted!', '#6366f1');
                } catch (error) {
                    showToast('Failed to extract metadata', '#f44336');
                } finally {
                    updateProgress(false);
                }
            };
        }
    }

    async function handlePdfApiCall(url, formData, defaultName) {
        updateProgress(true, 'Processing PDF...', 50);
        try {
            const response = await fetch(url, { method: 'POST', body: formData });
            
            if (!response.ok) {
                let errorMessage = 'Something went wrong. Please try again.';
                try {
                    const errData = await response.json();
                    errorMessage = errData.error || errData.message || errorMessage;
                } catch (e) {
                    // Not JSON, use custom message based on status
                    if (response.status === 404) errorMessage = 'Conversion service not found. Please restart the server.';
                    if (response.status === 413) errorMessage = 'File is too large! Maximum limit is 50MB.';
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = defaultName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Success! Your file is ready.', '#6366f1');
        } catch (error) {
            showToast(error.message, '#f44336');
        } finally {
            updateProgress(false);
        }
    }

    // --- Helpers ---
    function showToast(message, color) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'glass toast';
        toast.style.backgroundColor = color;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function updateProgress(show, text = '', percent = 0) {
        const container = document.getElementById('progress-container');
        const status = document.getElementById('status-text');
        const bar = document.getElementById('progress-bar');

        container.style.display = show ? 'block' : 'none';
        status.textContent = text;
        bar.style.width = `${percent}%`;
    }
});
