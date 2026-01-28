from rest_framework import serializers
from ...models import Notification, UserNotificationSettings

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'notification_type_display',
            'channel', 'channel_display', 'title', 'message', 'is_read',
            'created_at', 'scheduled_for', 'sent_at', 'time_ago', 'icon'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at']
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        from django.utils.timesince import timesince
        
        if obj.created_at:
            return timesince(obj.created_at, timezone.now()) + ' назад'
        return ''
    
    def get_icon(self, obj):
        icons = {
            'task_assigned': 'assignment',
            'task_deadline': 'access_time',
            'project_status': 'trending_up',
            'file_uploaded': 'attach_file',
            'comment_added': 'comment',
            'report_ready': 'description',
            'system': 'notifications'
        }
        return icons.get(obj.notification_type, 'notifications')

class UserNotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationSettings
        fields = [
            'id', 'user',
            'enable_system', 'enable_email', 'enable_sms', 'enable_telegram',
            'notify_new_tasks', 'notify_deadlines', 'notify_project_changes',
            'notify_file_uploads', 'notify_comments',
            'work_hours_start', 'work_hours_end',
            'quiet_hours_start', 'quiet_hours_end'
        ]
        read_only_fields = ['id', 'user']
    
    def validate(self, data):
        # Проверка временных рамок
        if data['work_hours_start'] >= data['work_hours_end']:
            raise serializers.ValidationError({
                'work_hours_end': 'Время окончания рабочих часов должно быть позже времени начала'
            })
        
        if data['quiet_hours_start'] >= data['quiet_hours_end']:
            raise serializers.ValidationError({
                'quiet_hours_end': 'Время окончания тихих часов должно быть позже времени начала'
            })
        
        return data