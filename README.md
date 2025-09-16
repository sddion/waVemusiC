# Wave Music Player

A modern, responsive music player built with Next.js 15, TypeScript, and Supabase. Features cloud storage, real-time sync, and a beautiful UI with anime.js animations.

## Features

- 🎵 **Audio Playback**: Play, pause, stop, skip, previous/next
- 🔀 **Shuffle & Repeat**: Multiple repeat modes and shuffle functionality
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Modern UI**: Beautiful animations with anime.js
- ☁️ **Cloud Storage**: Audio files stored in Supabase Storage
- 🗃️ **Metadata Extraction**: Automatic ID3 tag parsing
- ❤️ **Favorites**: Mark songs as favorites
- 📋 **Playlists**: Create and manage playlists
- 🔍 **Search**: Find songs by title, artist, or album
- 📊 **Queue Management**: Add songs to queue and reorder

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, React
- **Styling**: Tailwind CSS, anime.js animations
- **Backend**: Supabase (Postgres + Storage)
- **State Management**: Zustand
- **Audio**: HTML5 Audio API
- **Metadata**: music-metadata library

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd waVemusiC
   npm install
   ```

2. **Setup Supabase**:
   - Create a new Supabase project
   - Run the database migrations:
     ```bash
     # Apply the initial schema
     supabase db push
     ```
   - Or manually run the SQL files in `supabase/migrations/`

3. **Environment Variables**:
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Upload your music**:
   ```bash
   # Upload all MP3 files from public/songs directory
   npm run upload:dir
   
   # Or upload individual files
   npm run upload path/to/song.mp3
   
   # Extract metadata only (no upload)
   node scripts/upload.js song.mp3 --metadata-only
   ```

## Usage

### Uploading Music

The CLI uploader supports multiple formats and automatically extracts metadata:

```bash
# Upload single file
node scripts/upload.js song.mp3

# Upload entire directory
node scripts/upload.js /path/to/music/folder/

# View metadata without uploading
node scripts/upload.js song.mp3 --metadata-only
```

### Supported Audio Formats

- MP3
- WAV
- FLAC
- OGG
- M4A

### API Endpoints

- `POST /api/upload` - Upload audio files with metadata extraction
- `GET /api/songs` - Get paginated song list with search/filter
- `GET /api/stream/[id]` - Stream audio files with range support
- `GET /api/playlists` - Get user playlists
- `POST /api/playlists` - Create new playlist
- `POST /api/favorites/[id]` - Toggle favorite status

## Database Schema

The app uses the following main tables:

- `songs` - Audio file metadata
- `playlists` - User playlists
- `playlist_songs` - Playlist-song relationships
- `user_favorites` - User favorite songs
- `playback_states` - Real-time playback state

## Development

### Project Structure

```
├── app/                 # Next.js app router pages
├── components/          # React components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── scripts/            # CLI tools
├── store/              # Zustand state management
└── supabase/           # Database migrations
```

### Key Components

- `MusicPlayer` - Main audio player component
- `AlbumCarousel` - Swiper-based album art carousel
- `SearchBar` - Live search functionality
- `useMusicStore` - Global state management
- `usePlayer` - Audio playback logic

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue.