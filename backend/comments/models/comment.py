from django.db import models
from core.models import User, Client  
from projects.models import Project, Task
from files.models import ProjectFile

class Comment(models.Model):
    """Комментарии к проектам, задачам, файлам"""
    CONTENT_TYPES = [
        ('project', 'Проект'),
        ('task', 'Задача'),
        ('file', 'Файл'),
        ('client', 'Клиент'),
    ]
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Автор")
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES, verbose_name="Тип объекта")
    object_id = models.PositiveIntegerField(verbose_name="ID объекта")
    text = models.TextField(verbose_name="Текст комментария")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Комментарий"
        verbose_name_plural = "Комментарии"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        return f"Комментарий от {self.author} ({self.created_at})"
    
    @property
    def content_object(self):
        """Получение связанного объекта"""
        model_map = {
            'project': Project,
            'task': Task,
            'file': ProjectFile,
            'client': Client,  
        }
        model = model_map.get(self.content_type)
        if model:
            return model.objects.filter(id=self.object_id).first()
        return None