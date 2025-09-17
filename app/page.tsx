"use client"

import { useEffect, useState } from "react"
import { useMusicStore, type MusicSong } from "@/store/musicStore"
import { usePersistentPlayback } from "@/hooks/usePersistentPlayback"
import { usePlaylists } from "@/hooks/usePlaylists"
import Image from "next/image"
import { Play, Heart, Plus, X, List, Shuffle, Repeat, PlusCircle } from "lucide-react"
import SpotlightCard from "@/components/SpotlightCard"
import Recommendations from "@/components/Recommendations"


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
    shuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    addToQueue
  } = useMusicStore()
  
  // Use persistent playback hook to prevent song restarting
  const { playSelectedSong } = usePersistentPlayback()
  
  // Use actual playlist logic
  const { playlists = [], isLoading: playlistsLoading = false, createPlaylist } = usePlaylists()
  
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
    if (newPlaylistName.trim() && createPlaylist) {
      createPlaylist(newPlaylistName.trim())
      setNewPlaylistName("")
      setShowCreatePlaylist(false)
    }
  }

  const handleFavoriteClick = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation()
    await toggleFavorite(songId)
  }

  const handleAddToQueue = (e: React.MouseEvent, song: MusicSong) => {
    e.stopPropagation()
    addToQueue(song)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container-responsive py-4 sm:py-6 lg:py-8 max-w-6xl">

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
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Recently Played</h3>
                  </div>
                  
                  {safeSongs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {safeSongs.slice(0, 6).map((song: MusicSong, index: number) => {
                        const isCurrentlyPlaying = currentSongIndex === index && isPlaying
                        
                        return (
                          <div
                            key={song.id}
                            className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer group"
                            onClick={() => handleSongClick(index)}
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
                                  onClick={(e) => handleAddToQueue(e, song)}
                                  className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                  title="Add to queue"
                                >
                                  <PlusCircle size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleFavoriteClick(e, song.id)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    favorites.includes(song.id)
                                      ? "text-red-500"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Heart size={14} fill={favorites.includes(song.id) ? "currentColor" : "none"} />
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
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <p className="text-muted-foreground">No songs available</p>
                      <p className="text-sm text-muted-foreground">Upload some music to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorites */}
              <div className="mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Your Favorites</h3>
                    <span className="text-sm text-muted-foreground">({favorites.length} songs)</span>
                  </div>
                  
                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {safeSongs
                        .filter(song => favorites.includes(song.id))
                        .slice(0, 6)
                        .map((song: MusicSong) => {
                          const originalIndex = safeSongs.findIndex(s => s.id === song.id)
                          const isCurrentlyPlaying = currentSongIndex === originalIndex && isPlaying
                          
                          return (
                            <div
                              key={song.id}
                              className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer group"
                              onClick={() => handleSongClick(originalIndex)}
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
                                    onClick={(e) => handleAddToQueue(e, song)}
                                    className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                    title="Add to queue"
                                  >
                                    <PlusCircle size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => handleFavoriteClick(e, song.id)}
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
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No favorite songs yet</p>
                      <p className="text-sm text-muted-foreground">Heart songs you love to see them here</p>
                    </div>
                  )}
                </div>
              </div>

        {/* Playlists Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Playlists</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${
                  shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`} 
                title={`Shuffle ${shuffle ? "On" : "Off"}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleRepeat}
                className={`p-2 transition-colors ${
                  repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`} 
                title={`Repeat ${repeatMode === "single" ? "One" : repeatMode === "all" ? "All" : "Off"}`}
              >
                <Repeat className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Playlist</span>
              </button>
            </div>
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
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
                              onClick={(e) => handleAddToQueue(e, song)}
                              className="p-1 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                              title="Add to queue"
                            >
                              <PlusCircle size={12} />
                            </button>
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
