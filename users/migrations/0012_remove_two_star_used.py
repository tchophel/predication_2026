# Generated manually to fix database inconsistency

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0011_remove_two_star_powerups'),
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE auth_user DROP COLUMN IF EXISTS two_star_used;",
            reverse_sql=migrations.RunSQL.noop
        ),
    ]
