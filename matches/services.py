"""Shared helpers for importing WC2026 data from the external API into the local DB."""
import requests
from django.conf import settings
from django.utils.dateparse import parse_datetime

from .models import Match

DEFAULT_API_URL = 'https://api.wc2026api.com'

# Maps the external API's status strings onto Match.STATUS_CHOICES.
_STATUS_MAP = {
    'scheduled': 'upcoming',
    'upcoming': 'upcoming',
    'timed': 'upcoming',
    'live': 'live',
    'in_play': 'live',
    'extra_time': 'extra_time',
    'finished': 'completed',
    'ft': 'completed',
    'completed': 'completed',
    'postponed': 'postponed',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
}


def _headers():
    return {
        'accept': 'application/json',
        'Authorization': f"Bearer {getattr(settings, 'WC2026_API_KEY', '')}",
    }


def _url(path):
    base = getattr(settings, 'WC2026_API_URL', DEFAULT_API_URL)
    return f"{base.rstrip('/')}/{path.lstrip('/')}"


def fetch_worldcup_matches(timeout=15):
    """Fetch the raw match list from the WC2026 API. Raises requests exceptions on failure."""
    response = requests.get(_url('/matches'), headers=_headers(), timeout=timeout)
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, list) else data.get('matches', [])


def _map_status(raw_status):
    return _STATUS_MAP.get(str(raw_status or '').strip().lower(), 'upcoming')


def _team_code(code, name):
    """Return a 3-char uppercase team code, falling back to the team name."""
    return (str(code or '') or str(name or '')[:3]).upper()[:3]


def sync_worldcup_matches(raw_matches):
    """Upsert raw WC2026 API match dicts into the Match table.

    Matches are keyed on (team_a_code, team_b_code, start_time) so re-running
    the import is idempotent. Knockout placeholders with no teams yet, and rows
    with an unparseable kickoff time, are skipped.

    Returns (created, updated, skipped).
    """
    created = updated = skipped = 0

    for raw in raw_matches:
        home_name = (raw.get('home_team') or '').strip()
        away_name = (raw.get('away_team') or '').strip()
        start_time = parse_datetime(raw.get('kickoff_utc') or '')

        if not home_name or not away_name or start_time is None:
            skipped += 1
            continue

        home_code = _team_code(raw.get('home_team_code'), home_name)
        away_code = _team_code(raw.get('away_team_code'), away_name)

        defaults = {
            'team_a_name': home_name,
            'team_b_name': away_name,
            'status': _map_status(raw.get('status')),
            'venue': (raw.get('stadium') or raw.get('stadium_city') or 'TBD').strip() or 'TBD',
            'tournament_name': 'FIFA World Cup',
            'tournament_year': 2026,
            'group': (raw.get('group_name') or '')[:20],
            'score_a': raw.get('home_score'),
            'score_b': raw.get('away_score'),
        }

        try:
            _, was_created = Match.objects.update_or_create(
                team_a_code=home_code,
                team_b_code=away_code,
                start_time=start_time,
                defaults=defaults,
            )
        except Exception:
            skipped += 1
            continue

        created += was_created
        updated += not was_created

    return created, updated, skipped
