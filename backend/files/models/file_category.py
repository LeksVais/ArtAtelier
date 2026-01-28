from django.db import models

class FileCategory(models.Model):
    """Категории файлов согласно макетам"""
    CATEGORY_CHOICES = [
        ('brief', 'Брифы и ТЗ'),
        ('sketch', 'Эскизы и концепции'),
        ('final', 'Финальные материалы'),
        ('reference', 'Референсы'),
        ('document', 'Документация'),
        ('other', 'Прочие'),
    ]
    
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True, verbose_name="Название категории")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True, verbose_name="Активна")  
    class Meta:
        verbose_name = "Категория файлов"
        verbose_name_plural = "Категории файлов"
    
    def __str__(self):
        return self.get_name_display()