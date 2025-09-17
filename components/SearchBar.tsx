"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useMusicStore } from "@/store/musicStore"
import { Search, X, Play, PlusCircle } from "lucide-react"
import Image from "next/image"
import { type StreamableSong } from "@/lib/music-api"

export default function SearchBar() {
  const { 
    searchQuery, 
    searchResults, 
    setSearchQuery, 
    searchSongs, 
    searchApiSongs,
    playSelectedSong, 
    playApiSong,
    addToQueue,
    songs,
    isLoading 
  } = useMusicStore()
  const [isOpen, setIsOpen] = useState(false)
  const [apiResults, setApiResults] = useState<StreamableSong[]>([])
  const [showApiResults, setShowApiResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    if (query.trim()) {
      // Search local songs immediately
      searchSongs(query)
      setIsOpen(true)
      
      // Debounce API search to reduce excessive calls
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const apiSongs = await searchApiSongs(query)
          setApiResults(apiSongs)
          setShowApiResults(apiSongs.length > 0)
        } catch (error) {
          console.error('Error searching API songs:', error)
          setApiResults([])
          setShowApiResults(false)
        }
      }, 500) // 500ms debounce
    } else {
      setIsOpen(false)
      setApiResults([])
      setShowApiResults(false)
    }
  }

  const handleResultClick = (songIndex: number) => {
    // Find the actual index in the main songs array
    const selectedSong = searchResults[songIndex]
    const actualIndex = songs.findIndex((song) => song.id === selectedSong.id)
    if (actualIndex !== -1) {
      playSelectedSong(actualIndex)
    }
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleApiResultClick = (song: StreamableSong) => {
    playApiSong(song)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleAddApiSongToQueue = (e: React.MouseEvent, song: StreamableSong) => {
    e.stopPropagation()
    // Convert StreamableSong to MusicSong format and add to queue
    const musicSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      duration: song.duration,
      cover_url: song.cover_url,
      file_url: song.stream_url,
      source: 'api' as const,
      stream_url: song.stream_url,
      preview_url: song.preview_url,
      genre: song.genre,
      year: song.release_date ? parseInt(song.release_date) : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    addToQueue(musicSong)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      // Cleanup debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <div ref={searchRef} className="search-container">
      <div className="relative">
        <Search className="search-icon w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for songs, artists, or albums..."
          className="search-input text-sm sm:text-base"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("")
              setIsOpen(false)
            }}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (searchResults.length > 0 || showApiResults) && (
        <div className="search-results">
          {/* Local Songs */}
          {searchResults.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                Your Library ({searchResults.length})
              </div>
              {searchResults.slice(0, 5).map((song, index) => (
                <div key={song.id} onClick={() => handleResultClick(index)} className="search-result-item">
                  <div className="flex-shrink-0">
                    {song.cover_url ? (
                      <Image
                        src={song.cover_url || "/placeholder.svg"}
                        alt={song.title}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate text-sm sm:text-base">{song.title}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">{song.artist}</p>
                    {song.album && <p className="text-muted-foreground/70 text-xs truncate">{song.album}</p>}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* API Songs */}
          {showApiResults && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                Online Music ({apiResults.length})
              </div>
              {apiResults.slice(0, 8).map((song) => (
                <div key={song.id} onClick={() => handleApiResultClick(song)} className="search-result-item group">
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
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate text-sm sm:text-base">{song.title}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">{song.artist}</p>
                    {song.album && <p className="text-muted-foreground/70 text-xs truncate">{song.album}</p>}
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleAddApiSongToQueue(e, song)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                      title="Add to queue"
                    >
                      <PlusCircle size={14} />
                    </button>
                    <button
                      onClick={() => handleApiResultClick(song)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                      title="Play now"
                    >
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="p-3 text-center text-muted-foreground text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
              Searching online...
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery && searchResults.length === 0 && !showApiResults && !isLoading && (
        <div className="search-results p-4">
          <p className="text-muted-foreground text-center text-sm">No songs found for &quot;{searchQuery}&quot;</p>
          <p className="text-muted-foreground text-center text-xs mt-1">Try searching for any song online</p>
        </div>
      )}
    </div>
  )
}
