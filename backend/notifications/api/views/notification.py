from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone
from ...models import Notification, UserNotificationSettings
from ..serializers import NotificationSerializer, UserNotificationSettingsSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user,
            is_read=False
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Пометить уведомление как прочитанное"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        return Response({'status': 'Уведомление прочитано'})
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_destroy(self, instance):
        instance.delete()

class MarkNotificationsAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Пометить все уведомления как прочитанные"""
        Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({'status': 'Все уведомления прочитаны'})

class UnreadNotificationsCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Получение количества непрочитанных уведомлений"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        
        return Response({'count': count})
    
class UserNotificationSettingsViewSet(viewsets.ModelViewSet):
    """API для управления настройками уведомлений пользователя"""
    serializer_class = UserNotificationSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserNotificationSettings.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        """Получение настроек текущего пользователя"""
        settings, created = UserNotificationSettings.objects.get_or_create(
            user=request.user,
            defaults={
                'enable_system': True,
                'enable_email': True,
                'enable_sms': False,
                'enable_telegram': False,
                'notify_new_tasks': True,
                'notify_deadlines': True,
                'notify_project_changes': True,
                'notify_file_uploads': True,
                'notify_comments': True,
                'work_hours_start': '09:00',
                'work_hours_end': '18:00',
                'quiet_hours_start': '22:00',
                'quiet_hours_end': '08:00'
            }
        )
        serializer = self.get_serializer(settings)
        return Response(serializer.data)