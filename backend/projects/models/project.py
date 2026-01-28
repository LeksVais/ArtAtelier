from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import RegexValidator, MinLengthValidator
from core.models import User, Client

class Project(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Планируется'),
        ('in_work', 'В работе'),
        ('on_approval', 'На согласовании'),
        ('completed', 'Завершён'),
        ('paused', 'Приостановлен'),
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
                message='Название проекта содержит недопустимые символы'
            ),
            MinLengthValidator(3)
        ],
        verbose_name="Название проекта"
    )
    description = models.TextField(
        validators=[
            RegexValidator(
                regex=r'^[а-яёА-ЯЁa-zA-Z0-9\s\-,\\.():;!?"\'«»]*$',
                message='Описание содержит недопустимые символы'
            )
        ],
        verbose_name="Описание проекта",
        blank=True,
        null=True
    )
    client = models.ForeignKey(Client, on_delete=models.PROTECT, verbose_name="Клиент")
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name='managed_projects', verbose_name="Менеджер проекта")
    start_date = models.DateField(verbose_name="Дата начала")
    planned_end_date = models.DateField(verbose_name="Плановая дата завершения")
    actual_end_date = models.DateField(null=True, blank=True, verbose_name="Фактическая дата завершения")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned', verbose_name="Статус проекта")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name="Приоритет проекта")
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name="Бюджет")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)  # Новое поле
    archived_at = models.DateTimeField(null=True, blank=True)  # Новое поле
    archived_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='archived_projects')  # Новое поле
    restored_at = models.DateTimeField(null=True, blank=True)  # Новое поле
    restored_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='restored_projects')  # Новое поле
    
    class Meta:
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def clean(self):
        """Валидация согласно ТП таблица 1"""
        if self.planned_end_date and self.start_date:
            if self.planned_end_date <= self.start_date:
                raise ValidationError({'planned_end_date': 'Плановая дата завершения должна быть позже даты начала'})
    
    def complete(self):
        """Завершение проекта с проверкой согласно ТЗ 4.1.3"""
        # Проверяем, есть ли задачи с этим проектом
        try:
            from .task import Task
            if Task.objects.filter(project=self, status__in=['created', 'in_work']).exists():
                raise ValidationError("Нельзя завершить проект с незавершенными задачами")
        except ImportError:
            pass
        
        if self.status != 'on_approval':
            raise ValidationError("Проект должен быть на согласовании перед завершением")
        
        self.status = 'completed'
        self.actual_end_date = timezone.now().date()
        self.save()
    
    def archive(self, user=None):
        """
        Архивация проекта с проверкой согласно ТЗ 4.2.2
        """
        if self.is_archived:
            raise ValidationError("Проект уже архивирован")
        
        # Проверка активных задач
        active_tasks = self.task_set.filter(
            is_active=True,
            status__in=['created', 'in_work', 'on_review']
        ).exists()
        
        if active_tasks:
            raise ValidationError("Нельзя архивировать проект с активными задачами")
        
        # Проверка, что проект не в работе
        if self.status == 'in_work':
            raise ValidationError("Нельзя архивировать проект, который находится в работе")
        
        self.is_archived = True
        self.is_active = False
        self.archived_at = timezone.now()
        if user:
            self.archived_by = user
        
        # Логируем действие
        if user:
            from comments.models import Comment
            Comment.objects.create(
                content_type='project',
                object_id=self.id,
                author=user,
                content=f'Проект архивирован пользователем {user.get_full_name()}'
            )
        
        self.save()
        return True
    
    def restore(self, user=None):
        """
        Восстановление проекта из архива
        """
        if not self.is_archived:
            raise ValidationError("Проект не архивирован")
        
        self.is_archived = False
        self.is_active = True
        self.restored_at = timezone.now()
        if user:
            self.restored_by = user
        
        # Логируем действие
        if user:
            from comments.models import Comment
            Comment.objects.create(
                content_type='project',
                object_id=self.id,
                author=user,
                content=f'Проект восстановлен пользователем {user.get_full_name()}'
            )
        
        self.save()
        return True
    
    def save(self, *args, **kwargs):
        try:
            self.full_clean()
        except ValidationError:
            pass
        super().save(*args, **kwargs)