from django.conf import settings
from django.http import JsonResponse
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def worldcup_teams(request):
    """
    Fetch World Cup teams from football-data.org API
    """
    try:
        api_url = getattr(settings, 'FOOTBALL_DATA_API_URL', 'https://api.football-data.org/v4')
        api_key = getattr(settings, 'FOOTBALL_DATA_API_KEY', None)
        
        if not api_key:
            return JsonResponse({
                'error': 'Football Data API key not configured',
                'message': 'Please add FOOTBALL_DATA_API_KEY to your .env file'
            }, status=500)
        
        # Fetch Euro 2024 teams (as World Cup 2026 might not be available yet)
        # You can change the competition ID as needed
        competition_id = '2004'  # Euro 2024
        url = f"{api_url}/competitions/{competition_id}/teams"
        
        headers = {
            'X-Auth-Token': api_key
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Transform the data to match our expected format
        teams = []
        for team in data.get('teams', []):
            teams.append({
                'name': team.get('name', 'Unknown Team'),
                'country': team.get('name', 'Unknown'),  # football-data uses name as country
                'badge': team.get('crest', None),
                'id': team.get('id'),
                'shortName': team.get('shortName'),
                'tla': team.get('tla')  # Three-letter abbreviation
            })
        
        return JsonResponse({
            'success': True,
            'teams': teams,
            'competition': data.get('competition', {}),
            'count': len(teams)
        })
        
    except requests.exceptions.RequestException as e:
        return JsonResponse({
            'error': 'Failed to fetch data from football-data.org',
            'message': str(e)
        }, status=500)
    except Exception as e:
        return JsonResponse({
            'error': 'Internal server error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def worldcup_matches(request):
    """
    Fetch World Cup matches from football-data.org API
    """
    try:
        api_url = getattr(settings, 'FOOTBALL_DATA_API_URL', 'https://api.football-data.org/v4')
        api_key = getattr(settings, 'FOOTBALL_DATA_API_KEY', None)
        
        if not api_key:
            return JsonResponse({
                'error': 'Football Data API key not configured'
            }, status=500)
        
        competition_id = '2004'  # Euro 2024
        url = f"{api_url}/competitions/{competition_id}/matches"
        
        headers = {
            'X-Auth-Token': api_key
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        return JsonResponse({
            'success': True,
            'matches': data.get('matches', []),
            'competition': data.get('competition', {}),
            'count': len(data.get('matches', []))
        })
        
    except requests.exceptions.RequestException as e:
        return JsonResponse({
            'error': 'Failed to fetch data from football-data.org',
            'message': str(e)
        }, status=500)
    except Exception as e:
        return JsonResponse({
            'error': 'Internal server error',
            'message': str(e)
        }, status=500)
