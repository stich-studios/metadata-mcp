-- Initial database setup for Video Metadata MCP Server
-- This file is automatically run when the PostgreSQL container starts

-- Create the main database (already created by POSTGRES_DB env var)
-- CREATE DATABASE video_metadata;

-- Connect to the database
\c video_metadata;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the video_metadata table
CREATE TABLE IF NOT EXISTS video_metadata (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    game_type VARCHAR(100) NOT NULL,
    teams JSONB NOT NULL,
    score TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    video_url TEXT,
    thumbnail_url TEXT,
    description TEXT,
    tags JSONB,
    player_stats JSONB,
    match_date TIMESTAMP WITH TIME ZONE,
    venue VARCHAR(255),
    league VARCHAR(100),
    season VARCHAR(50)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_video_metadata_game_type ON video_metadata(game_type);
CREATE INDEX IF NOT EXISTS idx_video_metadata_teams ON video_metadata USING GIN(teams);
CREATE INDEX IF NOT EXISTS idx_video_metadata_tags ON video_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_video_metadata_match_date ON video_metadata(match_date);
CREATE INDEX IF NOT EXISTS idx_video_metadata_league ON video_metadata(league);
CREATE INDEX IF NOT EXISTS idx_video_metadata_created_at ON video_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_video_metadata_season ON video_metadata(season);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_video_metadata_updated_at
    BEFORE UPDATE ON video_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO video_metadata (
    title, game_type, teams, score, duration_seconds, video_url, 
    thumbnail_url, description, tags, player_stats, match_date, venue, league, season
) VALUES 
(
    'NBA Finals Game 7 - Lakers vs Celtics',
    'basketball',
    '["Los Angeles Lakers", "Boston Celtics"]'::jsonb,
    'Lakers: 110, Celtics: 107',
    8400,
    'https://example.com/videos/nba-finals-game7.mp4',
    'https://example.com/thumbnails/nba-finals-game7.jpg',
    'Thrilling Game 7 of the NBA Finals with overtime finish',
    '["playoffs", "finals", "overtime", "championship"]'::jsonb,
    '{"LeBron James": {"points": 32, "rebounds": 12, "assists": 8}, "Jayson Tatum": {"points": 28, "rebounds": 9, "assists": 6}}'::jsonb,
    '2024-06-18',
    'TD Garden',
    'NBA',
    '2023-24'
),
(
    'Super Bowl LVIII - Chiefs vs 49ers',
    'football',
    '["Kansas City Chiefs", "San Francisco 49ers"]'::jsonb,
    'Chiefs: 25, 49ers: 22',
    12600,
    'https://example.com/videos/super-bowl-58.mp4',
    'https://example.com/thumbnails/super-bowl-58.jpg',
    'Overtime thriller in Las Vegas',
    '["superbowl", "championship", "overtime", "playoffs"]'::jsonb,
    '{"Patrick Mahomes": {"passing_yards": 333, "touchdowns": 2, "interceptions": 0}, "Brock Purdy": {"passing_yards": 255, "touchdowns": 1, "interceptions": 1}}'::jsonb,
    '2024-02-11',
    'Allegiant Stadium',
    'NFL',
    '2023'
),
(
    'Champions League Final - Real Madrid vs Liverpool',
    'soccer',
    '["Real Madrid", "Liverpool"]'::jsonb,
    'Real Madrid: 1, Liverpool: 0',
    6300,
    'https://example.com/videos/champions-league-final.mp4',
    'https://example.com/thumbnails/champions-league-final.jpg',
    'Vinicius Jr. scores the winner in Paris',
    '["champions-league", "final", "european-football"]'::jsonb,
    '{"Vinicius Jr.": {"goals": 1, "assists": 0, "shots": 3}, "Mohamed Salah": {"goals": 0, "assists": 0, "shots": 4}}'::jsonb,
    '2024-05-28',
    'Stade de France',
    'UEFA Champions League',
    '2023-24'
);

-- Create a view for easier querying
CREATE OR REPLACE VIEW video_metadata_summary AS
SELECT 
    id,
    title,
    game_type,
    jsonb_array_length(teams) as team_count,
    teams,
    score,
    duration_seconds,
    CASE 
        WHEN duration_seconds >= 3600 THEN 
            LPAD((duration_seconds / 3600)::text, 2, '0') || ':' || 
            LPAD(((duration_seconds % 3600) / 60)::text, 2, '0') || ':' || 
            LPAD((duration_seconds % 60)::text, 2, '0')
        ELSE 
            LPAD((duration_seconds / 60)::text, 2, '0') || ':' || 
            LPAD((duration_seconds % 60)::text, 2, '0')
    END as formatted_duration,
    match_date,
    venue,
    league,
    season,
    CASE WHEN tags IS NOT NULL THEN jsonb_array_length(tags) ELSE 0 END as tag_count,
    CASE WHEN player_stats IS NOT NULL THEN jsonb_object_keys(player_stats) ELSE null END as players,
    created_at,
    updated_at
FROM video_metadata;

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON DATABASE video_metadata TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Display setup completion message
SELECT 'Video Metadata database setup completed successfully!' as status;
