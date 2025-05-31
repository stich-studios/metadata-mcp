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
    winner VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    video_url TEXT,
    description TEXT,
    tags JSONB,
    match_date TIMESTAMP WITH TIME ZONE,
    venue VARCHAR(255),
    league VARCHAR(100),
    season VARCHAR(50)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_video_metadata_game_type ON video_metadata(game_type);
CREATE INDEX IF NOT EXISTS idx_video_metadata_teams ON video_metadata USING GIN(teams);
CREATE INDEX IF NOT EXISTS idx_video_metadata_match_date ON video_metadata(match_date);
CREATE INDEX IF NOT EXISTS idx_video_metadata_league ON video_metadata(league);

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

    -- TODO: Write insert queries?

-- Display setup completion message
SELECT 'Video Metadata database setup completed successfully!' as status;
