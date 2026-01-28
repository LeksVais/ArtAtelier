from django.db import models
from core.models import User
from .utils import file_upload_path
from .project_file import ProjectFile

class FileVersionHistory(models.Model):
    """История версий файлов"""
    project_file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='versions')
    version = models.IntegerField(verbose_name="Версия")
    file = models.FileField(upload_to=file_upload_path)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    changes_description = models.TextField(blank=True, verbose_name="Описание изменений")
    file_size = models.BigIntegerField(verbose_name="Размер файла (байт)", null=True, blank=True) 
    file_hash = models.CharField(max_length=64, blank=True, verbose_name="Хеш файла")  
    
    class Meta:
        verbose_name = "История версий файла"
        verbose_name_plural = "История версий файлов"
        ordering = ['-version']
        unique_together = ['project_file', 'version']
    
    def __str__(self):
        return f"{self.project_file.name} v{self.version}"
    
    def save(self, *args, **kwargs):
        if not self.file_size and self.file:
            self.file_size = self.file.size
        super().save(*args, **kwargs)