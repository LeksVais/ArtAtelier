from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="API АртСтудии",
        default_version='v1',
        description="API для системы управления проектами",
        contact=openapi.Contact(email="support@artstudio.ru"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API документация
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API endpoints
    path('api/auth/', include('core.api.urls')),
    path('api/projects/', include('projects.api.urls')),
    path('api/files/', include('files.api.urls')),
    path('api/reports/', include('reports.api.urls')),
    path('api/notifications/', include('notifications.api.urls')),
    
    # Добавляем маршрут для дашборда
    path('api/dashboard/', include('projects.api.urls')),  
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)