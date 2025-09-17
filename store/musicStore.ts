import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { createClient } from "@/lib/supabase"
import type { Song } from "@/lib/supabase"
import { musicAPI, type StreamableSong, isApiSong, getOriginalSongId } from "@/lib/music-api"


export interface MusicSong extends Song {
  genre?: string
  year?: number
  file_size?: number
  file_type?: string
  checksum?: string
  source?: 'local' | 'api'
  stream_url?: string
  preview_url?: string
}

interface MusicPlaybackState {
  id: string
  current_song_id: string
  playback_time: number
  is_playing: boolean
  volume: number
  repeat_mode: "off" | "single" | "all"
  shuffle: boolean
  updated_at: string
}


export interface MusicState {
  // Core state
  songs: MusicSong[]
  currentSongIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  repeatMode: "off" | "single" | "all"
  shuffle: boolean
  searchQuery: string
  searchResults: MusicSong[]

  // Enhanced state
  playbackState: MusicPlaybackState | null
  isUploading: boolean
  uploadProgress: number
  error: string | null
  isLoading: boolean

  // Queue and playlist state
  currentQueue: MusicSong[]
  currentQueueIndex: number
  playlists: Playlist[]
  favorites: string[]
  currentPlaylist: string | null

  // Actions
  setSongs: (songs: MusicSong[]) => void
  setCurrentSongIndex: (index: number) => void
  playPause: () => void
  playSong: () => void
  pauseSong: () => void
  nextSong: () => void
  previousSong: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setSearchQuery: (query: string) => void
  searchSongs: (query: string) => void
  searchApiSongs: (query: string) => Promise<StreamableSong[]>
  playSelectedSong: (index: number) => void
  playApiSong: (song: StreamableSong) => void

  // Enhanced actions
  setPlaybackState: (state: MusicPlaybackState) => void
  syncPlaybackState: () => void
  uploadSong: (file: File) => Promise<void>
  setUploadProgress: (progress: number) => void
  setError: (error: string | null) => void
  loadSongsWithFallback: () => Promise<void>
  setIsLoading: (loading: boolean) => void

  // Queue management
  addToQueue: (song: MusicSong) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (fromIndex: number, toIndex: number) => void
  clearQueue: () => void
  setCurrentQueue: (queue: MusicSong[]) => void
  setCurrentQueueIndex: (index: number) => void

  // Playlist management
  loadPlaylists: () => Promise<void>
  createPlaylist: (name: string, description?: string) => Promise<void>
  addToPlaylist: (playlistId: string, songId: string) => Promise<void>
  removeFromPlaylist: (playlistId: string, songId: string) => Promise<void>
  deletePlaylist: (playlistId: string) => Promise<void>
  playPlaylist: (playlistId: string) => Promise<void>

  // Favorites management
  toggleFavorite: (songId: string) => Promise<void>
  loadFavorites: () => Promise<void>

  // Auto-generated playlists
  generateAlbumPlaylist: (album: string) => void
  generateArtistPlaylist: (artist: string) => void
  generateFavoritesPlaylist: () => void
}

interface Playlist {
  id: string
  name: string
  description?: string
  cover_url?: string
  is_public: boolean
  is_auto_generated: boolean
  auto_generation_type?: string
  created_at: string
  updated_at: string
  songs?: MusicSong[]
}

