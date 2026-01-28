from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import JsonResponse
from django.shortcuts import render
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/matches/', include('matches.urls')),
    path('api/predictions/', include('predictions.urls')),
    path('api/admin/', include('admin_panel.urls')),
    path('api/leaderboard/', include('leaderboard.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve React frontend for all non-API routes
def react_frontend(request):
    try:
        return render(request, 'index.html')
    except:
        return JsonResponse({'message': 'Match Prediction API', 'docs': '/api/docs/'})

urlpatterns += [
    path('', react_frontend),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
