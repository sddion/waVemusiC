"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useMusicStore, type MusicSong } from "@/store/musicStore"
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store'
import { setLastPlayedInfo } from '@/store/audioStore'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart, List } from "lucide-react"
import { getAnime } from "@/lib/anime"
import Image from "next/image"

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [showQueue, setShowQueue] = useState(false)
  const dispatch = useDispatch<AppDispatch>()

  const {
    songs,
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
    removeFromQueue,
    clearQueue,
    setCurrentQueueIndex,
    setCurrentSongIndex,
    playSong,
  } = useMusicStore()

  const currentSong = songs && songs.length > 0 ? songs[currentSongIndex] : null

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
          index: currentSongIndex
        }))
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
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
  }, [isPlaying, setCurrentTime, setDuration, repeatMode, nextSong, currentSong, currentSongIndex, dispatch])

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
  }, [currentSongIndex, currentSong, isPlaying])

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  // Initialize anime.js animations
  useEffect(() => {
    if (playerRef.current) {
      const anime = getAnime()
      if (anime) {
        anime({
          targets: playerRef.current,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 800,
          easing: 'easeOutExpo'
        })
      }
    }
  }, [])

  // Animate progress bar
  useEffect(() => {
    if (progressRef.current && duration > 0) {
      const anime = getAnime()
      if (anime) {
        const progressPercent = (currentTime / duration) * 100
        anime({
          targets: progressRef.current,
          width: `${Math.min(100, Math.max(0, progressPercent))}%`,
          duration: 100,
          easing: 'easeOutQuad'
        })
      }
    }
  }, [currentTime, duration])

  // Animate play/pause button
  useEffect(() => {
    const playButton = document.querySelector('.play-pause-btn')
    if (playButton) {
      const anime = getAnime()
      if (anime) {
        anime({
          targets: playButton,
          scale: isPlaying ? [1, 1.1, 1] : [1, 0.9, 1],
          duration: 200,
          easing: 'easeOutQuad'
        })
      }
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
      if (heartIcon) {
        const anime = getAnime()
        if (anime) {
          anime({
            targets: heartIcon,
            scale: [1, 1.3, 1],
            duration: 300,
            easing: 'easeOutElastic(1, .8)'
          })
        }
      }
    }
  }

  const handleQueueToggle = () => {
    setShowQueue(!showQueue)
    // Animate queue panel
    const queuePanel = document.querySelector('.queue-panel')
    if (queuePanel) {
      const anime = getAnime()
      if (anime) {
        anime({
          targets: queuePanel,
          opacity: showQueue ? [1, 0] : [0, 1],
          translateX: showQueue ? [0, 20] : [20, 0],
          duration: 300,
          easing: 'easeOutQuad'
        })
      }
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
  }, [currentSongIndex, isPlaying, currentTime, volume, repeatMode, shuffle, syncPlaybackState])

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

  const isFavorite = favorites.includes(currentSong.id)

  return (
    <div ref={playerRef} className="music-player relative p-3 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
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
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
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
          <Volume2 size={12} className="text-muted-foreground" />
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
        </div>

        {/* Additional Controls - Minimized */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={12} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <button
            onClick={handleQueueToggle}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Show Queue"
          >
            <List size={12} />
          </button>
        </div>
      </div>

      {/* Progress Bar - Minimized */}
      <div
        className="progress-container relative h-0.5 bg-muted rounded-full cursor-pointer mt-2"
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
          style={{ width: "0%" }}
        />
      </div>

      {/* Time Display - Minimized */}
      <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Queue Panel - Positioned Above */}
      {showQueue && (
        <div className="queue-panel absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Queue ({currentQueue.length})</h3>
            <button
              onClick={clearQueue}
              className="text-sm text-destructive hover:text-destructive/80"
            >
              Clear
            </button>
          </div>
                  {!currentQueue || currentQueue.length === 0 ? (
            <p className="text-muted-foreground text-sm">Queue is empty</p>
                  ) : (
                    <div className="space-y-2">
                      {currentQueue.map((song: MusicSong, index: number) => (
                <div
                  key={song.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    index === currentQueueIndex ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                          onClick={() => {
                            setCurrentQueueIndex(index)
                            setCurrentSongIndex(index)
                            playSong()
                          }}
                >
                  <div className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs font-mono">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromQueue(index)
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
