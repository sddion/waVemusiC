// Music API integration for streaming songs
// Using JioSaavn API from https://saavn.dev/ for music search and streaming

export interface StreamableSong {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  cover_url: string
  stream_url: string
  source: 'api' | 'local'
  preview_url?: string
  release_date?: string
  genre?: string
  language?: string
}

export interface SearchResult {
  songs: StreamableSong[]
  total: number
  page: number
}

// JioSaavn API response interfaces based on saavn.dev documentation
interface SaavnSearchResponse {
  results?: SaavnSong[]
  songs?: {
    results: SaavnSong[]
  }
  data?: {
    results: SaavnSong[]
  }
  albums?: {
    results: Array<{
      id: string
      name: string
      year?: string
      image?: Array<{quality: string, link: string}>
    }>
  }
  playlists?: {
    results: Array<{
      id: string
      name: string
      description?: string
      image?: Array<{quality: string, link: string}>
    }>
  }
  artists?: {
    results: Array<{
      id: string
      name: string
      image?: Array<{quality: string, link: string}>
    }>
  }
}

interface SaavnSong {
  id?: string
  song_id?: string
  track_id?: string
  name?: string
  title?: string
  song_name?: string
  track_name?: string
  primaryArtists?: string
  artist?: string
  artists?: string
  singer?: string
  album?: {
    name: string
  }
  album_name?: string
  duration?: string
  length?: string
  duration_ms?: string
  image?: Array<{
    quality: string
    link: string
  }>
  images?: Array<{
    quality: string
    link: string
  }>
  cover_image?: Array<{
    quality: string
    link: string
  }>
  thumbnail?: Array<{
    quality: string
    link: string
  }>
  downloadUrl?: Array<{
    quality: string
    link: string
  }>
  download_url?: Array<{
    quality: string
    link: string
  }>
  media_url?: Array<{
    quality: string
    link: string
  }>
  audio_url?: Array<{
    quality: string
    link: string
  }>
  release_date?: string
  genre?: string
  category?: string
  language?: string
  year?: string
}

interface SaavnSongDetailsResponse {
  id: string
  name: string
  primaryArtists: string
  album?: {
    name: string
  }
  duration: string
  image: Array<{
    quality: string
    link: string
  }>
  downloadUrl: Array<{
    quality: string
    link: string
  }>
  language?: string
  year?: string
}

class MusicAPI {
  private baseUrl = 'https://saavn.dev'
  private fallbackApis = [
    'https://jiosaavn-api.vercel.app',
    'https://jiosaavn-api.herokuapp.com',
    'https://jiosaavn-api.cyclic.app',
    'https://jiosaavn-api.onrender.com',
    'https://saavn.dev/api'
  ]
  
