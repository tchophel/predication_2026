import csv
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from matches.models import Tournament, Team, Match


class Command(BaseCommand):
    help = 'Import matches from CSV file'
    
    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to CSV file')
        parser.add_argument('--dry-run', action='store_true', help='Run without making changes')
    
    def handle(self, *args, **options):
        file_path = options['file_path']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        try:
            created_count, skipped_count, errors = self._process_csv_file(file_path, dry_run)
            self._print_summary(created_count, skipped_count, errors, dry_run)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing file: {str(e)}'))
    
    def _process_csv_file(self, file_path, dry_run):
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            created_count = 0
            skipped_count = 0
            errors = []
            
            with transaction.atomic():
                for row_num, row in enumerate(reader, 2):
                    try:
                        result = self._process_row(row, row_num, dry_run)
                        if result == 'created':
                            created_count += 1
                        elif result == 'skipped':
                            skipped_count += 1
                    except Exception as e:
                        errors.append(f'Row {row_num}: {str(e)}')
                        self.stdout.write(self.style.ERROR(f'Row {row_num}: {str(e)}'))
            
            return created_count, skipped_count, errors
    
    def _process_row(self, row, row_num, dry_run):
        # Validate required fields
        required_fields = ['team_a', 'team_b', 'start_time', 'tournament', 'year']
        for field in required_fields:
            if not row.get(field):
                raise ValueError(f"Missing required field: {field}")
        
        # Create or get teams
        team_a, _ = Team.objects.get_or_create(name=row['team_a'].strip())
        team_b, _ = Team.objects.get_or_create(name=row['team_b'].strip())
        
        # Create or get tournament
        tournament, _ = Tournament.objects.get_or_create(
            name=row['tournament'].strip(),
            year=int(row['year'])
        )
        
        # Parse start time
        start_time = timezone.datetime.strptime(
            row['start_time'], 
            '%Y-%m-%d %H:%M:%S'
        )
        start_time = timezone.make_aware(start_time)
        
        # Check if match already exists
        if Match.objects.filter(
            team_a=team_a, 
            team_b=team_b, 
            start_time=start_time
        ).exists():
            self.stdout.write(f"Row {row_num}: Match already exists, skipping")
            return 'skipped'
        
        if not dry_run:
            Match.objects.create(
                team_a=team_a,
                team_b=team_b,
                start_time=start_time,
                tournament=tournament,
                venue=row.get('venue', '').strip(),
                match_day=int(row.get('match_day', 1))
            )
        else:
            self.stdout.write(
                f"Row {row_num}: Would create match {team_a.name} vs {team_b.name}"
            )
        
        return 'created'
    
    def _print_summary(self, created_count, skipped_count, errors, dry_run):
        self.stdout.write('\n' + '='*50)
        self.stdout.write('IMPORT SUMMARY')
        self.stdout.write('='*50)
        self.stdout.write(f'{"Mode: DRY RUN" if dry_run else "Mode: LIVE"}')
        self.stdout.write(f'Matches created: {created_count}')
        self.stdout.write(f'Matches skipped: {skipped_count}')
        self.stdout.write(f'Errors: {len(errors)}')
        
        if errors:
            self.stdout.write('\nERRORS:')
            for error in errors:
                self.stdout.write(self.style.ERROR(error))
        
        if not dry_run and created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully imported {created_count} matches'
                )
            )
