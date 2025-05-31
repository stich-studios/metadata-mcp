-- Sample data insertion script for Video Metadata MCP Server
-- Focused on Soccer and NBA only

-- Insert sample video metadata records
INSERT INTO video_metadata (
    title, 
    game_type, 
    teams, 
    score, 
    winner, 
    video_url, 
    description, 
    tags, 
    match_date, 
    venue, 
    league, 
    season
) VALUES 

-- NBA Games
(
    'Lakers vs Warriors - Regular Season Showdown',
    'basketball',
    '["Los Angeles Lakers", "Golden State Warriors"]',
    '118-112',
    'Los Angeles Lakers',
    'https://example.com/videos/lakers-warriors-2024-01-15',
    'Epic showdown between two Western Conference powerhouses featuring LeBron James and Stephen Curry.',
    '{"highlight": true, "overtime": false, "playoffs": false, "featured_players": ["LeBron James", "Stephen Curry"]}',
    '2024-01-15 20:00:00-08:00',
    'Crypto.com Arena',
    'NBA',
    '2023-24'
),

(
    'Celtics vs Heat - Conference Finals Game 7',
    'basketball',
    '["Boston Celtics", "Miami Heat"]',
    '104-103',
    'Boston Celtics',
    'https://example.com/videos/celtics-heat-game7-2024',
    'Thrilling Game 7 of the Eastern Conference Finals with clutch performances.',
    '{"highlight": true, "overtime": true, "playoffs": true, "game_7": true}',
    '2024-05-29 20:30:00-05:00',
    'TD Garden',
    'NBA',
    '2023-24'
),

(
    'Nuggets vs Suns - Full Game Replay',
    'basketball',
    '["Denver Nuggets", "Phoenix Suns"]',
    '127-109',
    'Denver Nuggets',
    'https://example.com/videos/nuggets-suns-full-game',
    'Complete game replay featuring Nikola Jokic triple-double performance.',
    '{"highlight": false, "full_game": true, "triple_double": true}',
    '2024-03-22 19:00:00-07:00',
    'Ball Arena',
    'NBA',
    '2023-24'
),

(
    'Bucks vs 76ers - Eastern Conference Rivalry',
    'basketball',
    '["Milwaukee Bucks", "Philadelphia 76ers"]',
    '115-108',
    'Milwaukee Bucks',
    'https://example.com/videos/bucks-76ers-rivalry',
    'Giannis dominates with 35 points as Bucks edge out 76ers in thriller.',
    '{"highlight": true, "dominant_performance": true, "rivalry": true}',
    '2024-02-14 20:00:00-06:00',
    'Fiserv Forum',
    'NBA',
    '2023-24'
),

(
    'Mavs vs Clippers - Western Conference Battle',
    'basketball',
    '["Dallas Mavericks", "LA Clippers"]',
    '122-119',
    'Dallas Mavericks',
    'https://example.com/videos/mavs-clippers-west-battle',
    'Luka Dončić drops 45 points in epic performance against Clippers.',
    '{"highlight": true, "45_point_game": true, "clutch_performance": true}',
    '2024-03-08 19:30:00-08:00',
    'American Airlines Center',
    'NBA',
    '2023-24'
),

-- Premier League Games
(
    'Manchester City vs Arsenal - Title Decider',
    'soccer',
    '["Manchester City", "Arsenal"]',
    '4-1',
    'Manchester City',
    'https://example.com/videos/city-arsenal-title-decider',
    'Manchester City clinches Premier League title with dominant performance against Arsenal.',
    '{"highlight": true, "title_deciding": true, "hat_trick": true}',
    '2024-05-12 16:30:00+01:00',
    'Etihad Stadium',
    'Premier League',
    '2023-24'
),

(
    'Liverpool vs Chelsea - Anfield Thriller',
    'soccer',
    '["Liverpool", "Chelsea"]',
    '2-1',
    'Liverpool',
    'https://example.com/videos/liverpool-chelsea-thriller',
    'Intense match with controversial VAR decisions and late winner at Anfield.',
    '{"highlight": true, "controversial": true, "late_winner": true, "var_drama": true}',
    '2024-04-14 17:30:00+01:00',
    'Anfield',
    'Premier League',
    '2023-24'
),

(
    'Manchester United vs Tottenham - Premier League Draw',
    'soccer',
    '["Manchester United", "Tottenham Hotspur"]',
    '2-2',
    NULL,
    'https://example.com/videos/mufc-tottenham-draw',
    'Entertaining draw with goals from both sides in a back-and-forth match.',
    '{"highlight": true, "draw": true, "comeback": true}',
    '2024-01-14 14:00:00+00:00',
    'Old Trafford',
    'Premier League',
    '2023-24'
),

