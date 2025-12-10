from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create an admin user for the prediction system'
    
    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Admin username')
        parser.add_argument('--email', type=str, help='Admin email')
        parser.add_argument('--password', type=str, help='Admin password')
    
    def handle(self, *args, **options):
        UserModel = get_user_model()
        
        username = options.get('username') or input('Admin username: ')
        email = options.get('email') or input('Admin email: ')
        password = options.get('password') or input('Admin password: ')
        
        if UserModel.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.ERROR(f'User "{username}" already exists')
            )
            return
        
        UserModel.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Admin user "{username}" created successfully')
        )
