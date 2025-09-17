import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

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
    const formattedTrendingSongs = trendingSongs?.map((trending: any) => ({
      id: trending.songs.id,
      title: trending.songs.title,
      artist: trending.songs.artist,
      album: trending.songs.album,
      duration: trending.songs.duration,
      file_url: trending.songs.file_url,
      cover_url: trending.songs.cover_image_url,
      genre: trending.songs.genre,
      year: trending.songs.year,
      play_count: trending.songs.play_count,
      last_played: trending.songs.last_played,
      created_at: trending.songs.created_at,
      trending_play_count: trending.play_count,
      trending_ranking: trending.ranking,
      trending_date: trending.date
    })) || []

    return NextResponse.json({
      songs: formattedTrendingSongs,
      date,
      total: formattedTrendingSongs.length
    })

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
