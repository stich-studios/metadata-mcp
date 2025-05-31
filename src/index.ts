#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DatabaseManager, VideoMetadata } from "./database.js";
import { SearchFilters, VideoFilters, PaginatedResult } from "./types.js";

// Validation schemas
const CreateVideoMetadataSchema = z.object({
  title: z.string(),
  game_type: z.string(),
  teams: z.array(z.string()),
  score: z.string().optional(),
  duration_seconds: z.number().optional(),
  video_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  player_stats: z.record(z.any()).optional(),
  match_date: z.string().optional(), // ISO date string
  venue: z.string().optional(),
  league: z.string().optional(),
  season: z.string().optional(),
});

const UpdateVideoMetadataSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  game_type: z.string().optional(),
  teams: z.array(z.string()).optional(),
  score: z.string().optional(),
  duration_seconds: z.number().optional(),
  video_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  player_stats: z.record(z.any()).optional(),
  match_date: z.string().optional(),
  venue: z.string().optional(),
  league: z.string().optional(),
  season: z.string().optional(),
});

const SearchVideoMetadataSchema = z.object({
  game_type: z.string().optional(),
  teams: z.array(z.string()).optional(),
  league: z.string().optional(),
  season: z.string().optional(),
  tags: z.array(z.string()).optional(),
  match_date_from: z.string().optional(),
  match_date_to: z.string().optional(),
});

class VideoMetadataServer {
  private server: Server;
  private db: DatabaseManager;

