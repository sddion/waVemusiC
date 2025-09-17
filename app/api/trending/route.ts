import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// TypeScript interfaces for trending songs API response
interface TrendingSongData {
  id: string
  song_id: string
  play_count: number
  ranking: number
  date: string
  songs: {
    id: string
    title: string
    artist: string
    album: string | null
    duration: number
    file_url: string
    cover_image_url: string | null
    genre: string | null
    year: number | null
    play_count: number
    last_played: string | null
    created_at: string
  }[] | null
}

interface FormattedTrendingSong {
  id: string
  title: string
  artist: string
  album: string | null
  duration: number
  file_url: string
  cover_url: string | null
  genre: string | null
  year: number | null
  play_count: number
  last_played: string | null
  created_at: string
  trending_play_count: number
  trending_ranking: number
  trending_date: string
}

interface TrendingResponse {
  songs: FormattedTrendingSong[]
  date: string
  total: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get trending songs for the specified date
    const { data: trendingSongs, error: trendingError } = await supabase
      .from('trending_songs')
      .select(`
        id,
        song_id,
        play_count,
        ranking,
        date,
        songs!inner (
          id,
          title,
          artist,
          album,
          duration,
          file_url,
          cover_image_url,
          genre,
          year,
          play_count,
          last_played,
          created_at
        )
      `)
      .eq('date', date)
      .order('ranking', { ascending: true })
      .limit(limit)

    if (trendingError) {
      console.error('Error fetching trending songs:', trendingError)
      return NextResponse.json({ error: 'Failed to fetch trending songs' }, { status: 500 })
    }

    // Transform the data to include song details
    const formattedTrendingSongs: FormattedTrendingSong[] = trendingSongs
      ?.filter((trending: TrendingSongData) => trending.songs !== null && trending.songs.length > 0)
      ?.map((trending: TrendingSongData) => {
        const song = trending.songs![0] // Get the first (and only) song from the array
        return {
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          file_url: song.file_url,
          cover_url: song.cover_image_url,
          genre: song.genre,
          year: song.year,
          play_count: song.play_count,
          last_played: song.last_played,
          created_at: song.created_at,
          trending_play_count: trending.play_count,
          trending_ranking: trending.ranking,
          trending_date: trending.date
        }
      }) || []

    const response: TrendingResponse = {
      songs: formattedTrendingSongs,
      date,
      total: formattedTrendingSongs.length
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in trending API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint to manually update trending songs (for cron job)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { date } = await request.json().catch(() => ({ date: new Date().toISOString().split('T')[0] }))

    // Call the database function to update trending songs
    const { error } = await supabase.rpc('update_trending_songs', { target_date: date })

    if (error) {
      console.error('Error updating trending songs:', error)
      return NextResponse.json({ error: 'Failed to update trending songs' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Trending songs updated successfully',
      date 
    })

  } catch (error) {
    console.error('Error in trending update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
