"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = __importDefault(require("zod"));
const VideoMetadataDao_1 = require("./db/VideoMetadataDao");
const VideoMetadataSchema = zod_1.default.object({
    title: zod_1.default
        .string()
        .describe("Title of the video, e.g. 'LaLiga : Barcelona vs Real Madrid'."),
    gameType: zod_1.default.string().describe("Type of game, e.g. 'football', 'basketball'."),
    teams: zod_1.default
        .array(zod_1.default.string())
        .describe("Array of team names involved in the match, e.g. ['Barcelona', 'Real Madrid']."),
    score: zod_1.default.string().optional().describe("Score of the match, e.g. '2-1'."),
    winner: zod_1.default
        .string()
        .optional()
        .describe("Winner of the match, e.g. 'Barcelona'."),
    videoUrl: zod_1.default
        .string()
        .url()
        .optional()
        .describe("URL of the video, e.g. 'https://example.com/video/123'."),
    description: zod_1.default.string().optional().describe("Description of the video."),
    tags: zod_1.default
        .record(zod_1.default.any())
        .optional()
        .describe("Tags associated with the video."),
    matchDate: zod_1.default
        .string()
        .datetime()
        .optional()
        .describe("Date of the match, e.g. '2022-01-01T00:00:00Z'."),
    venue: zod_1.default.string().optional().describe("Venue of the match, e.g. 'Camp Nou'."),
    league: zod_1.default
        .string()
        .optional()
        .describe("League of the match, e.g. 'La Liga'."),
    season: zod_1.default.string().optional().describe("Season of the match, e.g. '2022'."),
});
const SearchFiltersSchema = zod_1.default.object({
    gameType: zod_1.default
        .string()
        .optional()
        .describe("Filter by game type, e.g. 'football', 'basketball'."),
    teams: zod_1.default
        .union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())])
        .optional()
        .describe("Filter by team name(s) e.g. 'Celtics', ['Celtics', 'Knicks']."),
    league: zod_1.default
        .string()
        .optional()
        .describe("Filter by league name, e.g. 'NBA', 'Premier League'."),
    season: zod_1.default
        .string()
        .optional()
        .describe("Filter by season, e.g. '2021', '2022'."),
    winner: zod_1.default
        .string()
        .optional()
        .describe("Filter by winner team name, e.g. 'Arsenal'."),
    venue: zod_1.default
        .string()
        .optional()
        .describe("Filter by venue name, e.g. 'Wembley Stadium'."),
    tags: zod_1.default
        .record(zod_1.default.any())
        .optional()
        .describe("Filter by tags., e.g. { 'highlight': true, 'full_match': false }."),
    matchDateStart: zod_1.default
        .string()
        .datetime()
        .optional()
        .describe("Filter by match start date, e.g. '2022-01-01T00:00:00Z'."),
    matchDateEnd: zod_1.default
        .string()
        .datetime()
        .optional()
        .describe("Filter by match end date, e.g. '2022-12-31T23:59:59Z'."),
});
const SearchQuerySchema = zod_1.default.object({
    limit: zod_1.default
        .number()
        .int()
        .positive()
        .optional()
        .describe("Maximum number of results to return."),
    offset: zod_1.default
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Number of results to skip before starting to return results."),
    orderBy: zod_1.default
        .string()
        .optional()
        .describe("Field to order results by, e.g. 'matchDate', 'title'."),
    orderDirection: zod_1.default
        .enum(["asc", "desc"])
        .optional()
        .describe("Direction to order results, either 'asc' for ascending or 'desc' for descending."),
    select: zod_1.default
        .array(zod_1.default.string())
        .optional()
        .describe("Fields to select in the results, e.g. ['title', 'gameType', 'teams']."),
});
class Server {
    _server;
    _db;
    constructor(db) {
        if (!db) {
            throw new Error("DatabaseManager instance is required.");
        }
        this._db = db;
        this._server = new mcp_js_1.McpServer({
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
    registerTools() {
        this._server.tool("list_unique_game_types", "Lists all unique game types in the video library (e.g. 'football', 'basketball').", {}, async () => {
            const result = await VideoMetadataDao_1.videoMetadataDao.getUniqueGameTypes(this._db);
            return {
                content: [
                    {
                        type: "text",
                        text: result.join(", "),
                    },
                ],
            };
        });
        this._server.tool("list_unique_leagues", "Lists all unique leagues in the video library (e.g. 'NBA', 'Premier League').", {}, async () => {
            const result = await VideoMetadataDao_1.videoMetadataDao.getUniqueLeagues(this._db);
            return {
                content: [
                    {
                        type: "text",
                        text: result.join(", "),
                    },
                ],
            };
        });
        this._server.tool("list_unique_seasons", "Lists all unique seasons in the video library (e.g. '2021', '2022').", {}, async () => {
            const result = await VideoMetadataDao_1.videoMetadataDao.getUniqueSeasons(this._db);
            return {
                content: [
                    {
                        type: "text",
                        text: result.join(", "),
                    },
                ],
            };
        });
        this._server.tool("search_videos", "Searches for videos based on various filters, e.g. 'football', 'Barcelona vs Real Madrid'.", {
            term: zod_1.default
                .string()
                .describe("Search term to filter videos, e.g 'barcelona'."),
            gameType: zod_1.default
                .string()
                .optional()
                .describe("Filter by game type, e.g. 'football', 'basketball'."),
            teams: zod_1.default
                .union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())])
                .optional()
                .describe("Filter by team name(s) e.g. 'Celtics', ['Celtics', 'Knicks']."),
            league: zod_1.default
                .string()
                .optional()
                .describe("Filter by league name, e.g. 'NBA', 'Premier League'."),
            season: zod_1.default
                .string()
                .optional()
                .describe("Filter by season, e.g. '2021', '2022'."),
            winner: zod_1.default
                .string()
                .optional()
                .describe("Filter by winner team name, e.g. 'Arsenal'."),
            venue: zod_1.default
                .string()
                .optional()
                .describe("Filter by venue name, e.g. 'Wembley Stadium'."),
            tags: zod_1.default
                .record(zod_1.default.any())
                .optional()
                .describe("Filter by tags., e.g. { 'highlight': true, 'full_match': false }."),
            matchDateStart: zod_1.default
                .string()
                .datetime()
                .optional()
                .describe("Filter by match start date, e.g. '2022-01-01T00:00:00Z'."),
            matchDateEnd: zod_1.default
                .string()
                .datetime()
                .optional()
                .describe("Filter by match end date, e.g. '2022-12-31T23:59:59Z'."),
            limit: zod_1.default
                .number()
                .int()
                .positive()
                .optional()
                .describe("Maximum number of results to return."),
            offset: zod_1.default
                .number()
                .int()
                .min(0)
                .optional()
                .describe("Number of results to skip before starting to return results."),
            orderBy: zod_1.default
                .string()
                .optional()
                .describe("Field to order results by, e.g. 'matchDate', 'title'."),
            orderDirection: zod_1.default
                .enum(["asc", "desc"])
                .optional()
                .describe("Direction to order results, either 'asc' for ascending or 'desc' for descending."),
            select: zod_1.default
                .array(zod_1.default.string())
                .optional()
                .describe("Fields to select in the results, e.g. ['title', 'gameType', 'teams']."),
        }, async (request) => {
            console.log("Search term:", request.term);
            const validatedFilters = SearchFiltersSchema.parse(request);
            const filter = {
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
            const validatedQuery = SearchQuerySchema.parse(request);
            const queryOpts = {
                ...validatedQuery,
            };
            const result = await VideoMetadataDao_1.videoMetadataDao.searchVideoMetadata(this._db, request.term, filter, queryOpts);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null),
                    },
                ],
            };
        });
        this._server.tool("get_video_metadata_by_filters", "Retrieves video metadata based on the provided filters.", {
            gameType: zod_1.default
                .string()
                .optional()
                .describe("Filter by game type, e.g. 'football', 'basketball'."),
            teams: zod_1.default
                .union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())])
                .optional()
                .describe("Filter by team name(s) e.g. 'Celtics', ['Celtics', 'Knicks']."),
            league: zod_1.default
                .string()
                .optional()
                .describe("Filter by league name, e.g. 'NBA', 'Premier League'."),
            season: zod_1.default
                .string()
                .optional()
                .describe("Filter by season, e.g. '2021', '2022'."),
            winner: zod_1.default
                .string()
                .optional()
                .describe("Filter by winner team name, e.g. 'Arsenal'."),
            venue: zod_1.default
                .string()
                .optional()
                .describe("Filter by venue name, e.g. 'Wembley Stadium'."),
            tags: zod_1.default
                .record(zod_1.default.any())
                .optional()
                .describe("Filter by tags., e.g. { 'highlight': true, 'full_match': false }."),
            matchDateStart: zod_1.default
                .string()
                .datetime()
                .optional()
                .describe("Filter by match start date, e.g. '2022-01-01T00:00:00Z'."),
            matchDateEnd: zod_1.default
                .string()
                .datetime()
                .optional()
                .describe("Filter by match end date, e.g. '2022-12-31T23:59:59Z'."),
            limit: zod_1.default
                .number()
                .int()
                .positive()
                .optional()
                .describe("Maximum number of results to return."),
            offset: zod_1.default
                .number()
                .int()
                .min(0)
                .optional()
                .describe("Number of results to skip before starting to return results."),
            orderBy: zod_1.default
                .string()
                .optional()
                .describe("Field to order results by, e.g. 'matchDate', 'title'."),
            orderDirection: zod_1.default
                .enum(["asc", "desc"])
                .optional()
                .describe("Direction to order results, either 'asc' for ascending or 'desc' for descending."),
            select: zod_1.default
                .array(zod_1.default.string())
                .optional()
                .describe("Fields to select in the results, e.g. ['title', 'gameType', 'teams']."),
        }, async (request) => {
            const validatedFilters = SearchFiltersSchema.parse(request);
            const filter = {
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
            const validatedQuery = SearchQuerySchema.parse(request);
            const queryOpts = {
                ...validatedQuery,
            };
            const result = await VideoMetadataDao_1.videoMetadataDao.getVideoMetadataByFilters(this._db, filter, queryOpts);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null),
                    },
                ],
            };
        });
    }
    get server() {
        return this._server;
    }
}
exports.Server = Server;
