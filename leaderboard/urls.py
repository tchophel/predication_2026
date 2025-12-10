from django.urls import path
from . import views

urlpatterns = [
    path('', views.leaderboard, name='leaderboard'),
    path('my-stats/', views.user_stats, name='user-stats'),
    path('top-predictions/', views.top_predictions, name='top-predictions'),
]
