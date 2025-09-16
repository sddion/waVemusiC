"use client"

import type React from "react"

interface FooterProps {
  className?: string
  children?: React.ReactNode
}

export default function Footer({ className = "", children }: FooterProps) {
  return (
    <footer
      className={`w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="container mx-auto px-4 py-6">
        {children || (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <p className="text-sm text-muted-foreground">© 2024 Wave Music Player. All rights reserved.</p>
          </div>
        )}
      </div>
    </footer>
  )
}
