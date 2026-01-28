from django.db import models
from .user import User

class Employee(models.Model):
    EMPLOYMENT_STATUS = [
        ('active', 'Активен'),
        ('fired', 'Уволен'),
        ('vacation', 'В отпуске'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', verbose_name="Учетная запись")
    position = models.CharField(max_length=100, verbose_name="Должность")
    work_phone = models.CharField(max_length=20, blank=True, verbose_name="Рабочий телефон")
    work_email = models.EmailField(verbose_name="Рабочая почта")
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS, default='active', verbose_name="Статус занятости")
    hire_date = models.DateField(verbose_name="Дата приема")
    salary_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Ставка оплаты")
    notes = models.TextField(blank=True, verbose_name="Заметки")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Сотрудник"
        verbose_name_plural = "Сотрудники"
    
    def __str__(self):
        return str(self.user)