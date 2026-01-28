from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, UserNotificationSettingsViewSet,
    MarkNotificationsAsReadView, UnreadNotificationsCountView
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-settings', UserNotificationSettingsViewSet, basename='notification-settings')

notification_urls = [
    path('unread_count/', UnreadNotificationsCountView.as_view(), name='notification-unread-count'),
    path('mark_all_read/', MarkNotificationsAsReadView.as_view(), name='notification-mark-all-read'),
    path('settings/mine/', UserNotificationSettingsViewSet.as_view({'get': 'mine'}), name='notification-settings-mine'),
    path('<int:pk>/mark_read/', NotificationViewSet.as_view({'post': 'mark_read'}), name='notification-mark-read'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('notifications/', include(notification_urls)),
]