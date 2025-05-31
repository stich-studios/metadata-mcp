import { Pool, Client } from 'pg';
import { VideoMetadata, VideoMetadataStats, PaginatedResult, SearchFilters, VideoFilters } from './types.js';
import { DatabaseUtils, ValidationHelpers } from './utils.js';

export interface VideoMetadata {
  id: number;
  title: string;
  game_type: string;
  teams: string[]; // JSON array of team names
  score: string; // e.g., "Team A: 2, Team B: 1"
  duration_seconds: number;
  created_at: Date;
  updated_at: Date;
  video_url?: string;
  thumbnail_url?: string;
  description?: string;
  tags?: string[]; // JSON array of tags
  player_stats?: Record<string, any>; // JSON object for player statistics
  match_date?: Date;
  venue?: string;
  league?: string;
  season?: string;
}

export class DatabaseManager {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'video_metadata',
      password: process.env.POSTGRES_PASSWORD || 'password',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      client.release();
      console.log('Connected to PostgreSQL database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async initializeSchema(): Promise<void> {
    const createTableQuery = `
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

      CREATE INDEX IF NOT EXISTS idx_video_metadata_game_type ON video_metadata(game_type);
      CREATE INDEX IF NOT EXISTS idx_video_metadata_teams ON video_metadata USING GIN(teams);
      CREATE INDEX IF NOT EXISTS idx_video_metadata_tags ON video_metadata USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_video_metadata_match_date ON video_metadata(match_date);
      CREATE INDEX IF NOT EXISTS idx_video_metadata_league ON video_metadata(league);
    `;

    try {
      await this.pool.query(createTableQuery);
      console.log('Database schema initialized');
    } catch (error) {
      console.error('Failed to initialize schema:', error);
      throw error;
    }
  }

