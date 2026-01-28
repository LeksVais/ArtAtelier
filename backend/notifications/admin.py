# notifications/admin.py
from django.contrib import admin
from .models import Notification, UserNotificationSettings

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'channel', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    readonly_fields = ('created_at', 'sent_at')
    raw_id_fields = ('user',)

@admin.register(UserNotificationSettings)
class UserNotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'enable_system', 'enable_email', 'enable_sms', 'enable_telegram')
    list_filter = ('enable_system', 'enable_email', 'enable_sms', 'enable_telegram')
    search_fields = ('user__username',)
    raw_id_fields = ('user',)       