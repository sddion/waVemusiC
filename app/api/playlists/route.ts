import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
    }

    return NextResponse.json(playlists || [])
    } catch (error) {
      console.error('Error managing playlists:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}