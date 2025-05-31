export interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
  maxConnections?: number;
  idleTimeout?: number;
}

export interface SearchFilters {
  game_type?: string;
  teams?: string[];
  league?: string;
  season?: string;
  tags?: string[];
  match_date_from?: Date;
  match_date_to?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface VideoMetadataStats {
  totalVideos: number;
  gameTypes: { [key: string]: number };
  teams: { [key: string]: number };
  leagues: { [key: string]: number };
  averageDuration: number;
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
}

export interface PlayerStatistics {
  [playerName: string]: {
    [statName: string]: number | string;
  };
}

export interface GameScore {
  [teamName: string]: number;
}

export interface VideoFilters {
  title?: string;
  description?: string;
  minDuration?: number;
  maxDuration?: number;
  hasPlayerStats?: boolean;
  hasVideo?: boolean;
  hasThumbnail?: boolean;
}
