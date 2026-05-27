from django.urls import path
from . import views
from . import views_worldcup

urlpatterns = [
    path('', views.match_list_create, name='match-list-create'),
    path('<int:pk>/', views.match_detail, name='match-detail'),
    path('<int:match_id>/my-prediction/', views.user_predictions_for_match, name='user-prediction-for-match'),
    path('tournaments/', views.TournamentListView.as_view(), name='tournament-list'),
    path('tournaments/<int:pk>/', views.TournamentDetailView.as_view(), name='tournament-detail'),
    path('groups/', views.GroupListView.as_view(), name='group-list'),
    path('teams/', views.TeamListView.as_view(), name='team-list'),
    path('upcoming/', views.upcoming_matches, name='upcoming-matches'),
    path('live/', views.live_matches, name='live-matches'),
    path('finished/', views.finished_matches, name='finished-matches'),
    path('bulk-create/', views.bulk_create_matches, name='bulk-create-matches'),
    path('<int:pk>/update-status/', views.update_match_status, name='update-match-status'),
    path('<int:pk>/extra-time/', views.manage_extra_time, name='manage-extra-time'),
    path('worldcup/teams/', views_worldcup.worldcup_teams, name='worldcup-teams'),
    path('worldcup/matches/', views_worldcup.worldcup_matches, name='worldcup-matches'),
    path('worldcup/import-teams/', views_worldcup.import_teams_to_db, name='worldcup-import-teams'),
    path('worldcup/import-matches/', views_worldcup.import_matches_to_db, name='worldcup-import-matches'),
]
