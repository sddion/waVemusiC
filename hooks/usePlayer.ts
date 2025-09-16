import { useCallback, useEffect, useRef, useState } from 'react'
import { useMusicStore } from '@/store/musicStore'
import type { MusicSong } from '@/store/musicStore'
import { createClient } from '@/lib/supabase'

export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  repeatMode: 'off' | 'single' | 'all'
  shuffle: boolean
  queue: MusicSong[]
  currentQueueIndex: number
}

export interface PlayerActions {
  play: () => void
  pause: () => void
  playPause: () => void
  stop: () => void
  nextTrack: () => void
  previousTrack: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  addToQueue: (song: MusicSong) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (fromIndex: number, toIndex: number) => void
  clearQueue: () => void
  playFromQueue: (index: number) => void
  playSong: (song: MusicSong) => void
  playPlaylist: (playlistId: string) => void
}

export function usePlayer(): PlayerState & PlayerActions {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const {
    songs,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    setCurrentTime,
    setDuration,
    setVolume,
    playPause,
    nextSong,
    previousSong,
    toggleRepeat,
    toggleShuffle,
    setCurrentSongIndex,
    playSelectedSong,
  } = useMusicStore()

  // Queue management state
  const [queue, setQueue] = useState<MusicSong[]>([])
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.crossOrigin = 'anonymous'
      audioRef.current = audio
      setIsInitialized(true)
    }
  }, [])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isInitialized) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      handleTrackEnd()
    }

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(console.error)
      }
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
    }

    const handleLoadStart = () => {
      console.log('Audio loading started')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [isInitialized, isPlaying, setCurrentTime, setDuration, handleTrackEnd])

  // Handle current song changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isInitialized || songs.length === 0) return

    const currentSong = songs[currentSongIndex]
    if (!currentSong) return

    console.log('Song changed:', currentSong.title)
    audio.src = currentSong.file_url
    audio.load()

    if (isPlaying) {
      audio.play().catch(console.error)
    }
  }, [isInitialized, currentSongIndex, songs, isPlaying])

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  // Handle track end based on repeat mode
  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'single') {
      // Repeat current song
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(console.error)
      }
    } else if (repeatMode === 'all') {
      // Repeat entire playlist
      nextSong()
    } else {
      // Normal progression
      nextSong()
    }
  }, [repeatMode, nextSong])

  // Player actions
  const play = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.src) {
      audio.play().catch(console.error)
    }
  }, [])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
    }
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      setCurrentTime(0)
    }
  }, [setCurrentTime])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio && duration > 0) {
      const newTime = Math.max(0, Math.min(duration, time))
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [duration, setCurrentTime])

  // Queue management
  const addToQueue = useCallback((song: MusicSong) => {
    setQueue(prev => [...prev, song])
  }, [])

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index)
      if (index < currentQueueIndex) {
        setCurrentQueueIndex(prev => prev - 1)
      } else if (index === currentQueueIndex && newQueue.length > 0) {
        const nextIndex = Math.min(currentQueueIndex, newQueue.length - 1)
        setCurrentQueueIndex(nextIndex)
      }
      return newQueue
    })
  }, [currentQueueIndex])

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev]
      const [movedItem] = newQueue.splice(fromIndex, 1)
      newQueue.splice(toIndex, 0, movedItem)
      
      // Update current queue index if needed
      if (fromIndex === currentQueueIndex) {
        setCurrentQueueIndex(toIndex)
      } else if (fromIndex < currentQueueIndex && toIndex >= currentQueueIndex) {
        setCurrentQueueIndex(prev => prev - 1)
      } else if (fromIndex > currentQueueIndex && toIndex <= currentQueueIndex) {
        setCurrentQueueIndex(prev => prev + 1)
      }
      
      return newQueue
    })
  }, [currentQueueIndex])

  const clearQueue = useCallback(() => {
    setQueue([])
    setCurrentQueueIndex(0)
  }, [])

  const playFromQueue = useCallback((index: number) => {
    if (index >= 0 && index < queue.length) {
      setCurrentQueueIndex(index)
      const song = queue[index]
      const songIndex = songs.findIndex(s => s.id === song.id)
      if (songIndex !== -1) {
        setCurrentSongIndex(songIndex)
        playSelectedSong(songIndex)
      }
    }
  }, [queue, songs, setCurrentSongIndex, playSelectedSong])

  const playSong = useCallback((song: MusicSong) => {
    const songIndex = songs.findIndex(s => s.id === song.id)
    if (songIndex !== -1) {
      setCurrentSongIndex(songIndex)
      playSelectedSong(songIndex)
    }
  }, [songs, setCurrentSongIndex, playSelectedSong])

  const playPlaylist = useCallback(async (playlistId: string) => {
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
        setCurrentQueue(songs)
        setCurrentQueueIndex(0)
        setCurrentSongIndex(0)
        playSong()
        console.log('Playing playlist:', playlistId, 'with', songs.length, 'songs')
      }
    } catch (error) {
      console.error("Failed to play playlist:", error)
    }
  }, [setCurrentQueue, setCurrentQueueIndex, setCurrentSongIndex, playSong])

  // Enhanced next/previous with queue support
  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      // Use queue if available
      const nextIndex = (currentQueueIndex + 1) % queue.length
      playFromQueue(nextIndex)
    } else {
      // Use main songs array
      nextSong()
    }
  }, [queue, currentQueueIndex, playFromQueue, nextSong])

  const previousTrack = useCallback(() => {
    if (queue.length > 0) {
      // Use queue if available
      const prevIndex = currentQueueIndex === 0 ? queue.length - 1 : currentQueueIndex - 1
      playFromQueue(prevIndex)
    } else {
      // Use main songs array
      previousSong()
    }
  }, [queue, currentQueueIndex, playFromQueue, previousSong])

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    queue,
    currentQueueIndex,
    
    // Actions
    play,
    pause,
    playPause,
    stop,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playFromQueue,
    playSong,
    playPlaylist,
  }
}

