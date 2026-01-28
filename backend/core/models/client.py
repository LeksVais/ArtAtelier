from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
from django.core.exceptions import ValidationError

class Client(models.Model):
    name = models.CharField(
        max_length=255,
        validators=[
            RegexValidator(
                regex=r'^[а-яёА-ЯЁa-zA-Z0-9\s\-,"«».]{2,255}$',
                message='Название компании содержит недопустимые символы'
            ),
            MinLengthValidator(2)
        ],
        verbose_name="Название компании/ФИО"
    )
    contact_person = models.CharField(
        max_length=150,
        validators=[
            RegexValidator(
                regex=r'^[а-яёА-ЯЁ\s\.\-]{2,150}$',
                message='ФИО содержит недопустимые символы'
            )
        ],
        verbose_name="Контактное лицо"
    )
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
    email = models.EmailField(
        verbose_name="Email",
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$',
                message='Введите корректный email'
            )
        ]
    )
    website = models.URLField(blank=True, verbose_name="Сайт")
    address = models.TextField(blank=True, verbose_name="Адрес")
    notes = models.TextField(blank=True, verbose_name="Заметки")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    is_archived = models.BooleanField(default=False, verbose_name="В архиве")
    
    class Meta:
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def archive(self):
        """Логическое удаление согласно ТЗ 4.1.2"""
        from projects.models import Project
        if self.project_set.filter(is_active=True, status__in=['planned', 'in_work', 'on_approval']).exists():
            raise ValidationError("Нельзя архивировать клиента с активными проектами")
        self.is_archived = True
        self.save()