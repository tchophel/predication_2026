import requests
from django.core.management.base import BaseCommand

from matches.services import fetch_worldcup_matches, sync_worldcup_matches


class Command(BaseCommand):
    help = 'Import World Cup 2026 matches from the WC2026 API into the local database'

    def handle(self, *args, **options):
        self.stdout.write('Fetching World Cup 2026 matches from the API...')
        try:
            raw_matches = fetch_worldcup_matches()
        except requests.exceptions.RequestException as e:
            self.stderr.write(self.style.ERROR(f'Failed to fetch matches: {e}'))
            return

        created, updated, skipped = sync_worldcup_matches(raw_matches)
        self.stdout.write(self.style.SUCCESS(
            f'Import complete - created: {created}, updated: {updated}, skipped: {skipped}'
        ))
