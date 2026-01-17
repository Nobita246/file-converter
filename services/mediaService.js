const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegStatic);

class MediaService {
  /**
   * Convert Video/Audio to different formats (MP4 to MP3, etc.)
   */
  async convertMedia(inputPath, outputFormat) {
    const outputPath = inputPath.replace(path.extname(inputPath), `.${outputFormat}`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(outputFormat)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  /**
   * Extract Audio from Video
   */
  async videoToMp3(inputPath) {
    return this.convertMedia(inputPath, 'mp3');
  }

  /**
   * Video to GIF
   */
  async videoToGif(inputPath) {
    const outputPath = inputPath.replace(path.extname(inputPath), '.gif');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime('00:00:00')
        .setDuration('5') // Limit to 5 seconds for GIF
        .fps(10)
        .size('320x?')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }
}

module.exports = new MediaService();
