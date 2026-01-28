from django.db import models
from django.conf import settings
from projects.models import Project

class GeneratedReport(models.Model):
    """Сгенерированные отчеты согласно ТЗ 4.1.1"""
    REPORT_TYPES = [
        ('projects', 'По проектам'),
        ('tasks', 'По задачам'),
        ('employees', 'По загрузке сотрудников'),
        ('tasks_period', 'Отчет по выполнению задач за период'),
        ('summary', 'Сводный отчет по деятельности агентства'),
    ]
    
    EXPORT_FORMATS = [
        ('pdf', 'PDF'),
    ]
    
    # Основная информация (согласно ТЗ п.4)
    name = models.CharField(max_length=255, verbose_name="Наименование отчета")
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, verbose_name="Тип отчета")
    
    # Параметры формирования (согласно ТЗ п.3)
    start_date = models.DateField(verbose_name="Период с")
    end_date = models.DateField(verbose_name="Период по")
    projects = models.ManyToManyField(Project, blank=True, verbose_name="Проекты")
    
    # Для отчетов по сотрудникам
    employees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, 
                                       verbose_name="Сотрудники", related_name='employee_reports')
    
    # Результаты
    export_format = models.CharField(max_length=10, choices=EXPORT_FORMATS, default='pdf', 
                                     verbose_name="Формат экспорта")
    file = models.FileField(upload_to='reports/%Y/%m/', null=True, blank=True, 
                            verbose_name="Файл отчета")
    file_size = models.BigIntegerField(null=True, blank=True, verbose_name="Размер файла")
    
    # Метаданные (согласно ТЗ п.4)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                     null=True, verbose_name="Сформировал",
                                     related_name='generated_reports')
    generated_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время формирования")
    generation_time = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, 
                                          verbose_name="Время генерации (сек)")
    
    is_success = models.BooleanField(default=True, verbose_name="Успешно сформирован")
    error_message = models.TextField(blank=True, verbose_name="Сообщение об ошибке")
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False, verbose_name="В архиве")
    
    class Meta:
        verbose_name = "Сформированный отчет"
        verbose_name_plural = "Сформированные отчеты"
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['report_type', 'generated_at']),
            models.Index(fields=['is_archived', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} от {self.generated_at.strftime('%d.%m.%Y %H:%M')}"
    
    def archive(self):
        """Перемещение в архив"""
        self.is_archived = True
        self.save(update_fields=['is_archived'])
    
    def get_absolute_url(self):
        """URL для скачивания отчета"""
        from django.urls import reverse
        return reverse('report-download', kwargs={'pk': self.pk})
    
    def get_file_name(self):
        """Генерация имени файла согласно ТП"""
        date_str = self.generated_at.strftime('%Y%m%d_%H%M%S')
        report_type = self.get_report_type_display().replace(' ', '_')
        return f"Отчет_{report_type}_{date_str}.{self.export_format}"
    
    def can_view(self, user):
        """Проверка прав на просмотр отчета"""
        if user.role == 'director':
            return True
        return self.generated_by == user
    
    def get_summary_info(self):
        """Получение сводной информации об отчете"""
        return {
            'name': self.name,
            'report_type': self.get_report_type_display(),
            'period': f"{self.start_date} - {self.end_date}",
            'generated_at': self.generated_at.strftime('%d.%m.%Y %H:%M'),
            'generated_by': self.generated_by.get_full_name() if self.generated_by else 'Неизвестно',
            'file_size': self.get_formatted_file_size(),
            'is_success': self.is_success,
        }
    
    def get_formatted_file_size(self):
        """Форматирование размера файла"""
        if not self.file_size:
            return "Нет файла"
        
        size = self.file_size
        for unit in ['Б', 'КБ', 'МБ', 'ГБ']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} ТБ"