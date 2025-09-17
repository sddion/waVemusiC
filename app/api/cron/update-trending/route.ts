import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Force dynamic execution to prevent caching issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Debug: Log all headers to understand what Vercel sends
    console.log('Cron request headers:', Object.fromEntries(request.headers.entries()))
    
    // Vercel cron jobs send the secret in the Authorization header
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    console.log('Auth header present:', !!authHeader)
    console.log('Cron secret configured:', !!cronSecret)
    
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
    }
    
    // Check for Vercel cron authentication
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request:', { 
        authHeader: authHeader ? 'present' : 'missing',
        expected: `Bearer ${cronSecret}`,
        received: authHeader
      })
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

// POST endpoint for manual testing (not used by Vercel cron)
export async function POST(request: NextRequest) {
  try {
    // For manual testing, we can use a different auth method
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'test-secret-key'
    
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
      message: 'Trending songs updated successfully (manual trigger)',
      date: today,
      trendingSongsCount: count || 0
    })

  } catch (error) {
    console.error('Error in manual cron trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
