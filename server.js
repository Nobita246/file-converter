const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // For development ease with external fonts/scripts
}));
app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'File Converter API is running' });
});

// Import Routes
const convertRoutes = require('./routes/convert');
const pdfRoutes = require('./routes/pdf-tools');
const docsRoutes = require('./routes/docs');

app.use('/api/convert', convertRoutes);
app.use('/api/pdf-tools', pdfRoutes);
app.use('/api/docs', docsRoutes);

// Periodic cleanup every hour
const { cleanUploads } = require('./services/cleanupService');
setInterval(() => cleanUploads(uploadDir), 3600000);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

app.listen(PORT, () => {
  console.log(`
  🚀 File Converter Server running at http://localhost:${PORT}
  📂 Uploads directory: ${uploadDir}
  `);
});
