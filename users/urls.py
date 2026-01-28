from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('payment/', views.submit_payment, name='submit_payment'),
    path('payment-history/', views.payment_history, name='payment_history'),
    path('admin/new-users/', views.new_users_notifications, name='new_users_notifications'),
    path('admin/mark-all-paid/', views.mark_all_paid, name='mark_all_paid'),
    path('change-password/', views.change_password, name='change_password'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
]
