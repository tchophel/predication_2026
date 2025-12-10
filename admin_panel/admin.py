from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import User, PaymentLog
from matches.models import Match, Tournament, Team, Group
from predictions.models import Prediction, TwoStarConfig


# Extend the existing admin sites with custom admin functionality
class CustomAdminSite(admin.AdminSite):
    site_header = "Match Prediction Admin"
    site_title = "Match Prediction Admin Portal"
    index_title = "Welcome to Match Prediction Administration"


# Create a custom admin site for specialized admin functionality
custom_admin = CustomAdminSite(name='custom_admin')


# Register models with custom admin site
custom_admin.register(User, UserAdmin)
custom_admin.register(PaymentLog)
custom_admin.register(Match)
custom_admin.register(Tournament)
custom_admin.register(Team)
custom_admin.register(Group)
custom_admin.register(Prediction)
custom_admin.register(TwoStarConfig)
