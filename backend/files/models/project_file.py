import os
from django.db import models
from django.core.validators import RegexValidator
from core.models import User
from projects.models import Project, Task
from .utils import file_upload_path
from .file_category import FileCategory

class ProjectFile(models.Model):
    """Файлы проектов согласно ТЗ 4.1.1"""
    FILE_TYPES = [
        ('image', 'Изображение'),
        ('document', 'Документ'),
        ('archive', 'Архив'),
        ('video', 'Видео'),
        ('audio', 'Аудио'),
        ('other', 'Другое'),
    ]
    
    EXTENSION_CHOICES = [
        ('.jpg', 'JPG'), ('.jpeg', 'JPEG'), ('.png', 'PNG'), ('.gif', 'GIF'),
        ('.pdf', 'PDF'), ('.doc', 'DOC'), ('.docx', 'DOCX'), ('.xls', 'XLS'),
        ('.xlsx', 'XLSX'), ('.ppt', 'PPT'), ('.pptx', 'PPTX'), ('.psd', 'PSD'),
        ('.ai', 'AI'), ('.indd', 'INDD'), ('.mp4', 'MP4'), ('.mov', 'MOV'),
        ('.avi', 'AVI'), ('.zip', 'ZIP'), ('.rar', 'RAR'),
    ]
    
    name = models.CharField(
        max_length=255,
        validators=[
            RegexValidator(
                regex=r'^[а-яёА-ЯЁa-zA-Z0-9\s\-,\\.()_]{1,255}$',
                message='Название файла содержит недопустимые символы'
            )
        ],
        verbose_name="Название файла"
    )
    original_filename = models.CharField(max_length=255, verbose_name="Оригинальное имя файла")
    file = models.FileField(upload_to=file_upload_path, verbose_name="Файл")
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, verbose_name="Тип файла")
    extension = models.CharField(max_length=10, choices=EXTENSION_CHOICES, verbose_name="Расширение")
    size = models.BigIntegerField(verbose_name="Размер файла (байт)")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Проект")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Задача")
    category = models.ForeignKey(FileCategory, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Категория")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Загрузил")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")
    version = models.IntegerField(default=1, verbose_name="Версия")
    is_current = models.BooleanField(default=True, verbose_name="Текущая версия")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Файл проекта"
        verbose_name_plural = "Файлы проектов"
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['project', 'task']),
            models.Index(fields=['file_type']),
            models.Index(fields=['uploaded_at']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.size and self.file:
            self.size = self.file.size
        if not self.original_filename and self.file:
            self.original_filename = os.path.basename(self.file.name)
        super().save(*args, **kwargs)
    
    def create_new_version(self, new_file, user):
        """Создание новой версии файла согласно макетам"""
        # Помечаем текущую версию как неактуальную
        ProjectFile.objects.filter(
            project=self.project,
            task=self.task,
            name=self.name,
            is_current=True
        ).update(is_current=False)
        
        # Создаем новую версию
        new_version = ProjectFile.objects.create(
            name=self.name,
            original_filename=os.path.basename(new_file.name),
            file=new_file,
            file_type=self.file_type,
            extension=self.extension,
            project=self.project,
            task=self.task,
            category=self.category,
            uploaded_by=user,
            version=self.version + 1,
            is_current=True,
            description=self.description
        )
        return new_version