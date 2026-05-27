import requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser


API_KEY_NOT_CONFIGURED = 'WC2026_API_KEY not configured'

FLAG_BASE_URL = 'https://media.api-sports.io/flags'

FIFA_TO_ISO2 = {
    'ALG': 'dz', 'ARG': 'ar', 'AUS': 'au', 'AUT': 'at', 'BEL': 'be', 'BIH': 'ba',
    'BRA': 'br', 'CAN': 'ca', 'CHI': 'cl', 'CIV': 'ci', 'COD': 'cd', 'COL': 'co',
    'CPV': 'cv', 'CRC': 'cr', 'CRO': 'hr', 'CUW': 'cw', 'CZE': 'cz', 'DEN': 'dk',
    'ECU': 'ec', 'EGY': 'eg', 'ENG': 'gb', 'ESP': 'es', 'FIN': 'fi', 'FRA': 'fr',
    'GER': 'de', 'GHA': 'gh', 'GRE': 'gr', 'HAI': 'ht', 'HON': 'hn', 'HUN': 'hu',
    'IRN': 'ir', 'IRQ': 'iq', 'ISL': 'is', 'ISR': 'il', 'ITA': 'it', 'JAM': 'jm',
    'JOR': 'jo', 'JPN': 'jp', 'KOR': 'kr', 'KSA': 'sa', 'MAR': 'ma', 'MEX': 'mx',
    'NED': 'nl', 'NGA': 'ng', 'NIR': 'gb', 'NOR': 'no', 'NZL': 'nz', 'PAN': 'pa',
    'PAR': 'py', 'PER': 'pe', 'POL': 'pl', 'POR': 'pt', 'QAT': 'qa', 'ROU': 'ro',
    'RSA': 'za', 'SCO': 'gb', 'SEN': 'sn', 'SLO': 'si', 'SRB': 'rs', 'SUI': 'ch',
    'SVK': 'sk', 'SWE': 'se', 'TUN': 'tn', 'TUR': 'tr', 'UKR': 'ua', 'URU': 'uy',
    'USA': 'us', 'UZB': 'uz', 'VEN': 've', 'WAL': 'gb',
}


def _flag_url(code):
    if not code:
        return ''
    iso2 = FIFA_TO_ISO2.get(code.upper())
    return f'{FLAG_BASE_URL}/{iso2}.svg' if iso2 else ''


def _wc2026_headers():
    api_key = getattr(settings, 'WC2026_API_KEY', '')
    return {
        'accept': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }


def _wc2026_url(path):
    base = getattr(settings, 'WC2026_API_URL', 'https://api.wc2026api.com')
    return f'{base.rstrip("/")}/{path.lstrip("/")}'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worldcup_teams(request):
    """Fetch World Cup 2026 teams from wc2026api.com"""
    api_key = getattr(settings, 'WC2026_API_KEY', '')
    if not api_key:
        return JsonResponse({'error': API_KEY_NOT_CONFIGURED}, status=500)

    try:
        response = requests.get(_wc2026_url('/teams'), headers=_wc2026_headers(), timeout=10)
        response.raise_for_status()
        data = response.json()

        teams = []
        for team in (data if isinstance(data, list) else data.get('teams', [])):
            code = team.get('code') or team.get('tla') or team.get('country_code')
            teams.append({
                'id':   team.get('id'),
                'name': team.get('name') or team.get('country'),
                'code': code,
                'flag': team.get('flag') or team.get('flag_url') or team.get('crest') or _flag_url(code),
                'group': team.get('group') or team.get('group_name'),
            })

        return JsonResponse({'success': True, 'teams': teams, 'count': len(teams)})

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': 'Failed to fetch teams', 'message': str(e)}, status=502)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worldcup_matches(request):
    """Fetch World Cup 2026 matches from wc2026api.com"""
    api_key = getattr(settings, 'WC2026_API_KEY', '')
    if not api_key:
        return JsonResponse({'error': API_KEY_NOT_CONFIGURED}, status=500)

    try:
        response = requests.get(_wc2026_url('/matches'), headers=_wc2026_headers(), timeout=10)
        response.raise_for_status()
        data = response.json()

        matches = data if isinstance(data, list) else data.get('matches', [])
        return JsonResponse({'success': True, 'matches': matches, 'count': len(matches)})

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': 'Failed to fetch matches', 'message': str(e)}, status=502)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_teams_to_db(request):
    """Import WC2026 teams from the API into the local database"""
    from .models import Team

    api_key = getattr(settings, 'WC2026_API_KEY', '')
    if not api_key:
        return JsonResponse({'error': API_KEY_NOT_CONFIGURED}, status=500)

    try:
        response = requests.get(_wc2026_url('/teams'), headers=_wc2026_headers(), timeout=10)
        response.raise_for_status()
        data = response.json()
        raw_teams = data if isinstance(data, list) else data.get('teams', [])

        created, updated = 0, 0
        for team in raw_teams:
            code = (team.get('code') or team.get('tla') or team.get('country_code') or '')[:3].upper()
            name = team.get('name') or team.get('country') or code
            flag = team.get('flag') or team.get('flag_url') or team.get('crest') or _flag_url(code)

            if not code:
                continue

            _, was_created = Team.objects.update_or_create(
                country_code=code,
                defaults={'name': name, 'flag': flag},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return JsonResponse({'success': True, 'created': created, 'updated': updated})

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': 'Failed to import teams', 'message': str(e)}, status=502)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_matches_to_db(request):
    """Import WC2026 matches from the API into the local database."""
    from .services import fetch_worldcup_matches, sync_worldcup_matches

    api_key = getattr(settings, 'WC2026_API_KEY', '')
    if not api_key:
        return JsonResponse({'error': API_KEY_NOT_CONFIGURED}, status=500)

    try:
        raw_matches = fetch_worldcup_matches()
        created, updated, skipped = sync_worldcup_matches(raw_matches)
        return JsonResponse({
            'success': True,
            'created': created,
            'updated': updated,
            'skipped': skipped,
            'total_in_db': created + updated,
        })

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': 'Failed to import matches', 'message': str(e)}, status=502)
