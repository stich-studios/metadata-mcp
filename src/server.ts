import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DatabaseManager } from "./db/DatabaseManager";
import z from "zod";
import {
  QueryOptions,
  videoMetadataDao,
  VideoMetadataFilters,
} from "./db/VideoMetadataDao";

const VideoMetadataSchema = z.object({
  title: z
    .string()
    .describe("Title of the video, e.g. 'LaLiga : Barcelona vs Real Madrid'."),
  gameType: z.string().describe("Type of game, e.g. 'football', 'basketball'."),
  teams: z
    .array(z.string())
    .describe(
      "Array of team names involved in the match, e.g. ['Barcelona', 'Real Madrid']."
    ),
  score: z.string().optional().describe("Score of the match, e.g. '2-1'."),
  winner: z
    .string()
    .optional()
    .describe("Winner of the match, e.g. 'Barcelona'."),
  videoUrl: z
    .string()
    .url()
    .optional()
    .describe("URL of the video, e.g. 'https://example.com/video/123'."),
  description: z.string().optional().describe("Description of the video."),
  tags: z
    .record(z.any())
    .optional()
    .describe("Tags associated with the video."),
  matchDate: z
    .string()
    .datetime()
    .optional()
    .describe("Date of the match, e.g. '2022-01-01T00:00:00Z'."),
  venue: z.string().optional().describe("Venue of the match, e.g. 'Camp Nou'."),
  league: z
    .string()
    .optional()
    .describe("League of the match, e.g. 'La Liga'."),
  season: z.string().optional().describe("Season of the match, e.g. '2022'."),
});

const SearchFiltersSchema = z.object({
  gameType: z
    .string()
    .optional()
    .describe("Filter by game type, e.g. 'football', 'basketball'."),
  teams: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Filter by team name(s) e.g. 'Celtics', ['Celtics', 'Knicks']."),
  league: z
    .string()
    .optional()
    .describe("Filter by league name, e.g. 'NBA', 'Premier League'."),
  season: z
    .string()
    .optional()
    .describe("Filter by season, e.g. '2021', '2022'."),
  winner: z
    .string()
    .optional()
    .describe("Filter by winner team name, e.g. 'Arsenal'."),
  venue: z
    .string()
    .optional()
    .describe("Filter by venue name, e.g. 'Wembley Stadium'."),
  tags: z
    .record(z.any())
    .optional()
    .describe(
      "Filter by tags., e.g. { 'highlight': true, 'full_match': false }."
    ),
  matchDateStart: z
    .string()
    .datetime()
    .optional()
    .describe("Filter by match start date, e.g. '2022-01-01T00:00:00Z'."),
  matchDateEnd: z
    .string()
    .datetime()
    .optional()
    .describe("Filter by match end date, e.g. '2022-12-31T23:59:59Z'."),
});

const SearchQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of results to return."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Number of results to skip before starting to return results."),
  orderBy: z
    .string()
    .optional()
    .describe("Field to order results by, e.g. 'matchDate', 'title'."),
  orderDirection: z
    .enum(["asc", "desc"])
    .optional()
    .describe(
      "Direction to order results, either 'asc' for ascending or 'desc' for descending."
    ),
  select: z
    .array(z.string())
    .optional()
    .describe(
      "Fields to select in the results, e.g. ['title', 'gameType', 'teams']."
    ),
});

export class Server {
  private _server: McpServer;
  private _db: DatabaseManager;

  constructor(db: DatabaseManager) {
    if (!db) {
      throw new Error("DatabaseManager instance is required.");
    }
    this._db = db;
    this._server = new McpServer({
      name: "sports-metadata-server",
      version: "1.0.0",
    });
  }

  async initialize() {
    this.registerTools();
  }

  async shutdown() {
    await this._server.close();
  }

  private registerTools() {
    this._server.tool(
      "list_unique_game_types",
      "Lists all unique game types in the video library (e.g. 'football', 'basketball').",
      {},
      async () => {
        const result = await videoMetadataDao.getUniqueGameTypes(this._db);
        return {
          content: [
            {
              type: "text",
              text: result.join(", "),
            },
          ],
        };
      }
    );

    this._server.tool(
      "list_unique_leagues",
      "Lists all unique leagues in the video library (e.g. 'NBA', 'Premier League').",
      {},
      async () => {
        const result = await videoMetadataDao.getUniqueLeagues(this._db);
        return {
          content: [
            {
              type: "text",
              text: result.join(", "),
            },
          ],
        };
      }
    );

    this._server.tool(
      "list_unique_seasons",
      "Lists all unique seasons in the video library (e.g. '2021', '2022').",
      {},
      async () => {
        const result = await videoMetadataDao.getUniqueSeasons(this._db);
        return {
          content: [
            {
              type: "text",
              text: result.join(", "),
            },
          ],
        };
      }
    );

    this._server.tool(
      "search_videos",
      "Searches for videos based on various filters, e.g. 'football', 'Barcelona vs Real Madrid'.",
      {
        term: z
          .string()
          .describe("Search term to filter videos, e.g 'barcelona'."),
        filters: SearchFiltersSchema,
        query: SearchQuerySchema,
      },
      async ({ term, filters, query }) => {
        const validatedFilters = SearchFiltersSchema.parse(filters);
        const filter: VideoMetadataFilters = {
          ...validatedFilters,
          dateRange: {
            start: validatedFilters.matchDateStart
              ? new Date(validatedFilters.matchDateStart)
              : undefined,
            end: validatedFilters.matchDateEnd
              ? new Date(validatedFilters.matchDateEnd)
              : undefined,
          },
        };

        const validatedQuery = SearchQuerySchema.parse(query || {});
        const queryOpts: QueryOptions = {
          ...validatedQuery,
        };

        const result = await videoMetadataDao.searchVideoMetadata(
          this._db,
          term,
          filter,
          queryOpts
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null),
            },
          ],
        };
      }
    );

    this._server.tool(
      "get_video_metadata_by_filters",
      "Retrieves video metadata based on the provided filters.",
      {
        filters: SearchFiltersSchema,
        query: SearchQuerySchema,
      },
      async ({ filters, query }) => {
        const validatedFilters = SearchFiltersSchema.parse(filters);
        const filter: VideoMetadataFilters = {
          ...validatedFilters,
          dateRange: {
            start: validatedFilters.matchDateStart
              ? new Date(validatedFilters.matchDateStart)
              : undefined,
            end: validatedFilters.matchDateEnd
              ? new Date(validatedFilters.matchDateEnd)
              : undefined,
          },
        };

        const validatedQuery = SearchQuerySchema.parse(query || {});
        const queryOpts: QueryOptions = {
          ...validatedQuery,
        };

        const result = await videoMetadataDao.getVideoMetadataByFilters(
          this._db,
          filter,
          queryOpts
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null),
            },
          ],
        };
      }
    );
  }

  get server() {
    return this._server;
  }
}
