from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('payment/', views.submit_payment, name='submit_payment'),
    path('payment-history/', views.payment_history, name='payment_history'),
]
