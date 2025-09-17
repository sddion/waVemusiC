"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { useMusicStore, type MusicSong } from "@/store/musicStore"
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store'
import { setLastPlayedInfo } from '@/store/audioStore'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart, List } from "lucide-react"
import { slideInFromBottom, scaleButton, animateProgress, animateHeart, isGSAPAvailable } from "@/lib/gsap"
import Image from "next/image"

interface MusicPlayerProps {
  onQueueClick?: () => void
}

export default function MusicPlayer({ onQueueClick }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<AppDispatch>()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const {
    songs,
    apiSongs,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    currentQueue,
    currentQueueIndex,
    favorites,
    apiFavorites,
    setCurrentTime,
    setDuration,
    setVolume,
    playPause,
    nextSong,
    previousSong,
    toggleRepeat,
    toggleShuffle,
    syncPlaybackState,
    toggleFavorite,
    setCurrentSongIndex,
    playSong,
  } = useMusicStore()

  // Use queue if available, otherwise fall back to songs array
  const currentSong: MusicSong | null = currentQueue && currentQueue.length > 0 
    ? currentQueue[currentQueueIndex] 
    : songs && songs.length > 0 
      ? songs[currentSongIndex] 
      : null

  // Function to track song plays
  const trackSongPlay = useCallback(async (songId: string, playDuration: number = 0) => {
    try {
      // Check if it's an API song by looking at the songs arrays
      const isApiSong = apiSongs.some(song => song.id === songId) || 
                        (currentSong && currentSong.source === 'api')
      const endpoint = isApiSong ? '/api/api-track-play' : '/api/track-play'
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          playDuration
        })
      })
    } catch (error) {
      console.error('Error tracking song play:', error)
    }
  }, [apiSongs, currentSong])

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.crossOrigin = 'anonymous'
      // Use Object.assign to bypass readonly restriction
      Object.assign(audioRef, { current: audio })
    }
  }, [])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      
      // Update Redux store with current playback info for persistence
      if (currentSong) {
        dispatch(setLastPlayedInfo({
          songId: currentSong.id,
          time: audio.currentTime,
          index: currentQueue && currentQueue.length > 0 ? currentQueueIndex : currentSongIndex
        }))
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      // Track the song play when it ends (played for full duration)
      if (currentSong) {
        trackSongPlay(currentSong.id, Math.floor(duration))
      }
      
      if (repeatMode === 'single') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        nextSong()
      }
    }

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(() => {})
      }
    }

    const handlePlay = () => {
      // Track when a song starts playing
      if (currentSong) {
        trackSongPlay(currentSong.id, 0) // 0 duration for start tracking
      }
    }

    const handleError = (e: Event) => {
    console.error('Audio error:', e)
      // Audio error handled silently
    }

    const handleLoadStart = () => {
      // Audio loading started
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [isPlaying, setCurrentTime, setDuration, repeatMode, nextSong, currentSong, currentSongIndex, currentQueue, currentQueueIndex, dispatch, duration, trackSongPlay])

  // Handle current song changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    // Song changed
    audio.src = currentSong.file_url
    audio.load()

    if (isPlaying) {
      audio.play().catch(() => {})
    }
  }, [currentSongIndex, currentQueueIndex, currentSong, isPlaying])

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  // Initialize GSAP animations
  useEffect(() => {
    if (playerRef.current && isGSAPAvailable()) {
      slideInFromBottom(playerRef.current, {
        duration: 0.8,
        ease: "power2.out"
      })
    }
  }, [])

  // Animate progress bar
  useEffect(() => {
    if (progressRef.current && duration > 0 && isGSAPAvailable()) {
      const progressPercent = (currentTime / duration) * 100
      animateProgress(progressRef.current, `${Math.min(100, Math.max(0, progressPercent))}%`, {
        duration: 0.1,
        ease: "none"
      })
    }
  }, [currentTime, duration])

  // Animate play/pause button
  useEffect(() => {
    const playButton = document.querySelector('.play-pause-btn')
    if (playButton && isGSAPAvailable()) {
      scaleButton(playButton, isPlaying ? 1.1 : 0.9, {
        duration: 0.2,
        ease: "power2.out"
      })
    }
  }, [isPlaying])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !audioRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = Math.max(0, Math.min(duration, (clickX / rect.width) * duration))

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const handleFavoriteClick = async () => {
    if (currentSong) {
      await toggleFavorite(currentSong.id)
      // Animate heart icon
      const heartIcon = document.querySelector('.favorite-btn')
      if (heartIcon && isGSAPAvailable()) {
        animateHeart(heartIcon, {
          duration: 0.3,
          ease: "back.out(1.7)"
        })
      }
    }
  }

  const handleDirectSongSelection = (songIndex: number) => {
    if (songs && songs[songIndex]) {
      setCurrentSongIndex(songIndex)
    }
  }

  const handleDirectSongPlay = (songIndex: number) => {
    if (songs && songs[songIndex]) {
      playSong()
    }
  }


  // const handleStop = () => {
  //   if (audioRef.current) {
  //     audioRef.current.pause()
  //     audioRef.current.currentTime = 0
  //     setCurrentTime(0)
  //   }
  //   // Animate stop button
  //   const stopButton = document.querySelector('.stop-btn')
  //   if (stopButton) {
  //     anime({
  //       targets: stopButton,
  //       rotate: [0, 360],
  //       duration: 500,
  //       easing: 'easeOutExpo'
  //     })
  //   }
  // }

  // Sync playback state
  useEffect(() => {
    syncPlaybackState()
  }, [currentSongIndex, currentQueueIndex, isPlaying, currentTime, volume, repeatMode, shuffle, syncPlaybackState])

  if (!currentSong) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No song selected</p>
          <p className="text-sm">Choose a song from your library to start playing</p>
        </div>
      </div>
    )
  }

  const isFavorite = favorites.includes(currentSong.id) || apiFavorites.includes(currentSong.id)

  return (
    <div ref={playerRef} className="music-player relative p-2 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <audio ref={audioRef} className="hidden" />

      <div className="flex items-center space-x-3">
        {/* Album Art - Minimized */}
        <div className="flex-shrink-0">
          {currentSong.cover_url ? (
            <Image
              src={currentSong.cover_url}
              alt={`${currentSong.title} cover`}
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg shadow-sm"
            />
          ) : (
            <Image
              src="/default-album-art.svg"
              alt="Default album art"
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg shadow-sm"
            />
          )}
        </div>

        {/* Song Info - Minimized */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{currentSong.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
          {currentQueue && currentQueue.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {currentQueueIndex + 1} of {currentQueue.length} in queue
            </p>
          )}
        </div>

        {/* Main Controls - Minimized */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              shuffle ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Toggle Shuffle"
          >
            <Shuffle size={14} />
          </button>

          <button 
            onClick={previousSong} 
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200" 
            title="Previous Song"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={playPause}
            className="play-pause-btn p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button 
            onClick={nextSong} 
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200" 
            title="Next Song"
          >
            <SkipForward size={14} />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              repeatMode !== "off" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title={`Repeat ${repeatMode === "single" ? "One" : repeatMode === "all" ? "All" : "Off"}`}
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Volume Control - Minimized */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Volume control"
          >
            <Volume2 size={12} />
          </button>
          {showVolumeSlider && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-12 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              aria-label="Volume control"
            />
          )}
        </div>

        {/* Additional Controls - Minimized */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleFavoriteClick}
            className={`favorite-btn p-1.5 rounded-full transition-all duration-200 ${
              isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={12} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          {onQueueClick && (
          <button
              onClick={onQueueClick}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
              title="Show queue"
          >
            <List size={12} />
          </button>
          )}
          
          {/* Song Selection Button */}
          <button
            onClick={() => {
              // Show a simple song selection dialog or navigate to library
              const randomIndex = Math.floor(Math.random() * (songs?.length || 1))
              handleDirectSongSelection(randomIndex)
            }}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Random song"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
          </button>
          
          {/* Play Now Button */}
          <button
            onClick={() => {
              // Play a random song immediately
              const randomIndex = Math.floor(Math.random() * (songs?.length || 1))
              handleDirectSongPlay(randomIndex)
            }}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Play random song now"
          >
            <Play size={12} />
          </button>

        </div>
      </div>

      {/* Time Display - Above Progress Bar */}
      <div className="flex justify-between text-xs text-muted-foreground font-mono mt-3 mb-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Progress Bar - Minimized */}
      <div
        className="progress-container relative h-1 bg-muted rounded-full cursor-pointer"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Seek position"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        <div 
          ref={progressRef} 
          className="progress-bar absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

    </div>
  )
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
