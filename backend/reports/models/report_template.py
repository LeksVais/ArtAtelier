from django.db import models

class ReportTemplate(models.Model):
    """Шаблоны отчетов согласно макетам"""
    TEMPLATE_TYPES = [
        ('projects', 'По проектам'),
        ('tasks', 'По задачам'),
        ('employees', 'По загрузке сотрудников'),
        ('tasks_period', 'Отчет по выполнению задач за период'),
        ('summary', 'Сводный отчет по деятельности агентства'),
    ]
    
    FREQUENCIES = [
        ('daily', 'Ежедневный'),
        ('weekly', 'Еженедельный'),
        ('monthly', 'Ежемесячный'),
        ('quarterly', 'Ежеквартальный'),
        ('yearly', 'Ежегодный'),
        ('manual', 'По запросу'),
    ]
    
    # Основная информация
    name = models.CharField(max_length=100, verbose_name="Название шаблона")
    description = models.TextField(blank=True, verbose_name="Описание")
    
    # Параметры шаблона
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, 
                                     verbose_name="Тип отчета")
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default='manual',
                                verbose_name="Частота формирования")
    
    # Конфигурация полей (какие столбцы включать в отчет)
    include_columns = models.JSONField(default=list, verbose_name="Включаемые столбцы")
    default_parameters = models.JSONField(default=dict, verbose_name="Параметры по умолчанию")
    
    # Настройки внешнего вида
    show_totals = models.BooleanField(default=True, verbose_name="Показывать итоги")
    show_header = models.BooleanField(default=True, verbose_name="Показывать заголовок")
    show_footer = models.BooleanField(default=True, verbose_name="Показывать подвал")
    
    # Статус
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    is_default = models.BooleanField(default=False, verbose_name="Шаблон по умолчанию")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Шаблон отчета"
        verbose_name_plural = "Шаблоны отчетов"
        ordering = ['is_default', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def get_default_columns(self):
        """Получение столбцов по умолчанию для типа отчета"""
        columns_by_type = {
            'projects': ['№', 'Наименование проекта', 'Клиент', 'Ответственный менеджер',
                        'Дата начала', 'Плановая дата завершения', 'Статус проекта',
                        'Количество задач всего', 'Количество выполненных задач', 
                        'Процент выполнения проекта'],
            'tasks': ['№', 'Наименование задачи', 'Проект', 'Исполнитель',
                     'Срок выполнения', 'Статус задачи', 'Фактическая дата выполнения'],
            'employees': ['№', 'Фамилия и имя сотрудника', 'Должность',
                         'Количество активных задач', 'Количество выполненных задач за период',
                         'Процент выполнения задач'],
            'tasks_period': ['№', 'Задача', 'Проект', 'Исполнитель', 'Статус',
                            'Плановый срок', 'Фактический срок', 'Задержка (дней)'],
            'summary': ['Показатель', 'Значение', 'Изменение', 'Примечание'],
        }
        return columns_by_type.get(self.template_type, [])
    
    def get_available_columns(self):
        """Все доступные столбцы для этого типа отчета"""
        return self.get_default_columns()