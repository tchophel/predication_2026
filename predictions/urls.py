from django.urls import path
from . import views

urlpatterns = [
    path('', views.PredictionListView.as_view(), name='prediction-list'),
    path('<int:pk>/', views.PredictionDetailView.as_view(), name='prediction-detail'),
    path('matches/<int:match_id>/', views.create_prediction, name='create-prediction'),
    path('<int:prediction_id>/update/', views.update_prediction, name='update-prediction'),
    path('<int:prediction_id>/delete/', views.delete_prediction, name='delete-prediction'),
    path('my/', views.my_predictions, name='my-predictions'),
    path('two-star-status/', views.two_star_status, name='two-star-status'),
    path('award-points/', views.award_points, name='award-points'),
    path('matches/<int:match_id>/award-points/', views.award_points_for_match, name='award-points-for-match'),
]
