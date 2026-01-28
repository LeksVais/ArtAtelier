from django.db import models
from core.models import User

class Notification(models.Model):
    """Уведомления системы"""
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Новая задача'),
        ('task_deadline', 'Просроченная задача'),
        ('project_status', 'Изменение статуса проекта'),
        ('file_uploaded', 'Загружен новый файл'),
        ('comment_added', 'Добавлен комментарий'),
        ('report_ready', 'Отчет сформирован'),
        ('system', 'Системное уведомление'),
    ]
    
    CHANNEL_CHOICES = [
        ('system', 'В системе'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('telegram', 'Telegram'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name="Тип уведомления")
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='system', verbose_name="Канал отправки")
    title = models.CharField(max_length=255, verbose_name="Заголовок")
    message = models.TextField(verbose_name="Сообщение")
    is_read = models.BooleanField(default=False, verbose_name="Прочитано")
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_for = models.DateTimeField(null=True, blank=True, verbose_name="Запланировано на")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Отправлено")
    
    class Meta:
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['scheduled_for']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} для {self.user}"