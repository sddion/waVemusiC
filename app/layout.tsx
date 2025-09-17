
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import "./globals.css"
import Layout from "@/components/Layout"
import ErrorBoundary from "@/components/ErrorBoundary"
import ReduxProvider from "@/components/ReduxProvider"

export const metadata: Metadata = {
  title: "Wave Music Player",
  description: "A modern, responsive music player with cloud storage and real-time sync",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ReduxProvider>
          <ErrorBoundary>
            <Suspense fallback={null}>
              <Layout>
                {children}
              </Layout>
            </Suspense>
          </ErrorBoundary>
        </ReduxProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
      </body>
    </html>
  )
}
