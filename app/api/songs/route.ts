import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
    }

    return NextResponse.json(songs || [])
    } catch (error) {
      console.error('Error fetching songs:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}