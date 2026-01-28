from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    ROLE_CHOICES = [
        ('director', 'Руководитель'),
        ('manager', 'Менеджер проекта'),
        ('designer', 'Дизайнер'),
        ('copywriter', 'Копирайтер'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('blocked', 'Заблокирована'),
    ]
    
    middle_name = models.CharField(max_length=50, blank=True, verbose_name="Отчество")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='designer', verbose_name="Роль")
    account_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Статус учетной записи")
    phone = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$',
                message='Введите корректный номер телефона'
            )
        ],
        verbose_name="Телефон"
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Аватар")
    timezone = models.CharField(max_length=50, default='Europe/Moscow', verbose_name="Часовой пояс")
    language = models.CharField(max_length=10, default='ru', verbose_name="Язык интерфейса")
    theme = models.CharField(max_length=20, default='light', verbose_name="Тема интерфейса")
    two_factor_enabled = models.BooleanField(default=False, verbose_name="Двухфакторная аутентификация")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.middle_name or ''}".strip()
    
    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name} {self.middle_name or ''}".strip()