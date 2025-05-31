import { Knex } from "knex";
import { DatabaseManager } from "./DatabaseManager";

export interface VideoMetadata {
  id?: number;
  title: string;
  game_type: string;
  teams: any; // JSONB
  score?: string;
  winner?: string;
  created_at?: Date;
  updated_at?: Date;
  video_url?: string;
  description?: string;
  tags?: any; // JSONB
  match_date?: Date;
  venue?: string;
  league?: string;
  season?: string;
}

export interface VideoMetadataFilters {
  gameType?: string;
  league?: string;
  season?: string;
  winner?: string;
  venue?: string;
  teams?: string | string[];
  tags?: Record<string, any>;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  select?: string[];
}

export class VideoMetadataDao {
  constructor() {}
  /**
   * Retrieves video metadata based on the provided filters and options.
   * @param filters The filters to apply when retrieving video metadata.
   * @param options The options to apply when retrieving video metadata.
   * @returns A promise that resolves to an array of video metadata objects.
   */
  async getVideoMetadataByFilters(
    db: DatabaseManager,
    filters: VideoMetadataFilters,
    options: QueryOptions = {}
  ): Promise<VideoMetadata[]> {
    const query = this.buildQuery(db, filters, options);
    return await query;
  }

  /**
   * Searches for video metadata based on a search term and optional filters and options.
   * @param searchTerm The term to search for in video metadata - this will search in title, description, venue, and league.
   * @param filters The filters to apply when searching video metadata.
   * @param options The options to apply when searching video metadata.
   * @returns A promise that resolves to an array of video metadata objects.
   */
  async searchVideoMetadata(
    db: DatabaseManager,
    searchTerm: string,
    filters: VideoMetadataFilters = {},
    options: QueryOptions = {}
  ): Promise<VideoMetadata[]> {
    const query = this.buildQuery(db, filters, options);

    // Add text search conditions
    query.where(function () {
      this.whereILike("title", `%${searchTerm}%`)
        .orWhereILike("description", `%${searchTerm}%`)
        .orWhereILike("venue", `%${searchTerm}%`)
        .orWhereILike("league", `%${searchTerm}%`);
    });

    return await query;
  }

  private buildQuery(
    db: DatabaseManager,
    filters: VideoMetadataFilters = {},
    options: QueryOptions = {}
  ): Knex.QueryBuilder {
    const { gameType, league, season, winner, venue, teams, tags, dateRange } =
      filters;

    const {
      select = ["*"],
      orderBy = "created_at",
      orderDirection = "desc",
      limit,
      offset,
    } = options;

    let query = db.conn("video_metadata").select(select);

    // Apply filters
    if (gameType) {
      query = query.where("game_type", gameType);
    }

    if (league) {
      query = query.where("league", league);
    }

    if (season) {
      query = query.where("season", season);
    }

    if (winner) {
      query = query.where("winner", winner);
    }

    if (venue) {
      query = query.where("venue", venue);
    }

    if (teams) {
      if (Array.isArray(teams)) {
        // Search for any of the provided teams in the JSONB array
        query = query.where(function () {
          teams.forEach((team) => {
            this.orWhereRaw("teams @> ?", [JSON.stringify([team])]);
          });
        });
      } else {
        // Search for a single team in the JSONB array
        query = query.whereRaw("teams @> ?", [JSON.stringify([teams])]);
      }
    }

    if (tags && Object.keys(tags).length > 0) {
      // Search for specific tags in the JSONB object
      query = query.whereRaw("tags @> ?", [JSON.stringify(tags)]);
    }

    if (dateRange) {
      if (dateRange.start) {
        query = query.where("match_date", ">=", dateRange.start);
      }
      if (dateRange.end) {
        query = query.where("match_date", "<=", dateRange.end);
      }
    }

    // Apply ordering
    query = query.orderBy(orderBy, orderDirection);

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return query;
  }

  /**
   * Retrieves a list of unique game types from the video metadata.
   * @returns A promise that resolves to an array of unique game types strings.
   */
  async getUniqueGameTypes(db: DatabaseManager): Promise<string[]> {
    const result = await db
      .conn("video_metadata")
      .distinct("game_type")
      .whereNotNull("game_type")
      .orderBy("game_type");

    return result.map((row) => row.game_type);
  }

  /**
   * Retrieves a list of unique leagues from the video metadata.
   * @returns A promise that resolves to an array of unique leagues strings.
   */
  async getUniqueLeagues(db: DatabaseManager): Promise<string[]> {
    const result = await db
      .conn("video_metadata")
      .distinct("league")
      .whereNotNull("league")
      .orderBy("league");

    return result.map((row) => row.league);
  }

  /**
   *  Retrieves a list of unique seasons from the video metadata.
   * @returns A promise that resolves to an array of unique seasons strings.
   */
  async getUniqueSeasons(db: DatabaseManager): Promise<string[]> {
    const result = await db
      .conn("video_metadata")
      .distinct("season")
      .whereNotNull("season")
      .orderBy("season");

    return result.map((row) => row.season);
  }
}

export const videoMetadataDao = new VideoMetadataDao();
