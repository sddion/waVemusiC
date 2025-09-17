import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job (you can add authentication here)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Call the database function to update trending songs for today
    const { error } = await supabase.rpc('update_trending_songs', { target_date: today })

    if (error) {
      console.error('Error updating trending songs:', error)
      return NextResponse.json({ error: 'Failed to update trending songs' }, { status: 500 })
    }

    // Get the updated trending songs count
    const { count } = await supabase
      .from('trending_songs')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    return NextResponse.json({ 
      success: true, 
      message: 'Trending songs updated successfully',
      date: today,
      trendingSongsCount: count || 0
    })

  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    message: 'Trending songs cron job endpoint is running',
    timezone: 'GMT+5:30',
    schedule: 'Daily at 12:00 AM'
  })
}
