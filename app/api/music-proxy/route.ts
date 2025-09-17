import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const endpoint = searchParams.get('endpoint')
  const songId = searchParams.get('songId')
  const limit = searchParams.get('limit')

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 })
  }

  // Handle different types of requests
  let url: string
  if (songId) {
    // Song details request
    if (endpoint.includes('/songs/')) {
      // Path parameter format: /songs/{id}
      url = `${endpoint}/${encodeURIComponent(songId)}`
    } else {
      // Query parameter format: /songs?ids={id}
      url = `${endpoint}?ids=${encodeURIComponent(songId)}`
    }
  } else if (query) {
    // Search request
    const searchParams = new URLSearchParams()
    searchParams.set('query', query)
    if (limit) {
      searchParams.set('limit', limit)
    }
    url = `${endpoint}?${searchParams.toString()}`
  } else {
    return NextResponse.json({ error: 'Missing query or songId parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (!response.ok) {
      return NextResponse.json({ error: `API endpoint failed: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: `Failed to fetch from API: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
}