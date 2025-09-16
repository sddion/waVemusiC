import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: favorites, error } = await supabase
      .from('public_favorites')
      .select('*')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json(favorites || [])
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
