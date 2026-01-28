from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, EmployeeViewSet, CustomTokenObtainPairView,
    ClientViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Изменяем этот путь, чтобы поддерживать GET, PUT, PATCH
    path('me/', UserViewSet.as_view({
        'get': 'me',
        'put': 'me',
        'patch': 'me'
    }), name='user-me'),
    path('change-password/', UserViewSet.as_view({'post': 'change_password'}), name='change-password'),
]