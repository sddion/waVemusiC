"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import { useMusicStore, type MusicSong } from "@/store/musicStore"
import { usePersistentPlayback } from "@/hooks/usePersistentPlayback"
import { usePlaylists } from "@/hooks/usePlaylists"
import Image from "next/image"
import { Play, Pause, Music, Heart, Plus, X, List, Shuffle, Repeat } from "lucide-react"
import SpotlightCard from "@/components/SpotlightCard"
import Recommendations from "@/components/Recommendations"
import RecentlyPlayed from "@/components/RecentlyPlayed"
import FavoritesTiles from "@/components/FavoritesTiles"

// Lazy-loaded Song Tile Component
const SongTile = lazy(() => Promise.resolve({
  default: ({ song, index, isPlaying, currentSongIndex, favorites, onSongClick, onFavoriteClick }: {
    song: MusicSong
    index: number
    isPlaying: boolean
    currentSongIndex: number
    favorites: string[]
    onSongClick: (index: number) => void
    onFavoriteClick: (e: React.MouseEvent, songId: string) => void
  }) => (
    <div
      className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-3 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer group"
      onClick={() => onSongClick(index)}
    >
      {/* Mobile: Horizontal Rectangle Layout */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted">
            {song.cover_url ? (
              <Image
                src={song.cover_url}
                alt={song.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 48px, 64px"
              />
            ) : (
              <Image
                src="/default-album-art.svg"
                alt="Default album art"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 48px, 64px"
              />
            )}
          </div>
          
          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center rounded-lg">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {index === currentSongIndex && isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
              )}
            </div>
          </div>

          {/* Active Indicator */}
          {index === currentSongIndex && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
            {song.title}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm truncate">
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
              favorites.includes(song.id) ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart size={14} fill={favorites.includes(song.id) ? "currentColor" : "none"} />
          </button>
          <span className="text-xs text-muted-foreground font-mono hidden sm:block">
            {formatTime(song.duration || 0)}
          </span>
        </div>
      </div>
    </div>
  )
}))

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function HomePage() {
  const { 
    songs, 
    currentSongIndex, 
    isPlaying, 
    playPause, 
    toggleFavorite, 
    favorites,
    loadSongsWithFallback, 
    isLoading, 
    error 
  } = useMusicStore()
  
  // Use persistent playback hook to prevent song restarting
  const { playSelectedSong } = usePersistentPlayback()
  
  // Use actual playlist logic
  const { playlists, isLoading: playlistsLoading, createPlaylist } = usePlaylists()
  
  // Ensure songs is always an array
  const safeSongs = songs || []
  
  // State for playlist management
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")

  useEffect(() => {
    loadSongsWithFallback()
  }, [loadSongsWithFallback])

  // Playlists are now generated dynamically from actual data

  const handleSongClick = (index: number) => {
    if (index === currentSongIndex) {
      playPause()
    } else {
      playSelectedSong(index)
    }
  }

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylist(selectedPlaylist === playlistId ? null : playlistId)
  }

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim())
      setNewPlaylistName("")
      setShowCreatePlaylist(false)
    }
  }

  const handleFavoriteClick = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation()
    await toggleFavorite(songId)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container-responsive py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Welcome to Wave Music
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover, play, and organize your favorite music with our modern streaming experience
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{safeSongs.length}</div>
              <div className="text-sm text-muted-foreground">Songs</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{playlists.length}</div>
              <div className="text-sm text-muted-foreground">Playlists</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 text-center">
              <div className="text-2xl font-bold text-accent">{favorites.length}</div>
              <div className="text-sm text-muted-foreground">Favorites</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 text-center">
              <div className="text-2xl font-bold text-chart-4">
                {Math.floor(safeSongs.reduce((acc, song) => acc + (song.duration || 0), 0) / 3600)}h
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
          </div>
        </div>

              {/* Personalized Recommendations */}
              <div className="mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Made for You</h2>
                  <p className="text-muted-foreground">Personalized recommendations based on your listening habits</p>
                </div>
                <Recommendations />
              </div>

              {/* Recently Played */}
              <div className="mb-8">
                <RecentlyPlayed onSongClick={handleSongClick} onFavoriteClick={handleFavoriteClick} />
              </div>

              {/* Favorites */}
              <div className="mb-8">
                <FavoritesTiles onSongClick={handleSongClick} onFavoriteClick={handleFavoriteClick} />
              </div>

        {/* Playlists Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Playlists</h2>
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Playlist</span>
            </button>
          </div>

          {/* Create Playlist Modal */}
          {showCreatePlaylist && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Create New Playlist</h3>
                  <button
                    onClick={() => setShowCreatePlaylist(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground mb-4"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreatePlaylist}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreatePlaylist(false)}
                    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {playlistsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <List className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No playlists yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first playlist to organize your music
              </p>
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {playlists.map((playlist) => (
              <div key={playlist.id}>
                <SpotlightCard 
                  className="cursor-pointer"
                  spotlightColor={playlist.color}
                  onClick={() => handlePlaylistClick(playlist.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Image
                        src="/default-album-art.svg"
                        alt={playlist.name}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {playlist.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.songCount} {playlist.songCount === 1 ? "song" : "songs"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </SpotlightCard>

                {/* Playlist Songs */}
                {selectedPlaylist === playlist.id && (
                  <div className="mt-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                      <h4 className="font-semibold text-foreground">{playlist.name} Songs</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {playlist.songs.map((song: MusicSong, index: number) => (
                        <div
                          key={song.id}
                          className="flex items-center space-x-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleSongClick(index)}
                        >
                          <div className="flex-shrink-0">
                            {song.cover_url ? (
                              <Image
                                src={song.cover_url}
                                alt={song.title}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <Image
                                src="/default-album-art.svg"
                                alt="Default album art"
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleFavoriteClick(e, song.id)}
                              className={`p-1 rounded-full transition-colors ${
                                favorites.includes(song.id) ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Heart size={14} fill={favorites.includes(song.id) ? "currentColor" : "none"} />
                            </button>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatTime(song.duration || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
