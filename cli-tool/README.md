# 🎵 SaavnDownloader - JioSaavn Music Downloader

A comprehensive PowerShell CLI tool for downloading high-quality music from JioSaavn API with visual progress indicators and user-friendly interface.

## ✨ Features

- 🔍 **Smart Search**: Search for songs, artists, albums, or any music query
- 🎵 **High Quality**: Download in multiple qualities (12kbps to 320kbps)
- 📊 **Visual Progress**: Real-time download progress with progress bars
- 🎨 **User-Friendly**: Colorful interface with clear status messages
- 📁 **Organized**: Automatic file naming and directory management
- ⚡ **Fast**: Direct API integration without server dependencies
- 🛡️ **Safe**: Filename sanitization and error handling

## 🚀 Quick Start

### Method 1: Automatic Setup (Recommended)
```cmd
# First time setup - installs all dependencies
.\setup-environment.bat

# Then run the downloader
.\run-downloader.bat
```

### Method 2: Using Batch File (Easiest)
```cmd
.\run-downloader.bat
```

### Method 3: Direct PowerShell
```powershell
.\SaavnDownloader.ps1 -Query "bollywood songs" -Limit 5
```

## 📋 Usage

### Basic Usage
```powershell
# Search and download songs
.\SaavnDownloader.ps1 -Query "Arijit Singh" -Limit 10

# Specify output directory
.\SaavnDownloader.ps1 -Query "Hindi songs" -OutputDir "C:\Music"

# Choose quality
.\SaavnDownloader.ps1 -Query "Punjabi songs" -Quality "320kbps"
```

### Advanced Usage
```powershell
# Full example with all options
.\SaavnDownloader.ps1 -Query "Bollywood hits 2024" -OutputDir "D:\Music\Bollywood" -Limit 20 -Quality "160kbps"
```

## 🎛️ Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `-Query` | Search query (song name, artist, etc.) | Required | `"Arijit Singh"` |
| `-OutputDir` | Output directory path | `.\Downloads` | `"C:\Music"` |
| `-Limit` | Number of songs to download | `10` | `20` |
| `-Quality` | Audio quality preference | `320kbps` | `"160kbps"` |
| `-Help` | Show help message | - | `-Help` |

## 🎵 Supported Qualities

The tool automatically selects the best available quality in this order:
1. **320kbps** (Best quality)
2. **256kbps**
3. **192kbps**
4. **160kbps**
5. **128kbps**
6. **96kbps**
7. **64kbps**
8. **48kbps**
9. **32kbps**
10. **16kbps**
11. **12kbps** (Lowest quality)

## 🧪 Testing

### Quick API Validation
```powershell
.\validate-api.ps1
```

### Full System Test
```powershell
.\test-downloader.ps1
```

### Quick API Test (faster)
```powershell
.\validate-api.ps1 -Quick
```

The tests will check:
- ✅ Internet connection
- ✅ JioSaavn API accessibility
- ✅ Search functionality
- ✅ Download URL availability
- ✅ File operations
- ✅ Progress display

## 📁 File Structure

```
cli-tool/
├── SaavnDownloader.ps1      # Main PowerShell script
├── run-downloader.bat       # Windows batch file for easy execution
├── setup-environment.bat    # Environment setup script
├── test-downloader.ps1      # Full system test suite
├── validate-api.ps1         # Quick API validation
└── README.md               # This file
```

## 🎨 Visual Features

### Color-Coded Output
- 🟢 **Green**: Success messages
- 🔴 **Red**: Error messages
- 🟡 **Yellow**: Warnings and progress
- 🔵 **Cyan**: Information and headers
- ⚪ **White**: General text
- 🔘 **Gray**: Secondary information

### Progress Indicators
- Real-time download progress bars
- Percentage completion
- File size information
- Download speed (when available)

## 📋 Example Output

```
╔══════════════════════════════════════════════════════════════╗
║                    🎵 SaavnDownloader 🎵                    ║
║              JioSaavn Music Downloader v1.0                ║
╚══════════════════════════════════════════════════════════════╝

🌐 Checking internet connection...
✅ Internet connection OK!

📋 Configuration:
   Search Query: bollywood songs
   Output Directory: .\Downloads
   Limit: 5 songs
   Preferred Quality: 320kbps

🔍 Searching for: 'bollywood songs'...
✅ Found 5 songs!

📋 Search Results:
   1. Tere Bina - Arijit Singh (4.2 min)
   2. Tum Hi Ho - Arijit Singh (4.2 min)
   3. Channa Mereya - Arijit Singh (4.4 min)
   4. Kalank - Arijit Singh (4.1 min)
   5. Gerua - Arijit Singh (4.2 min)

Do you want to download these songs? (y/N): y

🚀 Starting downloads...

[1/5] 🎵 Downloading: Tere Bina - Arijit Singh
📊 Selected quality: 320kbps
⬇️  Downloading to: .\Downloads\Arijit Singh - Tere Bina.mp4
✅ Downloaded: Arijit Singh - Tere Bina.mp4
📁 File size: 8.5 MB

🎉 Download Summary:
   Total songs: 5
   Successfully downloaded: 5
   Failed: 0
   Output directory: .\Downloads

✅ Downloads completed! Check your output directory for the files.
```

## ⚠️ Requirements

- **Windows PowerShell 5.0+** (included in Windows 10/11)
- **Internet connection**
- **Write permissions** to output directory

## 🔧 Troubleshooting

### Common Issues

1. **"Execution Policy" Error**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **"No internet connection" Error**
   - Check your internet connection
   - Verify JioSaavn API is accessible: https://saavn.dev

3. **"Download failed" Error**
   - Check if output directory exists and is writable
   - Verify sufficient disk space
   - Try a different quality setting

4. **"No songs found" Error**
   - Try different search terms
   - Check spelling
   - Use more generic terms (e.g., "bollywood" instead of specific song names)

### Getting Help

Run the help command:
```powershell
.\SaavnDownloader.ps1 -Help
```

## 📄 License

This tool is for educational purposes only. Please respect copyright laws and terms of service of JioSaavn.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Happy Downloading! 🎵✨**
