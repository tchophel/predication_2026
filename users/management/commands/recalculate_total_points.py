from django.core.management.base import BaseCommand
from django.db.models import Sum
from users.models import User
from predictions.models import Prediction


class Command(BaseCommand):
    help = 'Recalculate total_points for all users based on their predictions'

    def handle(self, *args, **options):
        users = User.objects.all()
        updated_count = 0
        
        for user in users:
            # Calculate actual total from predictions
            actual_total = Prediction.objects.filter(
                user=user,
                points_awarded__isnull=False
            ).aggregate(total=Sum('points_awarded'))['total'] or 0
            
            # Update if different
            if user.total_points != actual_total:
                old_total = user.total_points
                user.total_points = actual_total
                user.save()
                updated_count += 1
                self.stdout.write(
                    f'Updated {user.username}: {old_total} -> {actual_total} points'
                )
            else:
                self.stdout.write(
                    f'{self.style.SUCCESS("OK")} {user.username}: {actual_total} points'
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} users'
            )
        )
