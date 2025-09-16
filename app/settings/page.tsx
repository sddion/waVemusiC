"use client"

import { useMusicStore } from "@/store/musicStore"
import { Volume2 } from "lucide-react"

export default function SettingsPage() {
  const { volume, setVolume } = useMusicStore()

  return (
    <div className="min-h-screen bg-background">
        <main className="container-responsive py-4 sm:py-6 lg:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Customize your music player experience</p>
          </div>

          <div className="space-y-6">
            {/* Playback Settings */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Playback</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Volume</p>
                      <p className="text-sm text-muted-foreground">Default playback volume</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                      className="range-slider w-24"
                    />
                    <span className="text-sm text-muted-foreground w-10 text-center font-mono">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Controls Info */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Player Controls</h2>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  • <span className="font-medium text-foreground">Shuffle & Repeat:</span> Use the controls in the music player at the bottom of the screen
                </p>
                <p className="text-sm text-muted-foreground">
                  • <span className="font-medium text-foreground">Theme:</span> Toggle between light and dark mode using the sun/moon icon in the header
                </p>
                <p className="text-sm text-muted-foreground">
                  • <span className="font-medium text-foreground">Playback:</span> All playback controls are available in the music player
                </p>
              </div>
            </div>

            {/* About */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Wave Music Player</span> v1.0.0
                </p>
                <p className="text-sm text-muted-foreground">
                  A modern, responsive music player with cloud storage and real-time sync.
                </p>
                <p className="text-sm text-muted-foreground">Built with Next.js, React, and Tailwind CSS.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
  )
}
