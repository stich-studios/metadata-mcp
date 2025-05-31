# Video Metadata MCP Server

A Model Context Protocol (MCP) server for managing video metadata with game information, teams, scores, and other sports-related data. This server uses PostgreSQL as the database backend.

## Features

- **CRUD Operations**: Create, read, update, and delete video metadata records
- **Advanced Search**: Filter videos by game type, teams, league, season, tags, and date ranges
- **PostgreSQL Integration**: Robust database with JSONB support for flexible data storage
- **MCP Protocol**: Compatible with Claude Desktop and other MCP clients
- **Rich Metadata**: Support for game statistics, player data, venues, and more

## Database Schema

The server manages video metadata with the following fields:

- `id`: Unique identifier (auto-generated)
- `title`: Video title
- `game_type`: Type of game (e.g., "basketball", "football", "soccer")
- `teams`: Array of participating team names
- `score`: Final score as a string
- `duration_seconds`: Video duration in seconds
- `video_url`: URL to the video file
- `thumbnail_url`: URL to the thumbnail image
- `description`: Video description
- `tags`: Array of tags for categorization
- `player_stats`: JSON object containing player statistics
- `match_date`: Date when the match was played
- `venue`: Location where the match took place
- `league`: League or competition name
- `season`: Season identifier
- `created_at` / `updated_at`: Timestamps

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd metadata-mcp
   npm install
   ```

2. **Configure PostgreSQL:**
   - Ensure PostgreSQL is running
   - Create a database named `video_metadata` (or use your preferred name)
   - Copy `.env.example` to `.env` and update the database credentials:
   ```bash
   cp .env.example .env
   ```

3. **Update environment variables in `.env`:**
   ```env
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=video_metadata
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Initialize the database with sample data:**
   ```bash
   npm run setup
   ```

## Usage

### Running the MCP Server

```bash
npm start
```

The server will run on stdio and can be connected to by MCP clients.

### Available Tools

The server provides the following tools:

#### 1. `list_video_metadata`
Get all video metadata records.

#### 2. `get_video_metadata`
Get a specific video metadata record by ID.
- **Parameters**: `id` (number)

#### 3. `search_video_metadata`
Search video metadata with filters.
- **Parameters**: 
  - `game_type` (string, optional)
  - `teams` (array of strings, optional)
  - `league` (string, optional)
  - `season` (string, optional)
  - `tags` (array of strings, optional)
  - `match_date_from` (ISO date string, optional)
  - `match_date_to` (ISO date string, optional)

#### 4. `create_video_metadata`
Create a new video metadata record.
- **Required Parameters**: `title`, `game_type`, `teams`
- **Optional Parameters**: All other fields

#### 5. `update_video_metadata`
Update an existing video metadata record.
- **Required Parameters**: `id`
- **Optional Parameters**: Any field to update

#### 6. `delete_video_metadata`
Delete a video metadata record.
- **Parameters**: `id` (number)

#### 7. `get_game_types`
Get all unique game types from the database.

#### 8. `get_teams`
Get all unique teams from the database.

#### 9. `get_leagues`
Get all unique leagues from the database.

### Example Usage with Claude Desktop

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "video-metadata": {
      "command": "node",
      "args": ["/path/to/metadata-mcp/build/index.js"],
      "env": {
        "POSTGRES_USER": "your_username",
        "POSTGRES_PASSWORD": "your_password",
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DB": "video_metadata"
      }
    }
  }
}
```

## Sample Data

The setup script includes sample data for:
- NBA Finals Game 7 (Lakers vs Celtics)
- Super Bowl LVIII (Chiefs vs 49ers)
- Champions League Final (Real Madrid vs Liverpool)

## Development

### Project Structure

```
src/
├── index.ts        # Main MCP server implementation
├── database.ts     # Database manager and schema
└── setup.ts        # Database initialization script

build/              # Compiled JavaScript files
tsconfig.json       # TypeScript configuration
package.json        # Dependencies and scripts
.env.example        # Environment variables template
```

### Building

```bash
npm run build
```

### Adding New Features

1. Extend the `VideoMetadata` interface in `database.ts`
2. Add corresponding database schema changes in `initializeSchema()`
3. Implement new tools in the MCP server (`index.ts`)
4. Add validation schemas using Zod

## Database Indexes

The following indexes are automatically created for optimal performance:

- `idx_video_metadata_game_type`: On game_type field
- `idx_video_metadata_teams`: GIN index on teams JSONB array
- `idx_video_metadata_tags`: GIN index on tags JSONB array
- `idx_video_metadata_match_date`: On match_date field
- `idx_video_metadata_league`: On league field

## Error Handling

The server includes comprehensive error handling:
- Database connection errors
- Invalid parameter validation (using Zod schemas)
- Resource not found errors
- Proper MCP error codes and messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