-- La Liga Games
(
    'Real Madrid vs Barcelona - El Clasico',
    'soccer',
    '["Real Madrid", "Barcelona"]',
    '3-2',
    'Real Madrid',
    'https://example.com/videos/el-clasico-2024',
    'Classic El Clasico with 5 goals and incredible atmosphere at Santiago Bernabéu.',
    '{"highlight": true, "el_clasico": true, "high_scoring": true, "rivalry": true}',
    '2024-03-10 21:00:00+01:00',
    'Santiago Bernabéu',
    'La Liga',
    '2023-24'
),

(
    'Atletico Madrid vs Sevilla - Champions League Race',
    'soccer',
    '["Atletico Madrid", "Sevilla"]',
    '1-0',
    'Atletico Madrid',
    'https://example.com/videos/atletico-sevilla-ucl-race',
    'Crucial win for Atletico in the race for Champions League qualification.',
    '{"highlight": true, "champions_league_race": true, "defensive_masterclass": true}',
    '2024-04-28 21:00:00+02:00',
    'Wanda Metropolitano',
    'La Liga',
    '2023-24'
),

-- Champions League Games
(
    'PSG vs Bayern Munich - Champions League Semifinal',
    'soccer',
    '["Paris Saint-Germain", "Bayern Munich"]',
    '3-1',
    'Paris Saint-Germain',
    'https://example.com/videos/psg-bayern-ucl-semifinal',
    'Mbappe hat-trick sends PSG to Champions League final.',
    '{"highlight": true, "champions_league": true, "semifinal": true, "hat_trick": true}',
    '2024-05-07 21:00:00+02:00',
    'Parc des Princes',
    'UEFA Champions League',
    '2023-24'
),

(
    'Manchester City vs Inter Milan - Champions League Final',
    'soccer',
    '["Manchester City", "Inter Milan"]',
    '1-0',
    'Manchester City',
    'https://example.com/videos/city-inter-ucl-final',
    'Manchester City wins their first Champions League title with narrow victory.',
    '{"highlight": true, "champions_league": true, "final": true, "historic": true}',
    '2024-06-10 21:00:00+03:00',
    'Atatürk Olympic Stadium',
    'UEFA Champions League',
    '2023-24'
),

-- Serie A Games
(
    'Juventus vs AC Milan - Derby della Madonnina',
    'soccer',
    '["Juventus", "AC Milan"]',
    '2-1',
    'Juventus',
    'https://example.com/videos/juventus-milan-derby',
    'Classic Italian rivalry match with late drama at Allianz Stadium.',
    '{"highlight": true, "italian_derby": true, "late_drama": true, "rivalry": true}',
    '2024-02-18 20:45:00+01:00',
    'Allianz Stadium',
    'Serie A',
    '2023-24'
),

-- More NBA Games
(
    'Warriors vs Lakers - California Classic',
    'basketball',
    '["Golden State Warriors", "Los Angeles Lakers"]',
    '128-121',
    'Golden State Warriors',
    'https://example.com/videos/warriors-lakers-california',
    'Stephen Curry drops 40 points in Warriors victory over Lakers.',
    '{"highlight": true, "curry_40_points": true, "california_classic": true}',
    '2024-01-27 19:30:00-08:00',
    'Chase Center',
    'NBA',
    '2023-24'
),

(
    'Nets vs Knicks - New York Rivalry',
    'basketball',
    '["Brooklyn Nets", "New York Knicks"]',
    '112-108',
    'Brooklyn Nets',
    'https://example.com/videos/nets-knicks-nyc-rivalry',
    'Brooklyn edges out Knicks in heated New York City rivalry game.',
    '{"highlight": true, "nyc_rivalry": true, "heated_game": true}',
    '2024-04-02 19:30:00-05:00',
    'Madison Square Garden',
    'NBA',
    '2023-24'
),

-- Upcoming/Practice content
(
    'Upcoming: Lakers vs Celtics - Christmas Day Game',
    'basketball',
    '["Los Angeles Lakers", "Boston Celtics"]',
    NULL,
    NULL,
    NULL,
    'Traditional Christmas Day matchup between historic rivals.',
    '{"upcoming": true, "christmas_game": true, "rivalry": true}',
    '2024-12-25 17:00:00-08:00',
    'TD Garden',
    'NBA',
    '2024-25'
),

(
    'Barcelona Training Session - El Clasico Preparation',
    'soccer',
    '["Barcelona"]',
    NULL,
    NULL,
    'https://example.com/videos/barcelona-training',
    'Behind-the-scenes look at Barcelona preparing for El Clasico.',
    '{"training": true, "behind_scenes": true, "el_clasico_prep": true}',
    '2024-03-08 11:00:00+01:00',
    'Ciutat Esportiva Joan Gamper',
    'La Liga',
    '2023-24'
);

-- Display completion message
SELECT 'Sample data inserted successfully!' as status,
       COUNT(*) as total_records
FROM video_metadata;

-- Show summary by game type and league
SELECT 
    game_type,
    league,
    COUNT(*) as game_count,
    COUNT(CASE WHEN winner IS NOT NULL THEN 1 END) as games_with_winner
FROM video_metadata 
GROUP BY game_type, league
ORDER BY game_type, league;