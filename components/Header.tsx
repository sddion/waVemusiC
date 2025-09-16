"use client"

import type React from "react"

interface HeaderProps {
  title?: string
  className?: string
  children?: React.ReactNode
}

export default function Header({ title, className = "", children }: HeaderProps) {
  return (
    <header className={`w-full ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {title && <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>}
        {children}
      </div>
    </header>
  )
}
