#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { parseFile } = require('music-metadata');
const { default: ora } = require('ora');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const UPLOAD_ENDPOINT = `${API_BASE_URL}/api/upload`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function uploadFile(filePath) {
  const spinner = ora(`Uploading: ${path.basename(filePath)}`).start();
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileName = path.basename(filePath);
    
    spinner.text = `Preparing upload: ${fileName} (${formatBytes(fileSize)})`;

    // Create form data with progress tracking
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    // Track upload progress
    let uploadedBytes = 0;
    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const progress = Math.round((uploadedBytes / fileSize) * 100);
      spinner.text = `Uploading: ${fileName} - ${progress}% (${formatBytes(uploadedBytes)}/${formatBytes(fileSize)})`;
    });

    form.append('file', fileStream);

    // Upload file with extended timeout for large files
    const timeout = Math.max(60000, fileSize / 1000); // 1 minute + 1ms per KB
    const response = await axios.post(UPLOAD_ENDPOINT, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data.success) {
      const song = response.data.song;
      spinner.succeed(`✅ Upload successful: ${fileName}`);
      logInfo(`Title: ${song.title}`);
      logInfo(`Artist: ${song.artist}`);
      logInfo(`Album: ${song.album || 'Unknown'}`);
      logInfo(`Duration: ${Math.round(song.duration)}s`);
      logInfo(`File URL: ${song.file_url}`);
      if (song.cover_url) {
        logInfo(`Cover: ${song.cover_url}`);
      }
      return song;
    } else {
      throw new Error(response.data.error || 'Upload failed');
    }

  } catch (error) {
    spinner.fail(`❌ Upload failed: ${path.basename(filePath)}`);
    
    if (error.response) {
      const errorData = error.response.data;
      if (errorData.error === 'File already exists') {
        spinner.warn(`⚠️  File already exists: ${errorData.songId}`);
        return { id: errorData.songId, alreadyExists: true };
      } else if (error.response.status === 413) {
        throw new Error(`File too large: ${formatBytes(fs.statSync(filePath).size)} (max: 100MB)`);
      } else {
        throw new Error(`Server error: ${errorData.error}`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Make sure the Next.js app is running on localhost:3000');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout - file may be too large or connection too slow');
    } else {
      throw error;
    }
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function uploadDirectory(dirPath) {
  try {
    logInfo(`Scanning directory: ${dirPath}`);
    
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const files = fs.readdirSync(dirPath);
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
    });

    if (audioFiles.length === 0) {
      logWarning('No audio files found in directory');
      return;
    }

    logInfo(`Found ${audioFiles.length} audio files`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let totalSize = 0;
    let uploadedSize = 0;

    // Calculate total size
    for (const file of audioFiles) {
      const filePath = path.join(dirPath, file);
      totalSize += fs.statSync(filePath).size;
    }

    logInfo(`Total size to upload: ${formatBytes(totalSize)}`);

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const filePath = path.join(dirPath, file);
      const fileSize = fs.statSync(filePath).size;
      
      try {
        logInfo(`\n[${i + 1}/${audioFiles.length}] Processing: ${file} (${formatBytes(fileSize)})`);
        const result = await uploadFile(filePath);
        
        if (result.alreadyExists) {
          skippedCount++;
        } else {
          successCount++;
          uploadedSize += fileSize;
        }
        
        // Show overall progress
        const overallProgress = Math.round((uploadedSize / totalSize) * 100);
        logInfo(`Overall progress: ${overallProgress}% (${formatBytes(uploadedSize)}/${formatBytes(totalSize)})`);
        
        // Small delay between uploads to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        logError(`Failed to upload ${file}: ${error.message}`);
        errorCount++;
        
        // Continue with next file even if one fails
        continue;
      }
    }

    logInfo(`\n🎉 Upload Summary:`);
    logSuccess(`✅ Successfully uploaded: ${successCount}`);
    logWarning(`⚠️  Skipped (already exists): ${skippedCount}`);
    logError(`❌ Failed: ${errorCount}`);
    logInfo(`📁 Total files processed: ${audioFiles.length}`);
    logInfo(`📊 Total data uploaded: ${formatBytes(uploadedSize)}`);

  } catch (error) {
    logError(`Directory upload failed: ${error.message}`);
    process.exit(1);
  }
}

async function extractMetadata(filePath) {
  try {
    logInfo(`Extracting metadata from: ${path.basename(filePath)}`);
    
    const metadata = await parseFile(filePath);
    
    logInfo('Metadata extracted:');
    logInfo(`Title: ${metadata.common.title || 'Unknown'}`);
    logInfo(`Artist: ${metadata.common.artist || 'Unknown'}`);
    logInfo(`Album: ${metadata.common.album || 'Unknown'}`);
    logInfo(`Genre: ${metadata.common.genre?.[0] || 'Unknown'}`);
    logInfo(`Year: ${metadata.common.year || 'Unknown'}`);
    logInfo(`Duration: ${Math.round(metadata.format.duration || 0)}s`);
    logInfo(`Bitrate: ${metadata.format.bitrate || 'Unknown'} kbps`);
    logInfo(`Sample Rate: ${metadata.format.sampleRate || 'Unknown'} Hz`);
    logInfo(`Channels: ${metadata.format.numberOfChannels || 'Unknown'}`);
    
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      logInfo(`Album Art: ${metadata.common.picture.length} image(s) found`);
    }
    
    return metadata;
    
  } catch (error) {
    logError(`Failed to extract metadata: ${error.message}`);
    return null;
  }
}

function showHelp() {
  log('Wave Music Player - CLI Uploader', 'bright');
  log('');
  log('Usage:', 'bright');
  log('  node scripts/upload.js <file-or-directory> [options]', 'cyan');
  log('');
  log('Options:', 'bright');
  log('  --metadata-only    Extract and display metadata without uploading', 'yellow');
  log('  --help, -h         Show this help message', 'yellow');
  log('');
  log('Examples:', 'bright');
  log('  node scripts/upload.js song.mp3', 'cyan');
  log('  node scripts/upload.js /path/to/songs/', 'cyan');
  log('  node scripts/upload.js song.mp3 --metadata-only', 'cyan');
  log('');
  log('Supported formats:', 'bright');
  log('  MP3, WAV, FLAC, OGG, M4A', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const inputPath = args[0];
  const metadataOnly = args.includes('--metadata-only');

  try {
    if (metadataOnly) {
      // Just extract metadata
      if (fs.statSync(inputPath).isFile()) {
        await extractMetadata(inputPath);
      } else {
        logError('--metadata-only option only works with individual files');
        process.exit(1);
      }
    } else {
      // Upload files
      const stats = fs.statSync(inputPath);
      
      if (stats.isFile()) {
        await uploadFile(inputPath);
      } else if (stats.isDirectory()) {
        await uploadDirectory(inputPath);
      } else {
        throw new Error('Input must be a file or directory');
      }
    }
    
  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
