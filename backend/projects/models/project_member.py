from django.db import models
from core.models import Employee

def project_directory_path(instance, filename):
    """Путь для хранения файлов проекта"""
    if instance.project.id:
        return f'projects/project_{instance.project.id}/{filename}'
    return f'projects/temp/{filename}'

class ProjectMember(models.Model):
    """Участники проекта"""
    ROLE_CHOICES = [
        ('manager', 'Менеджер'),
        ('designer', 'Дизайнер'),
        ('developer', 'Разработчик'),
        ('copywriter', 'Копирайтер'),
        ('qa', 'Тестировщик'),
    ]
    
    project = models.ForeignKey('Project', on_delete=models.CASCADE, verbose_name="Проект")
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, verbose_name="Сотрудник")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name="Роль в проекте")
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Участник проекта"
        verbose_name_plural = "Участники проекта"
        unique_together = ['project', 'employee']
    
    def __str__(self):
        return f"{self.employee} - {self.get_role_display()} в {self.project}"