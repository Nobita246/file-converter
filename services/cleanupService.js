const fs = require('fs');
const path = require('path');

/**
 * Automatically deletes files in the uploads directory that are older than a certain age.
 * @param {string} dir - The directory to clean.
 * @param {number} maxAgeMs - Maximum age of files in milliseconds (default 1 hour).
 */
const cleanUploads = (dir, maxAgeMs = 60 * 60 * 1000) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory for cleanup:', err);
      return;
    }

    const now = Date.now();

    files.forEach(file => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error stat-ing file ${file}:`, err);
          return;
        }

        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlink(filePath, err => {
            if (err) console.error(`Failed to delete expired file ${file}:`, err);
            else console.log(`Deleted expired file: ${file}`);
          });
        }
      });
    });
  });
};

// Export a manual delete helper too
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, err => {
      if (err) console.error(`Error deleting file ${filePath}:`, err);
    });
  }
};

module.exports = { cleanUploads, deleteFile };
