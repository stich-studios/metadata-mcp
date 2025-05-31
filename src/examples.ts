#!/usr/bin/env node

/**
 * Example usage of the Video Metadata MCP Server
 * This file demonstrates how to interact with the MCP server programmatically
 */

import { DatabaseManager } from './database.js';

async function exampleUsage() {
  const db = new DatabaseManager();
  
  try {
    await db.connect();
    await db.initializeSchema();
    
    console.log('=== Video Metadata MCP Server Examples ===\n');
    
    // Example 1: Create a new video metadata record
    console.log('1. Creating a new video metadata record...');
    const newVideo = await db.createVideoMetadataWithValidation({
      title: "UEFA Euro 2024 Final - Spain vs England",
      game_type: "soccer",
      teams: ["Spain", "England"],
      score: "Spain: 2, England: 1",
      duration_seconds: 6600,
      video_url: "https://example.com/euro-2024-final.mp4",
      thumbnail_url: "https://example.com/euro-2024-final-thumb.jpg",
      description: "Thrilling Euro 2024 final with Spain claiming victory",
      tags: ["euro-2024", "final", "spain", "england", "championship"],
      player_stats: {
        "Mikel Oyarzabal": { goals: 1, assists: 0, minutes_played: 90 },
        "Nico Williams": { goals: 1, assists: 1, minutes_played: 85 },
        "Harry Kane": { goals: 1, assists: 0, minutes_played: 90 }
      },
      match_date: new Date('2024-07-14'),
      venue: "Olympiastadion Berlin",
      league: "UEFA European Championship",
      season: "2024"
    });
    console.log(`Created video: ${newVideo.title} (ID: ${newVideo.id})\n`);
    
    // Example 2: Search videos by team
    console.log('2. Searching for Spain videos...');
    const spainVideos = await db.searchVideoMetadata({
      teams: ["Spain"]
    });
    console.log(`Found ${spainVideos.length} videos featuring Spain\n`);
    
    // Example 3: Get paginated search results
    console.log('3. Getting paginated search results...');
    const paginatedResults = await db.searchVideoMetadataPaginated(
      { game_type: "soccer" },
      1, // page
      5  // page size
    );
    console.log(`Page 1 of soccer videos: ${paginatedResults.data.length} results`);
    console.log(`Total soccer videos: ${paginatedResults.total}`);
    console.log(`Has next page: ${paginatedResults.hasNext}\n`);
    
    // Example 4: Get team statistics
    console.log('4. Getting team statistics for Spain...');
    const teamStats = await db.getTeamVideos("Spain");
    console.log(`Spain team statistics:`);
    console.log(`- Total games: ${teamStats.stats.totalGames}`);
    console.log(`- Wins: ${teamStats.stats.wins}`);
    console.log(`- Losses: ${teamStats.stats.losses}`);
    console.log(`- Draws: ${teamStats.stats.draws}`);
    console.log(`- Average duration: ${Math.round(teamStats.stats.avgDuration)} seconds\n`);
    
    // Example 5: Get overall statistics
    console.log('5. Getting overall database statistics...');
    const stats = await db.getStatistics();
    console.log(`Database statistics:`);
    console.log(`- Total videos: ${stats.totalVideos}`);
    console.log(`- Game types: ${Object.keys(stats.gameTypes).join(', ')}`);
    console.log(`- Most popular game type: ${Object.entries(stats.gameTypes).sort((a, b) => b[1] - a[1])[0]?.[0]}`);
    console.log(`- Average duration: ${Math.round(stats.averageDuration)} seconds`);
    if (stats.dateRange.earliest && stats.dateRange.latest) {
      console.log(`- Date range: ${stats.dateRange.earliest.toDateString()} to ${stats.dateRange.latest.toDateString()}`);
    }
    console.log();
    
    // Example 6: Text search
    console.log('6. Searching videos by text...');
    const textSearchResults = await db.searchWithTextFilters({
      title: "final",
      minDuration: 3600, // At least 1 hour
      hasPlayerStats: true
    });
    console.log(`Found ${textSearchResults.length} videos with "final" in title, over 1 hour, with player stats\n`);
    
    // Example 7: Get recent videos
    console.log('7. Getting recent videos...');
    const recentVideos = await db.getRecentVideos(3);
    console.log(`Most recent videos:`);
    recentVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (${video.game_type}) - ${video.created_at.toDateString()}`);
    });
    console.log();
    
    // Example 8: Date range search
    console.log('8. Getting videos from 2024...');
    const videos2024 = await db.getVideosByDateRange(
      new Date('2024-01-01'),
      new Date('2024-12-31')
    );
    console.log(`Found ${videos2024.length} videos from 2024\n`);
    
    // Example 9: Get unique values
    console.log('9. Getting unique values...');
    const gameTypes = await db.getGameTypes();
    const teams = await db.getTeams();
    const leagues = await db.getLeagues();
    
    console.log(`Game types: ${gameTypes.join(', ')}`);
    console.log(`Teams (first 10): ${teams.slice(0, 10).join(', ')}${teams.length > 10 ? '...' : ''}`);
    console.log(`Leagues: ${leagues.join(', ')}\n`);
    
    // Example 10: Update a video
    console.log('10. Updating a video...');
    if (newVideo.id) {
      const updated = await db.updateVideoMetadata(newVideo.id, {
        description: "Updated description: Thrilling Euro 2024 final with Spain claiming victory in Berlin",
        tags: ["euro-2024", "final", "spain", "england", "championship", "berlin", "updated"]
      });
      console.log(`Updated video: ${updated?.title}\n`);
    }
    
    console.log('=== Examples completed successfully! ===');
    
  } catch (error) {
    console.error('Error in examples:', error);
  } finally {
    await db.close();
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };
