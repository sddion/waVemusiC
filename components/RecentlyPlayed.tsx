"use client"

import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useMusicStore, type MusicSong } from '@/store/musicStore'
import Image from 'next/image'
import { Play, Clock, Music } from 'lucide-react'
import { useState } from 'react'

interface RecentlyPlayedProps {
  onSongClick: (index: number) => void
  onFavoriteClick: (e: React.MouseEvent, songId: string) => void
}

export default function RecentlyPlayed({ onSongClick, onFavoriteClick }: RecentlyPlayedProps) {
  const recentlyPlayed = useSelector((state: RootState) => state.audio.recentlyPlayed)
  const { currentSongIndex, isPlaying, favorites } = useMusicStore()
  const [, setHoveredSong] = useState<string | null>(null)

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (recentlyPlayed.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Recently Played</h3>
        </div>
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No recently played songs yet</p>
          <p className="text-sm text-muted-foreground">Start playing some music to see your history here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Recently Played</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentlyPlayed.slice(0, 6).map((song: MusicSong, index: number) => {
          const isCurrentlyPlaying = currentSongIndex === index && isPlaying
          
          return (
            <div
              key={song.id}
              className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer group"
              onClick={() => onSongClick(index)}
              onMouseEnter={() => setHoveredSong(song.id)}
              onMouseLeave={() => setHoveredSong(null)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    {song.cover_url ? (
                      <Image
                        src={song.cover_url}
                        alt={song.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="48px"
                      />
                    ) : (
                      <Image
                        src="/default-album-art.svg"
                        alt="Default album art"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="48px"
                      />
                    )}
                  </div>
                  
                  {/* Play/Pause overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center rounded-lg">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {isCurrentlyPlaying ? (
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </div>
                  </div>
                  
                  {/* Currently playing indicator */}
                  {isCurrentlyPlaying && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate text-sm">
                    {song.title}
                  </h4>
                  <p className="text-muted-foreground text-xs truncate">
                    {song.artist}
                  </p>
                  {song.album && (
                    <p className="text-muted-foreground text-xs truncate">
                      {song.album}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => onFavoriteClick(e, song.id)}
                    className={`p-1.5 rounded-full transition-colors ${
                      favorites.includes(song.id)
                        ? "text-red-500"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill={favorites.includes(song.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTime(song.duration || 0)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
