from uuid import uuid4
from django.db import models

def file_upload_path(instance, filename):
    """Генерация пути для файла с версионированием"""
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    
    if instance.project:
        return f'projects/project_{instance.project.id}/{filename}'
    elif instance.task:
        return f'tasks/task_{instance.task.id}/{filename}'
    else:
        return f'general/{filename}'