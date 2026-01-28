# core/api/serializers/__init__.py
from .user import (
    UserSerializer, UserCreateSerializer, 
    ChangePasswordSerializer, CustomTokenObtainPairSerializer,
    UserNotificationSettingsSerializer  
)
from .employee import EmployeeSerializer, EmployeeCreateSerializer
from .client import ClientSerializer, ClientDetailSerializer

__all__ = [
    'UserSerializer', 'UserCreateSerializer', 'ChangePasswordSerializer',
    'CustomTokenObtainPairSerializer', 'EmployeeSerializer', 
    'EmployeeCreateSerializer', 'ClientSerializer', 'ClientDetailSerializer',
    'UserNotificationSettingsSerializer'  
]