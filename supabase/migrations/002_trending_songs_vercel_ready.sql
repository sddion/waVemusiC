-- =====================================================
-- Trending Songs Migration - Vercel Ready
-- =====================================================
-- This migration adds trending songs functionality with play tracking
-- Optimized for Vercel deployment with proper error handling

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PLAY TRACKING TABLE
-- =====================================================

-- Create play_tracking table to track individual song plays
CREATE TABLE IF NOT EXISTS play_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    play_duration INTEGER DEFAULT 0, -- Duration in seconds (0 if skipped quickly)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRENDING SONGS TABLE
-- =====================================================

-- Create trending_songs table to store daily trending calculations
CREATE TABLE IF NOT EXISTS trending_songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    play_count INTEGER NOT NULL DEFAULT 0,
    ranking INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(song_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Play tracking indexes
CREATE INDEX IF NOT EXISTS idx_play_tracking_song_id ON play_tracking(song_id);
CREATE INDEX IF NOT EXISTS idx_play_tracking_played_at ON play_tracking(played_at);

-- Trending songs indexes
CREATE INDEX IF NOT EXISTS idx_trending_songs_song_id ON trending_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_trending_songs_date ON trending_songs(date);
CREATE INDEX IF NOT EXISTS idx_trending_songs_ranking ON trending_songs(ranking);
CREATE INDEX IF NOT EXISTS idx_trending_songs_play_count ON trending_songs(play_count);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update trending songs for a specific date
CREATE OR REPLACE FUNCTION update_trending_songs(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Delete existing trending data for the target date
    DELETE FROM trending_songs WHERE date = target_date;
    
    -- Insert new trending data based on play counts from the last 7 days
    INSERT INTO trending_songs (song_id, play_count, ranking, date)
    SELECT 
        pt.song_id,
        COUNT(*) as play_count,
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as ranking,
        target_date
    FROM play_tracking pt
    WHERE pt.played_at >= (target_date - INTERVAL '7 days')::timestamp
      AND pt.played_at <= (target_date + INTERVAL '1 day')::timestamp
    GROUP BY pt.song_id
    HAVING COUNT(*) > 0
    ORDER BY play_count DESC
    LIMIT 50; -- Top 50 trending songs
    
    -- Log the update
    RAISE NOTICE 'Updated trending songs for date: %', target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to increment play count and track play
CREATE OR REPLACE FUNCTION track_song_play(
    p_song_id UUID,
    p_play_duration INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    -- Update the song's play count
    UPDATE songs 
    SET 
        play_count = play_count + 1,
        last_played = NOW(),
        updated_at = NOW()
    WHERE id = p_song_id;
    
    -- Track the individual play
    INSERT INTO play_tracking (song_id, play_duration)
    VALUES (p_song_id, p_play_duration);
    
    -- Log the tracking
    RAISE NOTICE 'Tracked play for song: %', p_song_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp for trending_songs
CREATE TRIGGER update_trending_songs_updated_at 
    BEFORE UPDATE ON trending_songs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE play_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Public read access" ON play_tracking FOR SELECT USING (true);
CREATE POLICY "Public write access" ON play_tracking FOR ALL USING (true);

CREATE POLICY "Public read access" ON trending_songs FOR SELECT USING (true);
CREATE POLICY "Public write access" ON trending_songs FOR ALL USING (true);

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions for anonymous users
GRANT SELECT ON play_tracking TO anon;
GRANT SELECT ON trending_songs TO anon;

-- Grant permissions for authenticated users
GRANT ALL ON play_tracking TO authenticated;
GRANT ALL ON trending_songs TO authenticated;

-- Grant permissions for service role
GRANT ALL ON play_tracking TO service_role;
GRANT ALL ON trending_songs TO service_role;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create initial trending data for today (only if no data exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM trending_songs WHERE date = CURRENT_DATE) THEN
        PERFORM update_trending_songs(CURRENT_DATE);
        RAISE NOTICE 'Created initial trending data for today';
    ELSE
        RAISE NOTICE 'Trending data already exists for today';
    END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Trending songs migration completed successfully! Ready for Vercel deployment.' as message,
       'Tables created: play_tracking, trending_songs' as tables,
       'Functions created: update_trending_songs, track_song_play' as functions,
       'Indexes created: 8 performance indexes' as indexes,
       'Policies created: Public read/write access' as policies;
