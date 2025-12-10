from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('users/', views.list_users, name='list_users'),
    path('users/create/', views.create_user, name='create_user'),
    path('users/<int:user_id>/', views.update_user, name='update_user'),
    path('users/<int:user_id>/toggle-payment/', views.toggle_payment_status, name='toggle_payment_status'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),
    path('users/<int:user_id>/mark-paid/', views.mark_user_paid, name='mark_user_paid'),
    path('test-email/', views.test_email, name='test_email'),
    path('matches/', views.create_match, name='create_match'),
    path('matches/<int:match_id>/finish/', views.finish_match, name='finish_match'),
    path('tournaments/', views.create_tournament, name='create_tournament'),
    path('groups/', views.create_group, name='create_group'),
    path('tournaments-groups/', views.get_tournaments_and_groups, name='get_tournaments_and_groups'),
    path('teams/', views.get_teams, name='get_teams'),
    path('teams/create/', views.create_team, name='create_team'),
    path('matches-with-group/', views.create_match_with_group, name='create_match_with_group'),
    path('export/leaderboard/', views.export_leaderboard, name='export_leaderboard'),
    path('export/predictions/', views.export_predictions, name='export_predictions'),
    path('two-star-config/', views.two_star_config, name='two_star_config'),
    path('bulk-import-matches/', views.bulk_import_matches, name='bulk_import_matches'),
]
