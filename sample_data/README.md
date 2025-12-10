# Sample Data

This directory contains sample data files for testing and demonstration purposes.

## matches.csv

Sample matches file for bulk import functionality. Contains World Cup 2024 matches with:

- Team matchups
- Start times in UTC format
- Tournament information
- Venue details
- Match day grouping

### Usage

```bash
# Import sample matches (dry run first)
python manage.py import_matches sample_data/matches.csv --dry-run

# Actually import the matches
python manage.py import_matches sample_data/matches.csv
```

### Format

```csv
team_a,team_b,start_time,tournament,year,venue,match_day
Brazil,Argentina,2024-06-20 20:00:00,World Cup,2024,Maracana Stadium,1
```

**Required fields:**
- `team_a`: Name of first team
- `team_b`: Name of second team  
- `start_time`: Match start time in UTC (YYYY-MM-DD HH:MM:SS format)
- `tournament`: Tournament name
- `year`: Tournament year

**Optional fields:**
- `venue`: Match venue/location
- `match_day`: Match day number for grouping

### Notes

- Teams will be automatically created if they don't exist
- Tournaments will be automatically created if they don't exist
- Duplicate matches (same teams, same time) will be skipped
- All times should be in UTC
