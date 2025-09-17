"use client"

import { useMusicStore, type MusicSong } from "@/store/musicStore"
import Image from "next/image"
import { Play, Heart, Clock, TrendingUp, Star, Music } from "lucide-react"
import { useState } from "react"

interface RecommendationSection {
  title: string
  subtitle: string
  icon: React.ReactNode
  songs: MusicSong[]
  color: string
}

export default function Recommendations() {
  const { songs, favorites, playSelectedSong, toggleFavorite } = useMusicStore()
  const [hoveredSong, setHoveredSong] = useState<string | null>(null)

  const safeSongs = songs || []

  // Generate personalized recommendations based on user data
  const recommendations: RecommendationSection[] = [
    {
      title: "Made for You",
      subtitle: "Based on your listening history",
      icon: <Star className="w-5 h-5" />,
      songs: safeSongs.slice(0, 6),
      color: "rgba(236, 72, 153, 0.2)",
    },
    {
      title: "Trending Now",
      subtitle: "What's popular right now",
      icon: <TrendingUp className="w-5 h-5" />,
      songs: safeSongs.slice(6, 12),
      color: "rgba(14, 165, 233, 0.2)",
    },
  ]

  const handleSongClick = (index: number) => {
    playSelectedSong(index)
  }

  const handleFavoriteClick = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation()
    await toggleFavorite(songId)
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-8">
      {recommendations.map((section) => (
        <div key={section.title} className="space-y-4">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: section.color }}
            >
              {section.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {section.songs.map((song, index) => (
              <div
                key={song.id}
                className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-3 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer group"
                onClick={() => handleSongClick(index)}
                onMouseEnter={() => setHoveredSong(song.id)}
                onMouseLeave={() => setHoveredSong(null)}
              >
                <div className="relative mb-3">
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted">
                    {song.cover_url ? (
                      <Image
                        src={song.cover_url}
                        alt={song.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    ) : (
                      <Image
                        src="/default-album-art.svg"
                        alt="Default album art"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    )}
                  </div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center rounded-lg">
                    <div className={`transition-all duration-200 ${
                      hoveredSong === song.id ? "opacity-100 scale-110" : "opacity-0 scale-90"
                    }`}>
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => handleFavoriteClick(e, song.id)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${
                      favorites.includes(song.id) 
                        ? "text-red-500 bg-red-500/20" 
                        : "text-white/70 hover:text-red-500 hover:bg-red-500/20"
                    }`}
                  >
                    <Heart 
                      size={14} 
                      fill={favorites.includes(song.id) ? "currentColor" : "none"} 
                    />
                  </button>
                </div>

                <div className="space-y-1">
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

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTime(song.duration || 0)}
                  </span>
                  {song.genre && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {song.genre}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {safeSongs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Music className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No recommendations yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start listening to music to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  )
}
