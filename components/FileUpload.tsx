"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Music, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { useMusicStore } from "@/store/musicStore"
import { logger } from "@/lib/logger"

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "completed" | "error"
  title?: string
  artist?: string
  album?: string
}

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { loadSongsWithFallback } = useMusicStore()

  const uploadFiles = useCallback(async (files: UploadedFile[]) => {
    setIsUploading(true)
    const supabase = createClient()

    for (const uploadFile of files) {
      try {
        // Update progress
        setUploadedFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 25 } : f)))

        // Upload file to Supabase Storage
        const fileExt = uploadFile.file.name.split(".").pop()
        const fileName = `${Date.now()}-${uploadFile.id}.${fileExt}`

        const { data: buckets } = await supabase.storage.listBuckets()
        const musicBucket = buckets?.find((bucket) => bucket.name === "music-files")

        if (!musicBucket) {
          logger.info("Creating music-files bucket...")
          await supabase.storage.createBucket("music-files", { public: true })
        }

        const { data: fileData, error: uploadError } = await supabase.storage
          .from("music-files")
          .upload(fileName, uploadFile.file)

        if (uploadError) {
          logger.error("Upload error:", uploadError)
          throw uploadError
        }

        // Use fileData to get the uploaded file info
        if (fileData) {
          logger.info("File uploaded successfully:", fileData.path)
        }
        setUploadedFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f)))

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("music-files").getPublicUrl(fileName)

        setUploadedFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 75 } : f)))

        // Insert song record into database
        const { error: dbError } = await supabase.from("songs").insert({
          title: uploadFile.title || uploadFile.file.name,
          artist: uploadFile.artist || "Unknown Artist",
          album: uploadFile.album || "Unknown Album",
          file_url: publicUrl,
          duration: 0, // Will be updated when audio loads
        })

        if (dbError) {
          logger.error("Database error:", dbError)
          throw dbError
        }

        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 100, status: "completed" } : f)),
        )

        logger.info("Successfully uploaded:", uploadFile.title)
      } catch (error) {
        logger.error("Upload error:", error)
        setUploadedFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error" } : f)))
      }
    }

    setIsUploading(false)
    // Refresh the songs list
    await loadSongsWithFallback()
  }, [loadSongsWithFallback])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "uploading" as const,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      artist: "Unknown Artist",
      album: "Unknown Album",
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
    uploadFiles(newFiles)
  }, [uploadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".flac", ".m4a", ".ogg"],
    },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const updateFileMetadata = (id: string, field: string, value: string) => {
    setUploadedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Upload Music Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop the music files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop music files here, or click to select</p>
                <p className="text-sm text-muted-foreground">Supports MP3, WAV, FLAC, M4A, OGG formats</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Uploading files...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span className="font-medium">{uploadFile.file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {uploadFile.status === "uploading" && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(uploadFile.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {uploadFile.status === "uploading" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`title-${uploadFile.id}`}>Title</Label>
                      <Input
                        id={`title-${uploadFile.id}`}
                        value={uploadFile.title || ""}
                        onChange={(e) => updateFileMetadata(uploadFile.id, "title", e.target.value)}
                        placeholder="Song title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`artist-${uploadFile.id}`}>Artist</Label>
                      <Input
                        id={`artist-${uploadFile.id}`}
                        value={uploadFile.artist || ""}
                        onChange={(e) => updateFileMetadata(uploadFile.id, "artist", e.target.value)}
                        placeholder="Artist name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`album-${uploadFile.id}`}>Album</Label>
                      <Input
                        id={`album-${uploadFile.id}`}
                        value={uploadFile.album || ""}
                        onChange={(e) => updateFileMetadata(uploadFile.id, "album", e.target.value)}
                        placeholder="Album name"
                      />
                    </div>
                  </div>
                )}

                <Progress value={uploadFile.progress} className="w-full" />

                {uploadFile.status === "error" && (
                  <p className="text-sm text-red-500">Upload failed. Please try again.</p>
                )}
                {uploadFile.status === "completed" && (
                  <p className="text-sm text-green-500">Upload completed successfully!</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
