"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useMusicStore } from "@/store/musicStore"
import { Search, X } from "lucide-react"
import Image from "next/image"

export default function SearchBar() {
  const { searchQuery, searchResults, setSearchQuery, searchSongs, playSelectedSong, songs } = useMusicStore()
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      searchSongs(query)
      setIsOpen(true)
    } else {
      setIsOpen(false)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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

      {isOpen && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.slice(0, 8).map((song, index) => (
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
          {searchResults.length > 8 && (
            <div className="p-3 text-center text-muted-foreground text-sm border-t border-border">
              +{searchResults.length - 8} more results
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery && searchResults.length === 0 && (
        <div className="search-results p-4">
          <p className="text-muted-foreground text-center text-sm">No songs found for &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  )
}
