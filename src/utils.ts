import { VideoMetadata, VideoMetadataStats, PaginatedResult, SearchFilters } from './types.js';

export class QueryBuilder {
  private baseQuery: string;
  private whereConditions: string[] = [];
  private params: any[] = [];
  private paramCount: number = 0;

  constructor(baseQuery: string) {
    this.baseQuery = baseQuery;
  }

  addCondition(condition: string, value: any): this {
    this.paramCount++;
    this.whereConditions.push(condition.replace('?', `$${this.paramCount}`));
    this.params.push(value);
    return this;
  }

  addArrayCondition(column: string, values: any[], operator: '?|' | '?&' = '?|'): this {
    this.paramCount++;
    this.whereConditions.push(`${column} ${operator} $${this.paramCount}`);
    this.params.push(values);
    return this;
  }

  addDateRangeCondition(column: string, from?: Date, to?: Date): this {
    if (from) {
      this.addCondition(`${column} >= ?`, from);
    }
    if (to) {
      this.addCondition(`${column} <= ?`, to);
    }
    return this;
  }

  build(): { query: string; params: any[] } {
    let query = this.baseQuery;
    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }
    return { query, params: this.params };
  }

  addOrderBy(column: string, direction: 'ASC' | 'DESC' = 'DESC'): this {
    this.baseQuery += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  addPagination(limit: number, offset: number): this {
    this.baseQuery += ` LIMIT ${limit} OFFSET ${offset}`;
    return this;
  }
}

export class ValidationHelpers {
  static isValidGameType(gameType: string): boolean {
    const validGameTypes = [
      'football', 'basketball', 'soccer', 'baseball', 'hockey', 
      'tennis', 'golf', 'volleyball', 'rugby', 'cricket',
      'american-football', 'esports', 'boxing', 'mma', 'other'
    ];
    return validGameTypes.includes(gameType.toLowerCase());
  }

  static validateTeams(teams: string[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(teams)) {
      return { isValid: false, error: 'Teams must be an array' };
    }
    if (teams.length < 1) {
      return { isValid: false, error: 'At least one team is required' };
    }
    if (teams.length > 10) {
      return { isValid: false, error: 'Maximum 10 teams allowed' };
    }
    for (const team of teams) {
      if (typeof team !== 'string' || team.trim().length === 0) {
        return { isValid: false, error: 'Each team must be a non-empty string' };
      }
    }
    return { isValid: true };
  }

  static validateDuration(duration?: number): { isValid: boolean; error?: string } {
    if (duration === undefined) return { isValid: true };
    if (typeof duration !== 'number' || duration < 0) {
      return { isValid: false, error: 'Duration must be a positive number' };
    }
    if (duration > 86400) { // 24 hours
      return { isValid: false, error: 'Duration cannot exceed 24 hours' };
    }
    return { isValid: true };
  }

  static validateScore(score?: string): { isValid: boolean; error?: string } {
    if (!score) return { isValid: true };
    if (typeof score !== 'string') {
      return { isValid: false, error: 'Score must be a string' };
    }
    if (score.length > 200) {
      return { isValid: false, error: 'Score description too long' };
    }
    return { isValid: true };
  }

  static validateTags(tags?: string[]): { isValid: boolean; error?: string } {
    if (!tags) return { isValid: true };
    if (!Array.isArray(tags)) {
      return { isValid: false, error: 'Tags must be an array' };
    }
    if (tags.length > 20) {
      return { isValid: false, error: 'Maximum 20 tags allowed' };
    }
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        return { isValid: false, error: 'Each tag must be a non-empty string' };
      }
      if (tag.length > 50) {
        return { isValid: false, error: 'Each tag must be less than 50 characters' };
      }
    }
    return { isValid: true };
  }
}

export class DatabaseUtils {
  static formatVideoMetadata(row: any): VideoMetadata {
    return {
      ...row,
      teams: Array.isArray(row.teams) ? row.teams : JSON.parse(row.teams || '[]'),
      tags: row.tags ? (Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags)) : undefined,
      player_stats: row.player_stats ? 
        (typeof row.player_stats === 'object' ? row.player_stats : JSON.parse(row.player_stats)) : 
        undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      match_date: row.match_date ? new Date(row.match_date) : undefined,
    };
  }

  static createPaginatedResult<T>(
    data: T[], 
    total: number, 
    page: number, 
    pageSize: number
  ): PaginatedResult<T> {
    return {
      data,
      total,
      page,
      pageSize,
      hasNext: page * pageSize < total,
      hasPrevious: page > 1,
    };
  }

  static buildSearchQuery(filters: SearchFilters): { query: string; params: any[] } {
    const builder = new QueryBuilder('SELECT * FROM video_metadata');
    
    if (filters.game_type) {
      builder.addCondition('game_type = ?', filters.game_type);
    }
    
    if (filters.teams && filters.teams.length > 0) {
      builder.addArrayCondition('teams', filters.teams);
    }
    
    if (filters.league) {
      builder.addCondition('league = ?', filters.league);
    }
    
    if (filters.season) {
      builder.addCondition('season = ?', filters.season);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      builder.addArrayCondition('tags', filters.tags);
    }
    
    builder.addDateRangeCondition('match_date', filters.match_date_from, filters.match_date_to);
    
    builder.addOrderBy('created_at', 'DESC');
    
    if (filters.limit && filters.offset !== undefined) {
      builder.addPagination(filters.limit, filters.offset);
    }
    
    return builder.build();
  }

  static parsePlayerStats(statsInput: any): Record<string, any> | undefined {
    if (!statsInput) return undefined;
    
    if (typeof statsInput === 'string') {
      try {
        return JSON.parse(statsInput);
      } catch {
        return undefined;
      }
    }
    
    if (typeof statsInput === 'object') {
      return statsInput;
    }
    
    return undefined;
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  static calculateStats(videos: VideoMetadata[]): VideoMetadataStats {
    const stats: VideoMetadataStats = {
      totalVideos: videos.length,
      gameTypes: {},
      teams: {},
      leagues: {},
      averageDuration: 0,
      dateRange: {
        earliest: null,
        latest: null,
      },
    };

    if (videos.length === 0) return stats;

    let totalDuration = 0;
    const dates: Date[] = [];

    videos.forEach(video => {
      // Game types
      stats.gameTypes[video.game_type] = (stats.gameTypes[video.game_type] || 0) + 1;

      // Teams
      video.teams.forEach(team => {
        stats.teams[team] = (stats.teams[team] || 0) + 1;
      });

      // Leagues
      if (video.league) {
        stats.leagues[video.league] = (stats.leagues[video.league] || 0) + 1;
      }

      // Duration
      if (video.duration_seconds) {
        totalDuration += video.duration_seconds;
      }

      // Dates
      if (video.match_date) {
        dates.push(video.match_date);
      }
    });

    // Calculate averages and ranges
    stats.averageDuration = totalDuration / videos.length;

    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      stats.dateRange.earliest = dates[0];
      stats.dateRange.latest = dates[dates.length - 1];
    }

    return stats;
  }
}