export const useMusicStore = create<MusicState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    songs: [], // Start with empty array, load from Supabase
    currentSongIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    repeatMode: "off",
    shuffle: false,
    searchQuery: "",
    searchResults: [],

    playbackState: null,
    isUploading: false,
    uploadProgress: 0,
    error: null,
    isLoading: false,

    // Queue and playlist state
    currentQueue: [],
    currentQueueIndex: 0,
    playlists: [],
    favorites: [],
    currentPlaylist: null,

    // Core actions
    setSongs: (songs) => {
      set({ songs })
      console.log("Songs loaded:", songs.length)
    },

    setCurrentSongIndex: (index) => {
      const { songs } = get()
      if (index >= 0 && index < songs.length) {
        set({ currentSongIndex: index, currentTime: 0 })
        console.log(" Song index changed to:", index)
      }
    },

    playPause: () => {
      const { isPlaying } = get()
      set({ isPlaying: !isPlaying })
      console.log(" Play/pause toggled:", !isPlaying)
    },

    playSong: () => set({ isPlaying: true }),

    pauseSong: () => set({ isPlaying: false }),

    nextSong: () => {
      const { currentSongIndex, songs, shuffle, repeatMode } = get()
      let nextIndex

      if (repeatMode === 'single') {
        // Repeat current song
        nextIndex = currentSongIndex
      } else if (shuffle) {
        nextIndex = Math.floor(Math.random() * songs.length)
      } else {
        nextIndex = (currentSongIndex + 1) % songs.length
        // If we're at the end and repeat is off, don't advance
        if (nextIndex === 0 && repeatMode === 'off') {
          return
        }
      }

      set({ currentSongIndex: nextIndex, currentTime: 0 })
      console.log("Next song:", nextIndex, "repeatMode:", repeatMode)
    },

    previousSong: () => {
      const { currentSongIndex, songs } = get()
      const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length
      set({ currentSongIndex: prevIndex, currentTime: 0 })
      console.log("[Previous song:", prevIndex)
    },

    setCurrentTime: (time) => {
      if (time >= 0) {
        set({ currentTime: time })
      }
    },

    setDuration: (duration) => {
      if (duration > 0) {
        set({ duration })
      }
    },

    setVolume: (volume) => {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      set({ volume: clampedVolume })
    },

    toggleRepeat: () => {
      const { repeatMode } = get()
      const modes: ("off" | "single" | "all")[] = ["off", "single", "all"]
      const currentIndex = modes.indexOf(repeatMode)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      set({ repeatMode: nextMode })
      console.log(" Repeat mode:", nextMode)
    },

    toggleShuffle: () => {
      const { shuffle } = get()
      set({ shuffle: !shuffle })
      console.log("Shuffle toggled:", !shuffle)
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    searchSongs: (query) => {
      const { songs } = get()
      const results = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(query.toLowerCase()) ||
          song.artist.toLowerCase().includes(query.toLowerCase()) ||
          (song.album && song.album.toLowerCase().includes(query.toLowerCase())),
      )
      set({ searchResults: results })
    },

    searchApiSongs: async (query) => {
      try {
        set({ isLoading: true })
        const result = await musicAPI.searchSongs(query, 1, 20)
        
        // Convert StreamableSong to MusicSong format
        const apiSongs: MusicSong[] = result.songs.map((song) => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          duration: song.duration,
          cover_url: song.cover_url,
          file_url: song.stream_url, // Use stream_url as file_url for API songs
          source: 'api' as const,
          stream_url: song.stream_url,
          preview_url: song.preview_url,
          genre: song.genre,
          year: song.release_date ? parseInt(song.release_date) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        set({ isLoading: false })
        return result.songs
      } catch (error) {
        console.error('Error searching API songs:', error)
        set({ isLoading: false, error: 'Failed to search songs' })
        return []
      }
    },

    playApiSong: async (song) => {
      try {
        // First try to get detailed song information with proper streaming URL
        const originalSongId = song.id.replace('api_', '')
        const detailedSong = await musicAPI.getSongDetails(originalSongId)
        
        // Use detailed song if available, otherwise use the search result
        const songToPlay = detailedSong || song
        
        // Convert StreamableSong to MusicSong and add to queue
        const musicSong: MusicSong = {
          id: songToPlay.id,
          title: songToPlay.title,
          artist: songToPlay.artist,
          album: songToPlay.album || '',
          duration: songToPlay.duration,
          cover_url: songToPlay.cover_url,
          file_url: songToPlay.stream_url,
          source: 'api',
          stream_url: songToPlay.stream_url,
          preview_url: songToPlay.preview_url,
          genre: songToPlay.genre,
          year: songToPlay.release_date ? parseInt(songToPlay.release_date) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Add to queue and play
        const { currentQueue } = get()
        const newQueue = [...currentQueue, musicSong]
        set({ 
          currentQueue: newQueue,
          currentQueueIndex: newQueue.length - 1,
          currentSongIndex: newQueue.length - 1,
          isPlaying: true
        })
        
        console.log('Playing API song:', musicSong.title, 'Stream URL:', musicSong.stream_url)
      } catch (error) {
        console.error('Error playing API song:', error)
        // Fallback to original song data
        const musicSong: MusicSong = {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          duration: song.duration,
          cover_url: song.cover_url,
          file_url: song.stream_url,
          source: 'api',
          stream_url: song.stream_url,
          preview_url: song.preview_url,
          genre: song.genre,
          year: song.release_date ? parseInt(song.release_date) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { currentQueue } = get()
        const newQueue = [...currentQueue, musicSong]
        set({ 
          currentQueue: newQueue,
          currentQueueIndex: newQueue.length - 1,
          currentSongIndex: newQueue.length - 1,
          isPlaying: true
        })
      }
    },

    playSelectedSong: (index) => {
      const { songs } = get()
      if (index >= 0 && index < songs.length) {
        set({ currentSongIndex: index, isPlaying: true, currentTime: 0 })
        console.log("Selected song:", index)
      }
    },

    // Enhanced actions
    setPlaybackState: (state) => set({ playbackState: state }),

    syncPlaybackState: () => {
      const { currentSongIndex, isPlaying, currentTime, volume, repeatMode, shuffle, songs } = get()
      if (songs.length > 0) {
        const playbackState: MusicPlaybackState = {
          id: "current",
          current_song_id: songs[currentSongIndex]?.id || "",
          playback_time: currentTime,
          is_playing: isPlaying,
          volume,
          repeat_mode: repeatMode,
          shuffle,
          updated_at: new Date().toISOString(),
        }
        set({ playbackState })
      }
    },

    uploadSong: async (file: File) => {
      set({ isUploading: true, uploadProgress: 0, error: null })
      try {
        const supabase = createClient()
        
        // Upload file to Supabase Storage
        set({ uploadProgress: 10 })
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('music-files')
          .upload(fileName, file)
        
        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }
        
        set({ uploadProgress: 50 })
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('music-files')
          .getPublicUrl(fileName)
        
        set({ uploadProgress: 70 })
        
        // Create song record in database
        const newSong = {
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          artist: "Unknown Artist",
          album: "Unknown Album",
          file_url: publicUrl,
          duration: 0, // Will be updated when audio loads
        }
        
        const { data: songData, error: dbError } = await supabase
          .from('songs')
          .insert(newSong)
          .select()
          .single()
        
        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`)
        }
        
        set({ uploadProgress: 100 })
        
        // Add to songs list
        const { songs } = get()
        set({ 
          songs: [songData, ...songs],
          isUploading: false, 
          uploadProgress: 0 
        })
        
        console.log(" Song uploaded successfully:", songData.title)
      } catch (error) {
        set({
          isUploading: false,
          uploadProgress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
        })
      }
    },

    setUploadProgress: (progress) => set({ uploadProgress: progress }),

    setError: (error) => set({ error }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    loadSongsWithFallback: async () => {
      try {
        console.log("Loading songs...")
        set({ isLoading: true })

        const supabase = createClient()
        const { data: supabaseSongs, error } = await supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Supabase error:", error)
          set({ songs: [], error: "Failed to load songs from database", isLoading: false })
          return
        }

        console.log("Loaded songs from Supabase:", supabaseSongs?.length || 0)
        set({ songs: supabaseSongs || [], isLoading: false })
      } catch (error) {
        console.error("Failed to load from Supabase:", error)
        set({ songs: [], error: "Failed to load songs from database", isLoading: false })
      }
    },

    // Queue management
    addToQueue: (song) => {
      set((state) => ({
        currentQueue: [...state.currentQueue, song]
      }))
    },

    removeFromQueue: (index) => {
      set((state) => {
        const newQueue = state.currentQueue.filter((_, i) => i !== index)
        let newQueueIndex = state.currentQueueIndex
        
        if (index < state.currentQueueIndex) {
          newQueueIndex = state.currentQueueIndex - 1
        } else if (index === state.currentQueueIndex && newQueue.length > 0) {
          newQueueIndex = Math.min(state.currentQueueIndex, newQueue.length - 1)
        }
        
        return {
          currentQueue: newQueue,
          currentQueueIndex: newQueueIndex
        }
      })
    },

    reorderQueue: (fromIndex, toIndex) => {
      set((state) => {
        const newQueue = [...state.currentQueue]
        const [movedItem] = newQueue.splice(fromIndex, 1)
        newQueue.splice(toIndex, 0, movedItem)
        
        let newQueueIndex = state.currentQueueIndex
        if (fromIndex === state.currentQueueIndex) {
          newQueueIndex = toIndex
        } else if (fromIndex < state.currentQueueIndex && toIndex >= state.currentQueueIndex) {
          newQueueIndex = state.currentQueueIndex - 1
        } else if (fromIndex > state.currentQueueIndex && toIndex <= state.currentQueueIndex) {
          newQueueIndex = state.currentQueueIndex + 1
        }
        
        return {
          currentQueue: newQueue,
          currentQueueIndex: newQueueIndex
        }
      })
    },

    clearQueue: () => {
      set({ currentQueue: [], currentQueueIndex: 0 })
    },

    setCurrentQueue: (queue) => {
      set({ currentQueue: queue, currentQueueIndex: 0 })
    },

    setCurrentQueueIndex: (index) => {
      set({ currentQueueIndex: index })
    },

    // Playlist management
    loadPlaylists: async () => {
      try {
        const supabase = createClient()
        const { data: playlists, error } = await supabase
          .from("playlists")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading playlists:", error)
          return
        }

        set({ playlists: playlists || [] })
      } catch (error) {
        console.error("Failed to load playlists:", error)
      }
    },

    createPlaylist: async (name, description) => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("playlists")
          .insert({
            name,
            description,
            is_public: false,
            is_auto_generated: false
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating playlist:", error)
          return
        }

        set((state) => ({
          playlists: [...state.playlists, data]
        }))
      } catch (error) {
        console.error("Failed to create playlist:", error)
      }
    },

    addToPlaylist: async (playlistId, songId) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("playlist_songs")
          .insert({
            playlist_id: playlistId,
            song_id: songId,
            position: 0 // Will be updated by trigger
          })

        if (error) {
          console.error("Error adding song to playlist:", error)
        }
      } catch (error) {
        console.error("Failed to add song to playlist:", error)
      }
    },

    removeFromPlaylist: async (playlistId, songId) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("playlist_songs")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("song_id", songId)

        if (error) {
          console.error("Error removing song from playlist:", error)
        }
      } catch (error) {
        console.error("Failed to remove song from playlist:", error)
      }
    },

    deletePlaylist: async (playlistId) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("playlists")
          .delete()
          .eq("id", playlistId)

        if (error) {
          console.error("Error deleting playlist:", error)
          return
        }

        set((state) => ({
          playlists: state.playlists.filter(p => p.id !== playlistId)
        }))
      } catch (error) {
        console.error("Failed to delete playlist:", error)
      }
    },

    playPlaylist: async (playlistId) => {
      try {
        const supabase = createClient()
        const { data: playlistSongs, error } = await supabase
          .from("playlist_songs")
          .select(`
            song_id,
            position,
            songs (*)
          `)
          .eq("playlist_id", playlistId)
          .order("position", { ascending: true })

        if (error) {
          console.error("Error loading playlist songs:", error)
          return
        }

        const songs = (playlistSongs?.map((ps: any) => ps.songs).filter(Boolean) || []) as MusicSong[]
        if (songs.length > 0) {
          set({ 
            currentQueue: songs, 
            currentQueueIndex: 0,
            currentPlaylist: playlistId,
            currentSongIndex: 0,
            isPlaying: true,
            currentTime: 0
          })
        }
      } catch (error) {
        console.error("Failed to play playlist:", error)
      }
    },

    // Favorites management
    toggleFavorite: async (songId) => {
      try {
        const supabase = createClient()
        const { favorites } = get()
        
        if (favorites.includes(songId)) {
          // Remove from favorites
          const { error } = await supabase
            .from("public_favorites")
            .delete()
            .eq("song_id", songId)

          if (error) {
            return
          }

          set((state) => ({
            favorites: state.favorites.filter(id => id !== songId)
          }))
        } else {
          // Add to favorites
          const { error } = await supabase
            .from("public_favorites")
            .insert({
              song_id: songId,
            })

          if (error) {
            return
          }

          set((state) => ({
            favorites: [...state.favorites, songId]
          }))
        }
      } catch (error) {
        // Failed to toggle favorite
      }
    },

    loadFavorites: async () => {
      try {
        const supabase = createClient()
        const { data: favorites, error } = await supabase
          .from("public_favorites")
          .select("song_id")

        if (error) {
          return
        }

        set({ 
          favorites: favorites?.map(f => f.song_id) || []
        })
      } catch (error) {
        // Failed to load favorites
      }
    },

    // Auto-generated playlists
    generateAlbumPlaylist: (album) => {
      const { songs } = get()
      const albumSongs = songs.filter(song => song.album === album)
      if (albumSongs.length > 0) {
        set({ 
          currentQueue: albumSongs, 
          currentQueueIndex: 0,
          currentPlaylist: `album_${album}`,
          currentSongIndex: 0,
          isPlaying: true,
          currentTime: 0
        })
      }
    },

    generateArtistPlaylist: (artist) => {
      const { songs } = get()
      const artistSongs = songs.filter(song => song.artist === artist)
      if (artistSongs.length > 0) {
        set({ 
          currentQueue: artistSongs, 
          currentQueueIndex: 0,
          currentPlaylist: `artist_${artist}`,
          currentSongIndex: 0,
          isPlaying: true,
          currentTime: 0
        })
      }
    },

    generateFavoritesPlaylist: () => {
      const { songs, favorites } = get()
      const favoriteSongs = songs.filter(song => favorites.includes(song.id))
      if (favoriteSongs.length > 0) {
        set({ 
          currentQueue: favoriteSongs, 
          currentQueueIndex: 0,
          currentPlaylist: "favorites",
          currentSongIndex: 0,
          isPlaying: true,
          currentTime: 0
        })
      }
    },
  })),
)

// Helper functions for playlist and queue management
export function setCurrentSongIndex(index: number) {
  const { songs, setCurrentSongIndex: setIndex, setCurrentTime } = useMusicStore.getState()
  if (index >= 0 && index < songs.length) {
    setIndex(index)
    setCurrentTime(0)
    console.log("Song index changed to:", index)
  }
}

export function playSelectedSong(index: number) {
  const { songs, setCurrentSongIndex: setIndex, playSong, setCurrentTime } = useMusicStore.getState()
  if (index >= 0 && index < songs.length) {
    setIndex(index)
    playSong()
    setCurrentTime(0)
    console.log("Selected song:", index)
  }
}

