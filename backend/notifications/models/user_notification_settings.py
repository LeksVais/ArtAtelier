from django.db import models
from core.models import User

class UserNotificationSettings(models.Model):
    """Настройки уведомлений пользователя"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Каналы получения
    enable_system = models.BooleanField(default=True, verbose_name="В системе")
    enable_email = models.BooleanField(default=True, verbose_name="По email")
    enable_sms = models.BooleanField(default=False, verbose_name="SMS")
    enable_telegram = models.BooleanField(default=False, verbose_name="Telegram")
    
    # Типы уведомлений
    notify_new_tasks = models.BooleanField(default=True, verbose_name="Новые задачи")
    notify_deadlines = models.BooleanField(default=True, verbose_name="Просроченные сроки")
    notify_project_changes = models.BooleanField(default=True, verbose_name="Изменения проектов")
    notify_file_uploads = models.BooleanField(default=True, verbose_name="Загрузка файлов")
    notify_comments = models.BooleanField(default=True, verbose_name="Комментарии")
    
    # Временные рамки
    work_hours_start = models.TimeField(default='09:00', verbose_name="Начало рабочих часов")
    work_hours_end = models.TimeField(default='18:00', verbose_name="Конец рабочих часов")
    quiet_hours_start = models.TimeField(default='22:00', verbose_name="Начало тихих часов")
    quiet_hours_end = models.TimeField(default='08:00', verbose_name="Конец тихих часов")
    
    class Meta:
        verbose_name = "Настройка уведомлений"
        verbose_name_plural = "Настройки уведомлений"
    
    def __str__(self):
        return f"Настройки уведомлений {self.user}"