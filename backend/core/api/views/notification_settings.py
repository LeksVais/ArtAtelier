from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ...models import UserNotificationSettings
from ..serializers import UserNotificationSettingsSerializer

class UserNotificationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = UserNotificationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserNotificationSettings.objects.filter(user=self.request.user)
    
    def get_object(self):
        # Получаем или создаем настройки для пользователя
        obj, created = UserNotificationSettings.objects.get_or_create(
            user=self.request.user
        )
        return obj
    
    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Получение настроек текущего пользователя"""
        settings, created = UserNotificationSettings.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(settings)
        return Response(serializer.data)