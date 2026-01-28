from .user import User
from .employee import Employee
from .client import Client
# Импортируем из notifications вместо локальной модели
from notifications.models import UserNotificationSettings

__all__ = [
    'User',
    'Employee', 
    'Client',
    'UserNotificationSettings',  # Теперь из notifications
]