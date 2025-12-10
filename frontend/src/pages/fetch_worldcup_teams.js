/*
Fetch World Cup participants using football-data.org API
API: https://www.football-data.org/v4/
Docs: https://www.football-data.org/documentation

Usage:
  node fetch_worldcup_teams.js              # defaults to Euro 2024
  node fetch_worldcup_teams.js 2004        # specify competition ID

What it does:
- Queries football-data.org API for competition teams
- Prints team information with names, countries, and crests

Environment:
- Requires FOOTBALL_DATA_API_KEY in .env file
*/

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    });
    
    return envVars;
  }
  return {};
}

const env = loadEnv();
const API_KEY = env.FOOTBALL_DATA_API_KEY || '6afd2c090a1a4454942d3570d86220e7';
const API_URL = env.FOOTBALL_DATA_API_URL || 'https://api.football-data.org/v4';

// Competition IDs (Euro 2024 = 2004, World Cup 2022 = 2018)
const competitionId = process.argv[2] || '2004'; // Default to Euro 2024

const url = `${API_URL}/competitions/${competitionId}/teams`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'X-Auth-Token': API_KEY
    };
    
    const options = {
      headers: headers
    };
    
    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}. Raw: ${data.slice(0, 200)}...`));
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

(async () => {
  try {
    console.log(`Fetching teams for competition ${competitionId} from football-data.org...`);
    console.log(`API URL: ${url}`);
    
    const json = await fetchJson(url);

    if (!json.teams || !Array.isArray(json.teams)) {
      console.error('No teams found. This could be due to an invalid competition ID or API key.');
      process.exitCode = 1;
      return;
    }

    const teams = json.teams;
    const competition = json.competition || {};

    console.log(`\n=== ${competition.name || 'Competition'} Teams ===`);
    console.log(`Found ${teams.length} teams\n`);

    // Display teams with detailed information
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name}`);
      console.log(`   Country: ${team.name}`);
      console.log(`   Short Name: ${team.shortName || 'N/A'}`);
      console.log(`   TLA: ${team.tla || 'N/A'}`);
      console.log(`   Crest: ${team.crest || 'N/A'}`);
      console.log(`   ID: ${team.id}`);
      console.log('');
    });

    // Summary by country
    const countries = teams.map(team => team.name).sort();
    console.log('\n=== Countries ===');
    countries.forEach((country, index) => {
      console.log(`${index + 1}. ${country}`);
    });

    console.log(`\nDone. Found ${teams.length} teams total.`);
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.message.includes('401')) {
      console.error('This might be due to an invalid API key. Check your FOOTBALL_DATA_API_KEY in .env');
    } else if (err.message.includes('404')) {
      console.error('This might be due to an invalid competition ID. Try 2004 for Euro 2024 or 2018 for World Cup 2022');
    }
    process.exitCode = 1;
  }
})();