  // Search for songs using multiple API endpoints with fallback
  async searchSongs(query: string, page: number = 1, limit: number = 20): Promise<SearchResult> {
    const searchEndpoints = [
      // Try working endpoints first
      ...this.fallbackApis.map(base => `${base}/search?query=${encodeURIComponent(query)}`),
      ...this.fallbackApis.map(base => `${base}/search/all?query=${encodeURIComponent(query)}`),
      ...this.fallbackApis.map(base => `${base}/search/songs?query=${encodeURIComponent(query)}`),
      // Try saavn.dev endpoints last
      `${this.baseUrl}/search/all?query=${encodeURIComponent(query)}`,
      `${this.baseUrl}/api/search/all?query=${encodeURIComponent(query)}`
    ]

    for (const searchUrl of searchEndpoints) {
      try {
        console.log('Trying API endpoint:', searchUrl)
        
        // Use proxy to avoid CORS issues
        const proxyUrl = `/api/music-proxy?endpoint=${encodeURIComponent(searchUrl.split('?')[0])}&query=${encodeURIComponent(query)}`
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        if (!response.ok) {
          console.log(`API endpoint failed: ${response.status} ${response.statusText}`)
          continue
        }

               const data: SaavnSearchResponse = await response.json()
        console.log('API Response received from:', searchUrl)
        
        // Handle different response formats
        let songsData: SaavnSong[] = []
        
        if (data.results && Array.isArray(data.results)) {
          songsData = data.results
        } else if (data.songs?.results && Array.isArray(data.songs.results)) {
          songsData = data.songs.results
        } else if (data.data?.results && Array.isArray(data.data.results)) {
          songsData = data.data.results
        } else if (Array.isArray(data)) {
          songsData = data
        }
        
        if (songsData.length === 0) {
          console.log('No songs found in response, trying next endpoint')
          continue
        }

        const songs: StreamableSong[] = songsData
          .slice(0, limit)
          .map((item: SaavnSong) => this.transformSaavnSong(item))
          .filter((song: StreamableSong | null) => song !== null)

        console.log('Successfully found', songs.length, 'songs')
        return {
          songs,
          total: songs.length,
          page
        }
      } catch (error) {
        console.log(`Error with endpoint ${searchUrl}:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    console.log('All API endpoints failed')
    return { songs: [], total: 0, page }
  }


  // Get song details and streaming URL using the official API
  async getSongDetails(songId: string): Promise<StreamableSong | null> {
    try {
      const detailsUrl = `${this.baseUrl}/songs?id=${encodeURIComponent(songId)}`
      
      const response = await fetch(detailsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SaavnSongDetailsResponse = await response.json()
      
      if (!data.id) {
        return null
      }

      return this.transformSaavnSong(data)
    } catch (error) {
      console.error('Error getting song details:', error)
      return null
    }
  }

  // Transform API response to our format (handles different API formats)
  private transformSaavnSong(item: SaavnSong): StreamableSong | null {
    try {
      // Handle different API response formats
      const songId = item.id || item.song_id || item.track_id
      const songName = item.name || item.title || item.song_name || item.track_name
      const artistName = item.primaryArtists || item.artist || item.artists || item.singer
      const albumName = item.album?.name || item.album_name || item.album
      const songDuration = item.duration || item.length || item.duration_ms
      const downloadUrls = item.downloadUrl || item.download_url || item.media_url || item.audio_url
      const images = item.image || item.images || item.cover_image || item.thumbnail

      if (!songId || !songName) {
        return null
      }

      // Get the best quality image
      const coverUrl = this.getBestImageUrl(images || [])
      
      // Get the best quality download URL (prefer 320kbps)
      const streamUrl = this.getBestDownloadUrl(downloadUrls || [])
      
      // Format artist name
      let formattedArtist = 'Unknown Artist'
      if (Array.isArray(artistName)) {
        formattedArtist = artistName.map(artist => 
          typeof artist === 'string' ? artist : artist.name || artist
        ).join(', ')
      } else if (typeof artistName === 'string') {
        formattedArtist = artistName
      }
      
      return {
        id: `api_${songId}`,
        title: this.decodeHtmlEntities(songName),
        artist: this.decodeHtmlEntities(formattedArtist),
        album: albumName ? this.decodeHtmlEntities(typeof albumName === 'string' ? albumName : albumName.name || 'Unknown Album') : 'Unknown Album',
        duration: this.parseDuration(songDuration || '0'),
        cover_url: coverUrl,
        stream_url: streamUrl,
        source: 'api',
        language: item.language || 'unknown',
        release_date: item.year || item.release_date,
        genre: item.genre || item.category || item.language || 'unknown'
      }
    } catch (error) {
      console.error('Error transforming song:', error)
      return null
    }
  }

  // Get the best quality image URL
  private getBestImageUrl(images: string | Array<{url?: string, link?: string, quality: string}>): string {
    if (!images) return '/default-album-art.svg'
    
    // Handle string URL
    if (typeof images === 'string') {
      return images
    }
    
    // Handle array of image objects
    if (Array.isArray(images)) {
      if (images.length === 0) return '/default-album-art.svg'
      
      // Prefer higher quality images
      const qualityOrder = ['500x500', '300x300', '150x150', '50x50']
      
      for (const quality of qualityOrder) {
        const image = images.find(img => img.quality === quality)
        if (image && image.link) {
          return image.link
        }
      }
      
      // Fallback to first available image
      return images[0].link || images[0].url || '/default-album-art.svg'
    }
    
    return '/default-album-art.svg'
  }

  // Get the best quality download URL (prefer 320kbps)
  private getBestDownloadUrl(downloadUrls: string | Array<{url?: string, link?: string, quality: string}>): string {
    if (!downloadUrls) return ''
    
    // Handle string URL
    if (typeof downloadUrls === 'string') {
      return downloadUrls
    }
    
    // Handle array of download objects
    if (Array.isArray(downloadUrls)) {
      if (downloadUrls.length === 0) return ''
      
      // Prefer higher quality audio
      const qualityOrder = ['320kbps', '160kbps', '128kbps', '96kbps']
      
      for (const quality of qualityOrder) {
        const download = downloadUrls.find(url => url.quality === quality)
        if (download && download.link) {
          return download.link
        }
      }
      
      // Fallback to first available download URL
      return downloadUrls[0].link || downloadUrls[0].url || ''
    }
    
    return ''
  }

  // Parse duration from string to seconds
  private parseDuration(duration: string): number {
    if (!duration) return 0
    
    // Handle different duration formats
    if (typeof duration === 'number') {
      return duration
    }
    
    // Parse "3:45" format
    const parts = duration.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseInt(parts[1]) || 0
      return minutes * 60 + seconds
    }
    
    // Parse seconds directly
    const seconds = parseInt(duration)
    return isNaN(seconds) ? 0 : seconds
  }

  // Decode HTML entities
  private decodeHtmlEntities(text: string): string {
    if (!text) return ''
    
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  // Get trending songs (using search with popular terms)
  async getTrendingSongs(limit: number = 20): Promise<StreamableSong[]> {
    try {
      // Search for popular terms to get trending content
      const trendingQueries = ['bollywood', 'hindi', 'english', 'punjabi', 'tamil']
      const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)]
      
      const result = await this.searchSongs(randomQuery, 1, limit)
      return result.songs
    } catch (error) {
      console.error('Error getting trending songs:', error)
      return []
    }
  }
}

// Export singleton instance
export const musicAPI = new MusicAPI()

// Helper function to check if a song is from API
export const isApiSong = (songId: string): boolean => {
  return songId.startsWith('api_')
}

// Helper function to get original song ID from API song ID
export const getOriginalSongId = (songId: string): string => {
  return songId.replace('api_', '')
}