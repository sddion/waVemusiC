import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: apiSongs, error } = await supabase
      .from('api_songs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching API songs:', error)
      return NextResponse.json({ error: 'Failed to fetch API songs' }, { status: 500 })
    }
    
    return NextResponse.json({ songs: apiSongs })
  } catch (error) {
    console.error('Error in api-songs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      external_id,
      title,
      artist,
      album,
      genre,
      year,
      duration,
      stream_url,
      cover_url,
      preview_url,
      source = 'api',
      language,
      release_date
    } = await request.json()

    if (!external_id || !title || !artist || !stream_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: external_id, title, artist, stream_url' 
      }, { status: 400 })
    }

    const supabase = createClient()
    const { data: songId, error } = await supabase.rpc('get_or_create_api_song', {
      p_external_id: external_id,
      p_title: title,
      p_artist: artist,
      p_album: album || null,
      p_genre: genre || null,
      p_year: year || null,
      p_duration: duration || 0,
      p_stream_url: stream_url,
      p_cover_url: cover_url || null,
      p_preview_url: preview_url || null,
      p_source: source,
      p_language: language || null,
      p_release_date: release_date || null
    })

    if (error) {
      console.error('Error creating API song:', error)
      return NextResponse.json({ error: 'Failed to create API song' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      songId,
      message: 'API song created successfully' 
    })
  } catch (error) {
    console.error('Error in api-songs POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
