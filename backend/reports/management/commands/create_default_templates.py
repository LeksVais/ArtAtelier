from django.core.management.base import BaseCommand
from reports.models import ReportTemplate

class Command(BaseCommand):
    help = 'Создание шаблонов отчетов по умолчанию'
    
    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Отчет по проектам (стандартный)',
                'template_type': 'projects',
                'description': 'Стандартный отчет по проектам с полной информацией',
                'is_default': True,
                'include_columns': ['all'],
            },
            {
                'name': 'Отчет по задачам (стандартный)',
                'template_type': 'tasks',
                'description': 'Стандартный отчет по задачам',
                'is_default': True,
                'include_columns': ['all'],
            },
            {
                'name': 'Отчет по загрузке сотрудников',
                'template_type': 'employees',
                'description': 'Отчет по загрузке и эффективности сотрудников',
                'is_default': True,
                'include_columns': ['all'],
            },
            {
                'name': 'Отчет по выполнению задач за неделю',
                'template_type': 'tasks_period',
                'description': 'Еженедельный отчет по выполнению задач',
                'frequency': 'weekly',
                'include_columns': ['all'],
            },
            {
                'name': 'Сводный отчет по деятельности',
                'template_type': 'summary',
                'description': 'Сводный отчет по всей деятельности агентства',
                'frequency': 'monthly',
                'is_default': True,
                'include_columns': ['all'],
            },
        ]
        
        created = 0
        for template_data in templates:
            template, created_flag = ReportTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created_flag:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'Создан шаблон: {template.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'Создано шаблонов: {created}'))