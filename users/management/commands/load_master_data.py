from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Load master data - create admin user'

    def handle(self, *args, **options):
        self.stdout.write('Loading master data...')
        
        try:
            with transaction.atomic():
                # Create admin user
                admin_user, created = User.objects.get_or_create(
                    username='admin',
                    defaults={
                        'email': 'tchophel999@gmail.com',
                        'first_name': 'Tshering',
                        'last_name': 'Chophel',
                        'is_staff': True,
                        'is_superuser': True,
                        'is_paid': True,
                        'notified': True,
                        'phone': '+97512345678',
                        'total_points': 0,
                    }
                )
                
                if created:
                    admin_user.set_password('admin123')
                    admin_user.save()
                    self.stdout.write(
                        self.style.SUCCESS('✅ Admin user created successfully!')
                    )
                    self.stdout.write('📋 Admin Details:')
                    self.stdout.write(f'   Username: admin')
                    self.stdout.write(f'   Email: admin@prediction.com')
                    self.stdout.write(f'   Password: admin123')
                    self.stdout.write(f'   Role: Super Admin')
                else:
                    self.stdout.write(
                        self.style.WARNING('⚠️  Admin user already exists')
                    )
                    self.stdout.write('📋 Existing Admin Details:')
                    self.stdout.write(f'   Username: {admin_user.username}')
                    self.stdout.write(f'   Email: {admin_user.email}')
                    self.stdout.write(f'   Role: {"Super Admin" if admin_user.is_superuser else "Admin"}')
                
                # Update admin password if needed
                if not admin_user.check_password('admin123'):
                    admin_user.set_password('admin123')
                    admin_user.save()
                    self.stdout.write(
                        self.style.SUCCESS('🔐 Admin password updated to: admin123')
                    )
                
                self.stdout.write(
                    self.style.SUCCESS('🎉 Master data loaded successfully!')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error loading master data: {str(e)}')
            )
            raise
