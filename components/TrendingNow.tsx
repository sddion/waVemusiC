"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useMusicStore } from '@/store/musicStore'
import { Play, TrendingUp, Clock, Music } from 'lucide-react'
import Image from 'next/image'

interface TrendingSong {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  file_url: string
  cover_url?: string
  genre?: string
  year?: number
  play_count: number
  last_played?: string
  created_at: string
  trending_play_count: number
  trending_ranking: number
  trending_date: string
}

interface TrendingNowProps {
  limit?: number
  showRanking?: boolean
  className?: string
}

export default function TrendingNow({ 
  limit = 10, 
  showRanking = true, 
  className = "" 
}: TrendingNowProps) {
  const [trendingSongs, setTrendingSongs] = useState<TrendingSong[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { playSelectedSong, songs } = useMusicStore()

  const fetchTrendingSongs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/trending?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trending songs')
      }
      
      const data = await response.json()
      setTrendingSongs(data.songs || [])
    } catch (err) {
      console.error('Error fetching trending songs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trending songs')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchTrendingSongs()
  }, [fetchTrendingSongs])

  const handlePlaySong = (trendingSong: TrendingSong) => {
    // Find the song in the main songs array by ID
    const songIndex = songs.findIndex(song => song.id === trendingSong.id)
    if (songIndex !== -1) {
      playSelectedSong(songIndex)
    } else {
      // If song is not in main array, we could add it or show an error
      console.warn('Song not found in main library:', trendingSong.title)
    }
  }

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatPlayCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  if (isLoading) {
    return (
      <div className={`trending-now ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-muted-foreground/30 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="w-12 h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`trending-now ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-destructive text-sm">{error}</p>
          <button 
            onClick={fetchTrendingSongs}
            className="mt-2 text-xs text-destructive hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (trendingSongs.length === 0) {
    return (
      <div className={`trending-now ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <div className="p-6 text-center rounded-lg bg-muted/50">
          <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No trending songs yet</p>
          <p className="text-muted-foreground text-xs mt-1">Start playing songs to see what&apos;s trending!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`trending-now ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Updated daily</span>
        </div>
      </div>

      <div className="space-y-2">
        {trendingSongs.map((song) => (
          <div
            key={song.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
            onClick={() => handlePlaySong(song)}
          >
            {/* Ranking */}
            {showRanking && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {song.trending_ranking}
                </span>
              </div>
            )}

            {/* Album Art */}
            <div className="flex-shrink-0 relative">
              {song.cover_url ? (
                <Image
                  src={song.cover_url}
                  alt={`${song.title} cover`}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{song.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              {song.album && (
                <p className="text-xs text-muted-foreground/70 truncate">{song.album}</p>
              )}
            </div>

            {/* Play Count & Duration */}
            <div className="flex-shrink-0 text-right">
              <div className="text-xs font-medium text-primary">
                {formatPlayCount(song.trending_play_count)} plays
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDuration(song.duration)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 pt-3 border-t border-border">
        <button
          onClick={fetchTrendingSongs}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh trending songs
        </button>
      </div>
    </div>
  )
}