  async getAllVideoMetadata(): Promise<VideoMetadata[]> {
    const query = 'SELECT * FROM video_metadata ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getVideoMetadataById(id: number): Promise<VideoMetadata | null> {
    const query = 'SELECT * FROM video_metadata WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async searchVideoMetadata(filters: {
    game_type?: string;
    teams?: string[];
    league?: string;
    season?: string;
    tags?: string[];
    match_date_from?: Date;
    match_date_to?: Date;
  }): Promise<VideoMetadata[]> {
    let query = 'SELECT * FROM video_metadata WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (filters.game_type) {
      paramCount++;
      query += ` AND game_type = $${paramCount}`;
      params.push(filters.game_type);
    }

    if (filters.teams && filters.teams.length > 0) {
      paramCount++;
      query += ` AND teams ?| $${paramCount}`;
      params.push(filters.teams);
    }

    if (filters.league) {
      paramCount++;
      query += ` AND league = $${paramCount}`;
      params.push(filters.league);
    }

    if (filters.season) {
      paramCount++;
      query += ` AND season = $${paramCount}`;
      params.push(filters.season);
    }

    if (filters.tags && filters.tags.length > 0) {
      paramCount++;
      query += ` AND tags ?| $${paramCount}`;
      params.push(filters.tags);
    }

    if (filters.match_date_from) {
      paramCount++;
      query += ` AND match_date >= $${paramCount}`;
      params.push(filters.match_date_from);
    }

    if (filters.match_date_to) {
      paramCount++;
      query += ` AND match_date <= $${paramCount}`;
      params.push(filters.match_date_to);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async createVideoMetadata(metadata: Omit<VideoMetadata, 'id' | 'created_at' | 'updated_at'>): Promise<VideoMetadata> {
    const query = `
      INSERT INTO video_metadata (
        title, game_type, teams, score, duration_seconds, video_url, 
        thumbnail_url, description, tags, player_stats, match_date, venue, league, season
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const params = [
      metadata.title,
      metadata.game_type,
      JSON.stringify(metadata.teams),
      metadata.score,
      metadata.duration_seconds,
      metadata.video_url,
      metadata.thumbnail_url,
      metadata.description,
      metadata.tags ? JSON.stringify(metadata.tags) : null,
      metadata.player_stats ? JSON.stringify(metadata.player_stats) : null,
      metadata.match_date,
      metadata.venue,
      metadata.league,
      metadata.season
    ];

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async updateVideoMetadata(id: number, metadata: Partial<Omit<VideoMetadata, 'id' | 'created_at'>>): Promise<VideoMetadata | null> {
    const fields = [];
    const params = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        paramCount++;
        if (key === 'teams' || key === 'tags' || key === 'player_stats') {
          fields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
      }
    }

    if (fields.length === 0) {
      return this.getVideoMetadataById(id);
    }

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    const query = `UPDATE video_metadata SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async deleteVideoMetadata(id: number): Promise<boolean> {
    const query = 'DELETE FROM video_metadata WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  async getGameTypes(): Promise<string[]> {
    const query = 'SELECT DISTINCT game_type FROM video_metadata ORDER BY game_type';
    const result = await this.pool.query(query);
    return result.rows.map(row => row.game_type);
  }

  async getTeams(): Promise<string[]> {
    const query = `
      SELECT DISTINCT jsonb_array_elements_text(teams) as team 
      FROM video_metadata 
      ORDER BY team
    `;
    const result = await this.pool.query(query);
    return result.rows.map(row => row.team);
  }

  async getLeagues(): Promise<string[]> {
    const query = 'SELECT DISTINCT league FROM video_metadata WHERE league IS NOT NULL ORDER BY league';
    const result = await this.pool.query(query);
    return result.rows.map(row => row.league);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Enhanced search with pagination
  async searchVideoMetadataPaginated(
    filters: SearchFilters, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedResult<VideoMetadata>> {
    const offset = (page - 1) * pageSize;
    const searchFilters = { ...filters, limit: pageSize, offset };
    
    const { query, params } = DatabaseUtils.buildSearchQuery(searchFilters);
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)')
                           .replace(/ORDER BY.*$/, '')
                           .replace(/LIMIT.*$/, '');
    const countResult = await this.pool.query(countQuery, params.slice(0, -2)); // Remove limit/offset params
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const result = await this.pool.query(query, params);
    const formattedData = result.rows.map(DatabaseUtils.formatVideoMetadata);
    
    return DatabaseUtils.createPaginatedResult(formattedData, total, page, pageSize);
  }

  // Advanced search with text filters
  async searchWithTextFilters(filters: VideoFilters): Promise<VideoMetadata[]> {
    let query = 'SELECT * FROM video_metadata WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (filters.title) {
      paramCount++;
      query += ` AND title ILIKE $${paramCount}`;
      params.push(`%${filters.title}%`);
    }

    if (filters.description) {
      paramCount++;
      query += ` AND description ILIKE $${paramCount}`;
      params.push(`%${filters.description}%`);
    }

    if (filters.minDuration !== undefined) {
      paramCount++;
      query += ` AND duration_seconds >= $${paramCount}`;
      params.push(filters.minDuration);
    }

    if (filters.maxDuration !== undefined) {
      paramCount++;
      query += ` AND duration_seconds <= $${paramCount}`;
      params.push(filters.maxDuration);
    }

    if (filters.hasPlayerStats !== undefined) {
      if (filters.hasPlayerStats) {
        query += ` AND player_stats IS NOT NULL`;
      } else {
        query += ` AND player_stats IS NULL`;
      }
    }

    if (filters.hasVideo !== undefined) {
      if (filters.hasVideo) {
        query += ` AND video_url IS NOT NULL`;
      } else {
        query += ` AND video_url IS NULL`;
      }
    }

    if (filters.hasThumbnail !== undefined) {
      if (filters.hasThumbnail) {
        query += ` AND thumbnail_url IS NOT NULL`;
      } else {
        query += ` AND thumbnail_url IS NULL`;
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(DatabaseUtils.formatVideoMetadata);
  }

  // Get comprehensive statistics
  async getStatistics(): Promise<VideoMetadataStats> {
    const allVideos = await this.getAllVideoMetadata();
    return DatabaseUtils.calculateStats(allVideos);
  }

  // Get videos by date range
  async getVideosByDateRange(startDate: Date, endDate: Date): Promise<VideoMetadata[]> {
    const query = `
      SELECT * FROM video_metadata 
      WHERE match_date >= $1 AND match_date <= $2 
      ORDER BY match_date DESC
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows.map(DatabaseUtils.formatVideoMetadata);
  }

  // Get recent videos
  async getRecentVideos(limit: number = 10): Promise<VideoMetadata[]> {
    const query = 'SELECT * FROM video_metadata ORDER BY created_at DESC LIMIT $1';
    const result = await this.pool.query(query, [limit]);
    return result.rows.map(DatabaseUtils.formatVideoMetadata);
  }

  // Get videos by team with statistics
  async getTeamVideos(teamName: string): Promise<{
    videos: VideoMetadata[];
    stats: {
      totalGames: number;
      wins: number;
      losses: number;
      draws: number;
      avgDuration: number;
    };
  }> {
    const query = `
      SELECT * FROM video_metadata 
      WHERE teams ? $1 
      ORDER BY match_date DESC
    `;
    const result = await this.pool.query(query, [teamName]);
    const videos = result.rows.map(DatabaseUtils.formatVideoMetadata);
    
    // Calculate team statistics
    let wins = 0, losses = 0, draws = 0;
    let totalDuration = 0;
    
    videos.forEach(video => {
      if (video.duration_seconds) {
        totalDuration += video.duration_seconds;
      }
      
      // Simple win/loss/draw detection based on score string
      if (video.score) {
        const scoreRegex = new RegExp(`${teamName}[^\\d]*(\\d+)`, 'i');
        const match = video.score.match(scoreRegex);
        if (match) {
          const teamScore = parseInt(match[1]);
          // This is a simplified approach - you might want more sophisticated parsing
          const otherScores = video.score.match(/\d+/g)?.map(Number) || [];
          const maxOtherScore = Math.max(...otherScores.filter((s: number) => s !== teamScore));
          
          if (teamScore > maxOtherScore) wins++;
          else if (teamScore < maxOtherScore) losses++;
          else draws++;
        }
      }
    });
    
    return {
      videos,
      stats: {
        totalGames: videos.length,
        wins,
        losses,
        draws,
        avgDuration: videos.length > 0 ? totalDuration / videos.length : 0,
      },
    };
  }

  // Bulk operations
  async bulkCreateVideoMetadata(metadataList: Omit<VideoMetadata, 'id' | 'created_at' | 'updated_at'>[]): Promise<VideoMetadata[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results: VideoMetadata[] = [];
      
      for (const metadata of metadataList) {
        // Validate each record
        const teamValidation = ValidationHelpers.validateTeams(metadata.teams);
        if (!teamValidation.isValid) {
          throw new Error(`Invalid teams: ${teamValidation.error}`);
        }
        
        const durationValidation = ValidationHelpers.validateDuration(metadata.duration_seconds);
        if (!durationValidation.isValid) {
          throw new Error(`Invalid duration: ${durationValidation.error}`);
        }
        
        const result = await this.createVideoMetadata(metadata);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Enhanced validation in createVideoMetadata
  async createVideoMetadataWithValidation(metadata: Omit<VideoMetadata, 'id' | 'created_at' | 'updated_at'>): Promise<VideoMetadata> {
    // Validate game type
    if (!ValidationHelpers.isValidGameType(metadata.game_type)) {
      throw new Error(`Invalid game type: ${metadata.game_type}`);
    }
    
    // Validate teams
    const teamValidation = ValidationHelpers.validateTeams(metadata.teams);
    if (!teamValidation.isValid) {
      throw new Error(`Invalid teams: ${teamValidation.error}`);
    }
    
    // Validate duration
    const durationValidation = ValidationHelpers.validateDuration(metadata.duration_seconds);
    if (!durationValidation.isValid) {
      throw new Error(`Invalid duration: ${durationValidation.error}`);
    }
    
    // Validate score
    const scoreValidation = ValidationHelpers.validateScore(metadata.score);
    if (!scoreValidation.isValid) {
      throw new Error(`Invalid score: ${scoreValidation.error}`);
    }
    
    // Validate tags
    const tagsValidation = ValidationHelpers.validateTags(metadata.tags);
    if (!tagsValidation.isValid) {
      throw new Error(`Invalid tags: ${tagsValidation.error}`);
    }
    
    return this.createVideoMetadata(metadata);
  }
}
