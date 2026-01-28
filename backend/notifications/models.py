from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class UserNotificationSettings(models.Model):
    """Настройки уведомлений пользователя"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_settings',
        verbose_name="Пользователь"
    )
    
    # Каналы получения уведомлений
    enable_system = models.BooleanField(
        default=True,
        verbose_name="В системе"
    )
    enable_email = models.BooleanField(
        default=True,
        verbose_name="По email"
    )
    enable_sms = models.BooleanField(
        default=False,
        verbose_name="SMS"
    )
    enable_telegram = models.BooleanField(
        default=False,
        verbose_name="Telegram"
    )
    
    # Типы уведомлений
    notify_new_tasks = models.BooleanField(
        default=True,
        verbose_name="Новые задачи"
    )
    notify_deadlines = models.BooleanField(
        default=True,
        verbose_name="Просроченные сроки"
    )
    notify_project_changes = models.BooleanField(
        default=True,
        verbose_name="Изменения проектов"
    )
    notify_file_uploads = models.BooleanField(
        default=True,
        verbose_name="Загрузка файлов"
    )
    notify_comments = models.BooleanField(
        default=True,
        verbose_name="Комментарии"
    )
    notify_report_ready = models.BooleanField(
        default=True,
        verbose_name="Отчеты готовы"
    )
    
    # Временные рамки
    work_hours_start = models.TimeField(
        default='09:00',
        verbose_name="Начало рабочих часов"
    )
    work_hours_end = models.TimeField(
        default='18:00',
        verbose_name="Конец рабочих часов"
    )
    quiet_hours_start = models.TimeField(
        default='22:00',
        verbose_name="Начало тихих часов"
    )
    quiet_hours_end = models.TimeField(
        default='08:00',
        verbose_name="Конец тихих часов"
    )
    
    # Telegram настройки (если используется)
    telegram_chat_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Telegram Chat ID"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    
    class Meta:
        verbose_name = "Настройка уведомлений"
        verbose_name_plural = "Настройки уведомлений"
        ordering = ['user']
    
    def __str__(self):
        return f"Настройки уведомлений для {self.user}"
    
    @property
    def is_within_work_hours(self):
        """Проверка, находится ли текущее время в рабочих часах"""
        from django.utils import timezone
        import datetime
        
        now = timezone.localtime(timezone.now()).time()
        return self.work_hours_start <= now <= self.work_hours_end
    
    @property
    def is_within_quiet_hours(self):
        """Проверка, находится ли текущее время в тихих часах"""
        from django.utils import timezone
        import datetime
        
        now = timezone.localtime(timezone.now()).time()
        
        # Обработка случая, когда тихие часы переходят через полночь
        if self.quiet_hours_start <= self.quiet_hours_end:
            return self.quiet_hours_start <= now <= self.quiet_hours_end
        else:
            return now >= self.quiet_hours_start or now <= self.quiet_hours_end
    
    def should_send_notification(self, notification_type, channel='system'):
        """Определить, нужно ли отправлять уведомление"""
        
        # Проверка канала
        if channel == 'system' and not self.enable_system:
            return False
        elif channel == 'email' and not self.enable_email:
            return False
        elif channel == 'sms' and not self.enable_sms:
            return False
        elif channel == 'telegram' and not self.enable_telegram:
            return False
        
        # Проверка типа уведомления
        if notification_type == 'task_assigned' and not self.notify_new_tasks:
            return False
        elif notification_type == 'task_deadline' and not self.notify_deadlines:
            return False
        elif notification_type == 'project_status' and not self.notify_project_changes:
            return False
        elif notification_type == 'file_uploaded' and not self.notify_file_uploads:
            return False
        elif notification_type == 'comment_added' and not self.notify_comments:
            return False
        elif notification_type == 'report_ready' and not self.notify_report_ready:
            return False
        
        # Проверка тихих часов (кроме системных уведомлений)
        if channel != 'system' and self.is_within_quiet_hours:
            return False
        
        return True