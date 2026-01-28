from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import (
    RegexValidator, 
    MinLengthValidator, 
    MinValueValidator, 
    MaxValueValidator
)
from core.models import User

class Task(models.Model):
    """Задачи согласно ТЗ 4.1.1"""
    STATUS_CHOICES = [
        ('created', 'Создана'),
        ('in_work', 'В работе'),
        ('on_review', 'На проверке'),
        ('completed', 'Выполнена'),
        ('cancelled', 'Отменена'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Низкий'),
        ('medium', 'Средний'),
        ('high', 'Высокий'),
        ('critical', 'Критический'),
    ]
    
    title = models.CharField(
        max_length=255,
        validators=[
            RegexValidator(
                regex=r'^[а-яёА-ЯЁa-zA-Z0-9\s\-,\\.()]{3,255}$',
                message='Название задачи содержит недопустимые символы'
            ),
            MinLengthValidator(3)
        ],
        verbose_name="Название задачи"
    )
    description = models.TextField(
        validators=[
            RegexValidator(
                regex=r'^[а-яёА-ЯЁa-zA-Z0-9\s\-,\\.():;!?"\'«»]*$',
                message='Описание содержит недопустимые символы'
            )
        ],
        verbose_name="Описание задачи"
    )
    project = models.ForeignKey('Project', on_delete=models.CASCADE, verbose_name="Проект")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='assigned_tasks', verbose_name="Исполнитель")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                  related_name='created_tasks', verbose_name="Создатель")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата постановки")
    deadline = models.DateField(verbose_name="Срок выполнения")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Фактическая дата выполнения")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created', verbose_name="Статус задачи")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name="Приоритет задачи")
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Процент выполнения"
    )
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, verbose_name="Оценка времени (ч)")
    actual_hours = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, verbose_name="Фактическое время (ч)")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Задача"
        verbose_name_plural = "Задачи"
        ordering = ['priority', 'deadline']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['deadline']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return self.title
    
    def clean(self):
        """Валидация согласно ТП таблица 1"""
        if self.assigned_to and self.deadline:
            conflicting_tasks = Task.objects.filter(
                assigned_to=self.assigned_to,
                deadline=self.deadline,
                status__in=['created', 'in_work'],
                is_active=True
            ).exclude(id=self.id)
            
            if conflicting_tasks.exists():
                raise ValidationError(
                    {'assigned_to': 'Исполнитель уже имеет задачу на этот срок'}
                )
    
    def take_to_work(self, user):
        """Взять задачу в работу согласно макетам"""
        if self.status != 'created':
            raise ValidationError("Задачу можно взять в работу только из статуса 'Создана'")
        
        self.assigned_to = user
        self.status = 'in_work'
        self.save()
    
    def send_to_review(self):
        """Отправить на проверку"""
        if self.status != 'in_work':
            raise ValidationError("Задачу можно отправить на проверку только из статуса 'В работе'")
        
        self.status = 'on_review'
        self.save()
    
    def complete(self):
        """Завершить задачу"""
        if self.status != 'on_review':
            raise ValidationError("Задачу можно завершить только из статуса 'На проверке'")
        
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.progress = 100
        self.save()