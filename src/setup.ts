#!/usr/bin/env node

import { DatabaseManager } from './database.js';

async function setupDatabase() {
  const db = new DatabaseManager();
  
  try {
    console.log('Connecting to PostgreSQL...');
    await db.connect();
    
    console.log('Initializing database schema...');
    await db.initializeSchema();
    
    console.log('Inserting sample data...');
    
    // Sample video metadata
    const sampleData = [
      {
        title: "NBA Finals Game 7 - Lakers vs Celtics",
        game_type: "basketball",
        teams: ["Los Angeles Lakers", "Boston Celtics"],
        score: "Lakers: 110, Celtics: 107",
        duration_seconds: 8400,
        video_url: "https://example.com/videos/nba-finals-game7.mp4",
        thumbnail_url: "https://example.com/thumbnails/nba-finals-game7.jpg",
        description: "Thrilling Game 7 of the NBA Finals with overtime finish",
        tags: ["playoffs", "finals", "overtime", "championship"],
        player_stats: {
          "LeBron James": { points: 32, rebounds: 12, assists: 8 },
          "Jayson Tatum": { points: 28, rebounds: 9, assists: 6 }
        },
        match_date: new Date('2024-06-18'),
        venue: "TD Garden",
        league: "NBA",
        season: "2023-24"
      },
      {
        title: "Super Bowl LVIII - Chiefs vs 49ers",
        game_type: "football",
        teams: ["Kansas City Chiefs", "San Francisco 49ers"],
        score: "Chiefs: 25, 49ers: 22",
        duration_seconds: 12600,
        video_url: "https://example.com/videos/super-bowl-58.mp4",
        thumbnail_url: "https://example.com/thumbnails/super-bowl-58.jpg",
        description: "Overtime thriller in Las Vegas",
        tags: ["superbowl", "championship", "overtime", "playoffs"],
        player_stats: {
          "Patrick Mahomes": { passing_yards: 333, touchdowns: 2, interceptions: 0 },
          "Brock Purdy": { passing_yards: 255, touchdowns: 1, interceptions: 1 }
        },
        match_date: new Date('2024-02-11'),
        venue: "Allegiant Stadium",
        league: "NFL",
        season: "2023"
      },
      {
        title: "Champions League Final - Real Madrid vs Liverpool",
        game_type: "soccer",
        teams: ["Real Madrid", "Liverpool"],
        score: "Real Madrid: 1, Liverpool: 0",
        duration_seconds: 6300,
        video_url: "https://example.com/videos/champions-league-final.mp4",
        thumbnail_url: "https://example.com/thumbnails/champions-league-final.jpg",
        description: "Vinicius Jr. scores the winner in Paris",
        tags: ["champions-league", "final", "european-football"],
        player_stats: {
          "Vinicius Jr.": { goals: 1, assists: 0, shots: 3 },
          "Mohamed Salah": { goals: 0, assists: 0, shots: 4 }
        },
        match_date: new Date('2024-05-28'),
        venue: "Stade de France",
        league: "UEFA Champions League",
        season: "2023-24"
      }
    ];

    for (const data of sampleData) {
      await db.createVideoMetadata(data);
      console.log(`Created: ${data.title}`);
    }
    
    console.log('Database setup completed successfully!');
    
    // Display some statistics
    const gameTypes = await db.getGameTypes();
    const teams = await db.getTeams();
    const leagues = await db.getLeagues();
    
    console.log('\nDatabase Statistics:');
    console.log(`Game Types: ${gameTypes.join(', ')}`);
    console.log(`Teams: ${teams.slice(0, 5).join(', ')}${teams.length > 5 ? '...' : ''}`);
    console.log(`Leagues: ${leagues.join(', ')}`);
    
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

setupDatabase();
