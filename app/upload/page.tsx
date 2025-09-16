"use client"

import { lazy, Suspense } from "react"

// Lazy load the FileUpload component
const FileUpload = lazy(() => import("@/components/FileUpload"))

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background">
        <main className="container-responsive py-4 sm:py-6 lg:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Upload Music</h1>
            <p className="text-muted-foreground">
              Add new songs to your library. Supports MP3, FLAC, OGG, and WAV formats.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <FileUpload />
            </Suspense>
          </div>

          <div className="mt-8 bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Supported Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-foreground">Automatic Metadata</h3>
                  <p className="text-sm text-muted-foreground">
                    Song title, artist, album, and genre are extracted automatically
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-foreground">Album Artwork</h3>
                  <p className="text-sm text-muted-foreground">
                    Cover images are extracted from ID3 tags when available
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-foreground">Duplicate Detection</h3>
                  <p className="text-sm text-muted-foreground">Prevents uploading the same song multiple times</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-foreground">Multiple Formats</h3>
                  <p className="text-sm text-muted-foreground">MP3, FLAC, OGG, and WAV files are supported</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  )
}
