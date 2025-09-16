"use client"

import { useMemo } from "react"
import { useMusicStore, type MusicSong } from "@/store/musicStore"
import { Music, Clock, Calendar, TrendingUp, User } from "lucide-react"

export default function ProfilePage() {
  const { songs } = useMusicStore()

  const stats = useMemo(() => {
    const totalDuration = songs.reduce((acc: number, song: MusicSong) => acc + (song.duration || 0), 0)
    const genres = songs.reduce(
      (acc: Record<string, number>, song: MusicSong) => {
        const genre = song.genre || "Unknown"
        acc[genre] = (acc[genre] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const artists = songs.reduce(
      (acc: Record<string, number>, song: MusicSong) => {
        acc[song.artist] = (acc[song.artist] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topGenres = Object.entries(genres)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)

    const topArtists = Object.entries(artists)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)

    return {
      totalSongs: songs.length,
      totalDuration,
      totalGenres: Object.keys(genres).length,
      totalArtists: Object.keys(artists).length,
      topGenres,
      topArtists,
    }
  }, [songs])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-background">
        <main className="container-responsive py-4 sm:py-6 lg:py-8 max-w-6xl">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Your Profile</h1>
                <p className="text-muted-foreground">Music lover since today</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Songs</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalSongs}</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Duration</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalDuration)}</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Artists</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalArtists}</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Genres</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalGenres}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Top Genres</h2>
              {stats.topGenres.length > 0 ? (
                <div className="space-y-3">
                  {stats.topGenres.map(([genre, count], index) => (
                    <div key={genre} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}</span>
                        <span className="text-foreground">{genre}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${((count as number) / stats.totalSongs) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No genres to display yet</p>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Top Artists</h2>
              {stats.topArtists.length > 0 ? (
                <div className="space-y-3">
                  {stats.topArtists.map(([artist, count], index) => (
                    <div key={artist} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}</span>
                        <span className="text-foreground truncate">{artist}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{
                              width: `${((count as number) / stats.totalSongs) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No artists to display yet</p>
              )}
            </div>
          </div>

          <div className="mt-8 bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => (window.location.href = "/upload")}
                className="p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-left transition-colors"
              >
                <h3 className="font-medium text-primary mb-1">Upload Music</h3>
                <p className="text-sm text-muted-foreground">Add new songs to your library</p>
              </button>
              <button
                onClick={() => (window.location.href = "/library")}
                className="p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-lg text-left transition-colors"
              >
                <h3 className="font-medium text-secondary mb-1">Browse Library</h3>
                <p className="text-sm text-muted-foreground">Explore your music collection</p>
              </button>
              <button
                onClick={() => (window.location.href = "/settings")}
                className="p-4 bg-muted hover:bg-muted/80 border border-border rounded-lg text-left transition-colors"
              >
                <h3 className="font-medium text-foreground mb-1">Settings</h3>
                <p className="text-sm text-muted-foreground">Customize your experience</p>
              </button>
            </div>
          </div>
        </main>
      </div>
  )
}