  constructor() {
    this.server = new Server(
      {
        name: "video-metadata-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.db = new DatabaseManager();
    this.setupToolHandlers();
    this.setupResourceHandlers();

    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.db.close();
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_video_metadata",
            description: "Get all video metadata records",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_video_metadata",
            description: "Get a specific video metadata record by ID",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                  description: "The ID of the video metadata record",
                },
              },
              required: ["id"],
            },
          },
          {
            name: "search_video_metadata",
            description: "Search video metadata records by various filters",
            inputSchema: {
              type: "object",
              properties: {
                game_type: {
                  type: "string",
                  description: "Filter by game type (e.g., 'football', 'basketball')",
                },
                teams: {
                  type: "array",
                  items: { type: "string" },
                  description: "Filter by team names",
                },
                league: {
                  type: "string",
                  description: "Filter by league name",
                },
                season: {
                  type: "string",
                  description: "Filter by season",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Filter by tags",
                },
                match_date_from: {
                  type: "string",
                  description: "Filter by match date from (ISO date string)",
                },
                match_date_to: {
                  type: "string",
                  description: "Filter by match date to (ISO date string)",
                },
              },
            },
          },
          {
            name: "create_video_metadata",
            description: "Create a new video metadata record",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "The title of the video",
                },
                game_type: {
                  type: "string",
                  description: "The type of game (e.g., 'football', 'basketball')",
                },
                teams: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of team names",
                },
                score: {
                  type: "string",
                  description: "The final score (e.g., 'Team A: 2, Team B: 1')",
                },
                duration_seconds: {
                  type: "number",
                  description: "Duration of the video in seconds",
                },
                video_url: {
                  type: "string",
                  description: "URL to the video file",
                },
                thumbnail_url: {
                  type: "string",
                  description: "URL to the thumbnail image",
                },
                description: {
                  type: "string",
                  description: "Description of the video",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of tags",
                },
                player_stats: {
                  type: "object",
                  description: "Player statistics as a JSON object",
                },
                match_date: {
                  type: "string",
                  description: "Date of the match (ISO date string)",
                },
                venue: {
                  type: "string",
                  description: "Venue where the match was played",
                },
                league: {
                  type: "string",
                  description: "League name",
                },
                season: {
                  type: "string",
                  description: "Season identifier",
                },
              },
              required: ["title", "game_type", "teams"],
            },
          },
          {
            name: "update_video_metadata",
            description: "Update an existing video metadata record",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                  description: "The ID of the video metadata record to update",
                },
                title: { type: "string" },
                game_type: { type: "string" },
                teams: {
                  type: "array",
                  items: { type: "string" },
                },
                score: { type: "string" },
                duration_seconds: { type: "number" },
                video_url: { type: "string" },
                thumbnail_url: { type: "string" },
                description: { type: "string" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                },
                player_stats: { type: "object" },
                match_date: { type: "string" },
                venue: { type: "string" },
                league: { type: "string" },
                season: { type: "string" },
              },
              required: ["id"],
            },
          },
          {
            name: "delete_video_metadata",
            description: "Delete a video metadata record",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                  description: "The ID of the video metadata record to delete",
                },
              },
              required: ["id"],
            },
          },
          {
            name: "get_game_types",
            description: "Get all unique game types from the database",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_teams",
            description: "Get all unique teams from the database",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_leagues",
            description: "Get all unique leagues from the database",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "search_paginated",
            description: "Search video metadata with pagination",
            inputSchema: {
              type: "object",
              properties: {
                game_type: { type: "string" },
                teams: { type: "array", items: { type: "string" } },
                league: { type: "string" },
                season: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                match_date_from: { type: "string" },
                match_date_to: { type: "string" },
                page: { type: "number", description: "Page number (1-based)" },
                page_size: { type: "number", description: "Number of items per page" },
              },
            },
          },
          {
            name: "get_statistics",
            description: "Get comprehensive statistics about the video metadata",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_team_videos",
            description: "Get all videos for a specific team with statistics",
            inputSchema: {
              type: "object",
              properties: {
                team_name: {
                  type: "string",
                  description: "Name of the team",
                },
              },
              required: ["team_name"],
            },
          },
          {
            name: "get_recent_videos",
            description: "Get the most recently added videos",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Number of videos to return (default: 10)",
                },
              },
            },
          },
          {
            name: "search_by_text",
            description: "Search videos by title, description, and other text filters",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Search in video titles" },
                description: { type: "string", description: "Search in video descriptions" },
                min_duration: { type: "number", description: "Minimum duration in seconds" },
                max_duration: { type: "number", description: "Maximum duration in seconds" },
                has_player_stats: { type: "boolean", description: "Filter by presence of player statistics" },
                has_video: { type: "boolean", description: "Filter by presence of video URL" },
                has_thumbnail: { type: "boolean", description: "Filter by presence of thumbnail URL" },
              },
            },
          },
          {
            name: "get_videos_by_date_range",
            description: "Get videos within a specific date range",
            inputSchema: {
              type: "object",
              properties: {
                start_date: {
                  type: "string",
                  description: "Start date (ISO format)",
                },
                end_date: {
                  type: "string",
                  description: "End date (ISO format)",
                },
              },
              required: ["start_date", "end_date"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_video_metadata": {
            const metadata = await this.db.getAllVideoMetadata();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(metadata, null, 2),
                },
              ],
            };
          }

          case "get_video_metadata": {
            const { id } = args as { id: number };
            const metadata = await this.db.getVideoMetadataById(id);
            return {
              content: [
                {
                  type: "text",
                  text: metadata ? JSON.stringify(metadata, null, 2) : "Video metadata not found",
                },
              ],
            };
          }

          case "search_video_metadata": {
            const filters = SearchVideoMetadataSchema.parse(args);
            const searchFilters = {
              ...filters,
              match_date_from: filters.match_date_from ? new Date(filters.match_date_from) : undefined,
              match_date_to: filters.match_date_to ? new Date(filters.match_date_to) : undefined,
            };
            const metadata = await this.db.searchVideoMetadata(searchFilters);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(metadata, null, 2),
                },
              ],
            };
          }

          case "create_video_metadata": {
            const data = CreateVideoMetadataSchema.parse(args);
            const metadata = {
              ...data,
              match_date: data.match_date ? new Date(data.match_date) : undefined,
            };
            const created = await this.db.createVideoMetadata(metadata);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(created, null, 2),
                },
              ],
            };
          }

          case "update_video_metadata": {
            const data = UpdateVideoMetadataSchema.parse(args);
            const { id, ...updateData } = data;
            const metadata = {
              ...updateData,
              match_date: updateData.match_date ? new Date(updateData.match_date) : undefined,
            };
            const updated = await this.db.updateVideoMetadata(id, metadata);
            return {
              content: [
                {
                  type: "text",
                  text: updated ? JSON.stringify(updated, null, 2) : "Video metadata not found",
                },
              ],
            };
          }

          case "delete_video_metadata": {
            const { id } = args as { id: number };
            const deleted = await this.db.deleteVideoMetadata(id);
            return {
              content: [
                {
                  type: "text",
                  text: deleted ? "Video metadata deleted successfully" : "Video metadata not found",
                },
              ],
            };
          }

          case "get_game_types": {
            const gameTypes = await this.db.getGameTypes();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(gameTypes, null, 2),
                },
              ],
            };
          }

          case "get_teams": {
            const teams = await this.db.getTeams();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(teams, null, 2),
                },
              ],
            };
          }

          case "get_leagues": {
            const leagues = await this.db.getLeagues();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(leagues, null, 2),
                },
              ],
            };
          }

          case "search_paginated": {
            const { page = 1, page_size = 20, ...filterData } = args as any;
            const filters: SearchFilters = {
              ...filterData,
              match_date_from: filterData.match_date_from ? new Date(filterData.match_date_from) : undefined,
              match_date_to: filterData.match_date_to ? new Date(filterData.match_date_to) : undefined,
            };
            const paginatedResults = await this.db.searchVideoMetadataPaginated(filters, page, page_size);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(paginatedResults, null, 2),
                },
              ],
            };
          }

          case "get_statistics": {
            const statistics = await this.db.getStatistics();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(statistics, null, 2),
                },
              ],
            };
          }

          case "get_team_videos": {
            const { team_name } = args as { team_name: string };
            const teamData = await this.db.getTeamVideos(team_name);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(teamData, null, 2),
                },
              ],
            };
          }

          case "get_recent_videos": {
            const { limit = 10 } = args as { limit?: number };
            const recentVideos = await this.db.getRecentVideos(limit);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(recentVideos, null, 2),
                },
              ],
            };
          }

          case "search_by_text": {
            const filters = args as VideoFilters;
            const textSearchResults = await this.db.searchWithTextFilters(filters);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(textSearchResults, null, 2),
                },
              ],
            };
          }

          case "get_videos_by_date_range": {
            const { start_date, end_date } = args as { start_date: string; end_date: string };
            const dateRangeVideos = await this.db.getVideosByDateRange(new Date(start_date), new Date(end_date));
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(dateRangeVideos, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "schema://video_metadata",
            name: "Video Metadata Schema",
            description: "Schema for video metadata records",
            mimeType: "application/json",
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === "schema://video_metadata") {
        const schema = {
          type: "object",
          properties: {
            id: { type: "number", description: "Unique identifier" },
            title: { type: "string", description: "Video title" },
            game_type: { type: "string", description: "Type of game (e.g., football, basketball)" },
            teams: { type: "array", items: { type: "string" }, description: "Participating teams" },
            score: { type: "string", description: "Final score" },
            duration_seconds: { type: "number", description: "Video duration in seconds" },
            created_at: { type: "string", format: "date-time", description: "Creation timestamp" },
            updated_at: { type: "string", format: "date-time", description: "Last update timestamp" },
            video_url: { type: "string", description: "URL to video file" },
            thumbnail_url: { type: "string", description: "URL to thumbnail image" },
            description: { type: "string", description: "Video description" },
            tags: { type: "array", items: { type: "string" }, description: "Video tags" },
            player_stats: { type: "object", description: "Player statistics" },
            match_date: { type: "string", format: "date-time", description: "Date of the match" },
            venue: { type: "string", description: "Match venue" },
            league: { type: "string", description: "League name" },
            season: { type: "string", description: "Season identifier" },
          },
          required: ["id", "title", "game_type", "teams"],
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InternalError, `Resource not found: ${uri}`);
    });
  }

  async run() {
    try {
      await this.db.connect();
      await this.db.initializeSchema();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Video Metadata MCP server running on stdio");
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

const server = new VideoMetadataServer();
server.run().catch(console.error);
