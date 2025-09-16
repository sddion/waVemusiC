"use client"

import { useMusicStore, type MusicSong } from '@/store/musicStore'
import Image from 'next/image'
import { Play, Heart } from 'lucide-react'
import { useState } from 'react'

interface FavoritesTilesProps {
  onSongClick: (index: number) => void
  onFavoriteClick: (e: React.MouseEvent, songId: string) => void
}

export default function FavoritesTiles({ onSongClick, onFavoriteClick }: FavoritesTilesProps) {
  const { songs, currentSongIndex, isPlaying, favorites } = useMusicStore()
  const [, setHoveredSong] = useState<string | null>(null)

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get favorite songs
  const favoriteSongs = songs?.filter(song => favorites.includes(song.id)) || []

  if (favoriteSongs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Your Favorites</h3>
        </div>
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No favorite songs yet</p>
          <p className="text-sm text-muted-foreground">Heart songs you love to see them here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Your Favorites</h3>
        <span className="text-sm text-muted-foreground">({favoriteSongs.length} songs)</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favoriteSongs.slice(0, 6).map((song: MusicSong) => {
          // Find the original index in the main songs array
          const originalIndex = songs?.findIndex(s => s.id === song.id) ?? -1
          const isCurrentlyPlaying = currentSongIndex === originalIndex && isPlaying
          
          return (
            <div
              key={song.id}
              className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer group"
              onClick={() => onSongClick(originalIndex)}
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
                  
                  {/* Favorite indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <Heart className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
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
                    className="p-1.5 rounded-full transition-colors text-red-500 hover:bg-red-500/10"
                  >
                    <Heart className="w-3 h-3 fill-current" />
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
