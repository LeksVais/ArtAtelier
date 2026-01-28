from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg
from django.core.files.base import ContentFile
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
import io
import csv
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

from ...models import GeneratedReport, ReportTemplate
from ..serializers import (
    GeneratedReportSerializer, ReportTemplateSerializer,
    ReportGenerationSerializer
)
from ..permissions import CanGenerateReport, CanViewReport
from ..filters import GeneratedReportFilter


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """API для шаблонов отчетов"""
    queryset = ReportTemplate.objects.filter(is_active=True)
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Фильтрация шаблонов"""
        queryset = super().get_queryset()
        
        # Фильтр по типу отчета
        report_type = self.request.query_params.get('type')
        if report_type:
            queryset = queryset.filter(template_type=report_type)
        
        # Только активные шаблоны
        queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """Получение шаблонов по умолчанию"""
        templates = self.get_queryset().filter(is_default=True)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Получение шаблонов по типу"""
        template_type = request.query_params.get('type')
        if template_type:
            templates = self.get_queryset().filter(template_type=template_type)
        else:
            templates = self.get_queryset()
        
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class ReportGenerationView(generics.CreateAPIView):
    """API view для генерации отчетов согласно ТЗ"""
    serializer_class = ReportGenerationSerializer
    permission_classes = [IsAuthenticated, CanGenerateReport]
    
    def _register_fonts(self):
        """Регистрация шрифтов с поддержкой кириллицы"""
        try:
            # Пути к шрифтам DejaVu (с поддержкой кириллицы)
            font_paths = [
                # Linux системные пути
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/dejavu/DejaVuSans.ttf',
                '/usr/local/share/fonts/dejavu/DejaVuSans.ttf',
                
                # Windows системные пути
                'C:\\Windows\\Fonts\\arial.ttf',
                'C:\\Windows\\Fonts\\arialbd.ttf',
                
                # macOS системные пути
                '/Library/Fonts/Arial.ttf',
                '/Library/Fonts/Arial Bold.ttf',
                
                # Попробуем найти в текущей директории
                os.path.join(os.path.dirname(__file__), 'fonts', 'DejaVuSans.ttf'),
                os.path.join(os.path.dirname(__file__), 'fonts', 'Arial.ttf'),
            ]
            
            # Регистрируем Arial (обычно есть в Windows)
            try:
                pdfmetrics.registerFont(TTFont('Arial', 'arial.ttf'))
                pdfmetrics.registerFont(TTFont('Arial-Bold', 'arialbd.ttf'))
                print("Шрифты Arial зарегистрированы")
                return 'Arial', 'Arial-Bold'
            except:
                pass
            
            # Ищем и регистрируем DejaVu
            for font_path in font_paths:
                if os.path.exists(font_path):
                    try:
                        # Регистрируем обычный шрифт
                        pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
                        
                        # Пытаемся найти и зарегистрировать жирный шрифт
                        bold_path = font_path.replace('Sans.ttf', 'Sans-Bold.ttf')
                        if os.path.exists(bold_path):
                            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', bold_path))
                        
                        print(f"Шрифты DejaVu зарегистрированы из {font_path}")
                        return 'DejaVuSans', 'DejaVuSans-Bold'
                    except Exception as e:
                        print(f"Ошибка регистрации шрифта {font_path}: {e}")
                        continue
            
            # Если не нашли шрифты, выводим предупреждение
            print("ВНИМАНИЕ: Шрифты с поддержкой кириллицы не найдены!")
            print("Текст в PDF будет отображаться некорректно.")
            print("Установите шрифты DejaVu или Arial в систему.")
            
            return 'Helvetica', 'Helvetica-Bold'
            
        except Exception as e:
            print(f"Ошибка при регистрации шрифтов: {e}")
            return 'Helvetica', 'Helvetica-Bold'
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            report_data = serializer.validated_data
            
            try:
                # Создаем запись отчета
                report = GeneratedReport.objects.create(
                    name=report_data.get('name', f"Отчет от {datetime.now().strftime('%d.%m.%Y')}"),
                    report_type=report_data['report_type'],
                    start_date=report_data['start_date'],
                    end_date=report_data['end_date'],
                    export_format='pdf',  # Согласно ТЗ - только PDF
                    generated_by=request.user
                )
                
                # Добавляем проекты если указаны
                if 'projects' in report_data and report_data['projects']:
                    report.projects.set(report_data['projects'])
                
                # Добавляем сотрудников если указаны
                if 'employees' in report_data and report_data['employees']:
                    report.employees.set(report_data['employees'])
                
                # Генерируем отчет
                success = self._generate_report_file(report)
                
                if success:
                    return Response(
                        GeneratedReportSerializer(report, context={'request': request}).data,
                        status=status.HTTP_201_CREATED
                    )
                else:
                    # Если генерация не удалась, удаляем запись
                    report.delete()
                    return Response(
                        {'error': 'Не удалось сгенерировать отчет'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
            except Exception as e:
                return Response(
                    {'error': f'Ошибка при создании отчета: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _generate_report_file(self, report):
        """Генерация файла отчета в формате PDF"""
        try:
            start_time = timezone.now()
            
            # Сбор данных для отчета согласно ТЗ
            data = self._collect_report_data(report)
            
            # Генерация PDF
            pdf_content = self._generate_pdf_report(report, data)
            
            if pdf_content:
                # Сохранение файла
                file_name = report.get_file_name()
                report.file.save(file_name, ContentFile(pdf_content))
                report.file_size = len(pdf_content)
                
                # Расчет времени генерации
                report.generation_time = (timezone.now() - start_time).total_seconds()
                report.is_success = True
                report.save()
                
                return True
            
            return False
            
        except Exception as e:
            report.is_success = False
            report.error_message = str(e)
            report.save()
            print(f"Ошибка генерации отчета: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _collect_report_data(self, report):
        """Сбор данных для отчета согласно ТЗ"""
        data = {
            'header': {
                'organization': 'ООО «АртСтудия»',
                'report_name': report.name,
                'period': f"{report.start_date.strftime('%d.%m.%Y')} - {report.end_date.strftime('%d.%m.%Y')}",
                'generated_at': report.generated_at.strftime('%d.%m.%Y %H:%M'),
                'generated_by': report.generated_by.get_full_name() if report.generated_by else 'Неизвестно',
            },
            'data': [],
            'summary': {},
            'has_data': False
        }
        
        try:
            if report.report_type == 'projects':
                data = self._collect_projects_data(report, data)
            elif report.report_type == 'tasks':
                data = self._collect_tasks_data(report, data)
            elif report.report_type == 'employees':
                data = self._collect_employees_data(report, data)
            elif report.report_type == 'tasks_period':
                data = self._collect_tasks_period_data(report, data)
            elif report.report_type == 'summary':
                data = self._collect_summary_data(report, data)
                
        except Exception as e:
            data['error'] = str(e)
            data['has_data'] = False
            
        return data
    
    def _collect_projects_data(self, report, data):
        """Сбор данных для отчета по проектам (согласно ТЗ п.5.1)"""
        from projects.models import Project
        
        # Фильтруем проекты
        projects_qs = Project.objects.filter(is_active=True)
        
        # По датам
        projects_qs = projects_qs.filter(
            Q(start_date__lte=report.end_date) & 
            (Q(planned_end_date__gte=report.start_date) | Q(planned_end_date__isnull=True))
        )
        
        # По выбранным проектам
        if report.projects.exists():
            projects_qs = projects_qs.filter(id__in=report.projects.values_list('id', flat=True))
        
        data['data'] = []
        total_projects = 0
        total_completion = 0
        
        for i, project in enumerate(projects_qs, 1):
            # Получаем задачи проекта
            tasks = project.task_set.filter(is_active=True)
            completed_tasks = tasks.filter(status='completed').count()
            total_tasks = tasks.count()
            
            # Процент выполнения
            completion_percentage = 0
            if total_tasks > 0:
                completion_percentage = round((completed_tasks / total_tasks) * 100, 1)
            
            project_data = [
                str(i),  # №
                project.title,  # Наименование проекта
                project.client.name if project.client else 'Не указан',  # Клиент
                project.manager.get_full_name() if project.manager else 'Не назначен',  # Ответственный менеджер
                project.start_date.strftime('%d.%m.%Y') if project.start_date else 'Не указана',  # Дата начала
                project.planned_end_date.strftime('%d.%m.%Y') if project.planned_end_date else 'Не указана',  # Плановая дата завершения
                project.get_status_display(),  # Статус проекта
                str(total_tasks),  # Количество задач всего
                str(completed_tasks),  # Количество выполненных задач
                f"{completion_percentage}%"  # Процент выполнения проекта
            ]
            
            data['data'].append(project_data)
            total_projects += 1
            total_completion += completion_percentage
        
        # Итоги (согласно ТЗ п.5.1)
        if total_projects > 0:
            avg_completion = round(total_completion / total_projects, 1)
            data['summary'] = {
                'total_projects': total_projects,
                'avg_completion': f"{avg_completion}%",
                'text': f"Всего проектов: {total_projects}, Средний процент выполнения: {avg_completion}%"
            }
            data['has_data'] = True
        else:
            data['summary'] = {'text': 'Нет данных за выбранный период'}
            data['has_data'] = False
            
        return data
    
    def _collect_tasks_data(self, report, data):
        """Сбор данных для отчета по задачам (согласно ТЗ п.5.2)"""
        from projects.models import Task
        
        # Фильтруем задачи
        tasks_qs = Task.objects.filter(is_active=True)
        
        # По датам создания
        tasks_qs = tasks_qs.filter(
            created_at__date__range=(report.start_date, report.end_date)
        )
        
        # По выбранным проектам
        if report.projects.exists():
            tasks_qs = tasks_qs.filter(project__in=report.projects.all())
        
        data['data'] = []
        
        for i, task in enumerate(tasks_qs, 1):
            task_data = [
                str(i),  # №
                task.title,  # Наименование задачи
                task.project.title if task.project else 'Без проекта',  # Проект
                task.assigned_to.get_full_name() if task.assigned_to else 'Не назначен',  # Исполнитель
                task.deadline.strftime('%d.%m.%Y') if task.deadline else 'Не указан',  # Срок выполнения
                task.get_status_display(),  # Статус задачи
                task.completed_at.strftime('%d.%m.%Y') if task.completed_at else 'Не выполнена'  # Фактическая дата выполнения
            ]
            
            data['data'].append(task_data)
        
        # Итоги
        if tasks_qs.exists():
            data['summary'] = {
                'total_tasks': tasks_qs.count(),
                'text': f"Всего задач: {tasks_qs.count()}"
            }
            data['has_data'] = True
        else:
            data['summary'] = {'text': 'Нет данных за выбранный период'}
            data['has_data'] = False
            
        return data
    
    def _collect_employees_data(self, report, data):
        """Сбор данных для отчета по загрузке сотрудников (согласно ТЗ п.5.3)"""
        from projects.models import Task
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Фильтруем сотрудников
        employees_qs = User.objects.filter(is_active=True, role__in=['employee', 'manager'])
        
        # По выбранным сотрудникам
        if report.employees.exists():
            employees_qs = employees_qs.filter(id__in=report.employees.values_list('id', flat=True))
        
        data['data'] = []
        total_employees = 0
        
        for i, employee in enumerate(employees_qs, 1):
            # Активные задачи
            active_tasks = Task.objects.filter(
                assigned_to=employee,
                is_active=True,
                status__in=['in_progress', 'review']
            ).count()
            
            # Выполненные задачи за период
            completed_tasks = Task.objects.filter(
                assigned_to=employee,
                is_active=True,
                status='completed',
                completed_at__date__range=(report.start_date, report.end_date)
            ).count()
            
            # Процент выполнения (если есть активные задачи)
            completion_percentage = 0
            if active_tasks > 0:
                completion_percentage = round((completed_tasks / max(active_tasks, 1)) * 100, 1)
            
            employee_data = [
                str(i),  # №
                employee.get_full_name(),  # Фамилия и имя сотрудника
                employee.position or 'Не указана',  # Должность
                str(active_tasks),  # Количество активных задач
                str(completed_tasks),  # Количество выполненных задач за период
                f"{completion_percentage}%"  # Процент выполнения задач
            ]
            
            data['data'].append(employee_data)
            total_employees += 1
        
        # Итоги
        if total_employees > 0:
            data['summary'] = {
                'total_employees': total_employees,
                'text': f"Всего сотрудников: {total_employees}"
            }
            data['has_data'] = True
        else:
            data['summary'] = {'text': 'Нет данных за выбранный период'}
            data['has_data'] = False
            
        return data
    
    def _collect_tasks_period_data(self, report, data):
        """Сбор данных для отчета по выполнению задач за период"""
        from projects.models import Task
        
        tasks_qs = Task.objects.filter(
            is_active=True,
            created_at__date__range=(report.start_date, report.end_date)
        )
        
        if report.projects.exists():
            tasks_qs = tasks_qs.filter(project__in=report.projects.all())
        
        data['data'] = []
        
        for i, task in enumerate(tasks_qs, 1):
            # Расчет задержки
            delay_days = 0
            if task.deadline and task.completed_at:
                if task.completed_at.date() > task.deadline:
                    delay_days = (task.completed_at.date() - task.deadline).days
            
            task_data = [
                str(i),  # №
                task.title,  # Задача
                task.project.title if task.project else 'Без проекта',  # Проект
                task.assigned_to.get_full_name() if task.assigned_to else 'Не назначен',  # Исполнитель
                task.get_status_display(),  # Статус
                task.deadline.strftime('%d.%m.%Y') if task.deadline else 'Не указан',  # Плановый срок
                task.completed_at.strftime('%d.%m.%Y') if task.completed_at else 'Не выполнена',  # Фактический срок
                str(delay_days) if delay_days > 0 else '0'  # Задержка (дней)
            ]
            
            data['data'].append(task_data)
        
        # Итоги
        if tasks_qs.exists():
            delayed_tasks = sum(1 for task in tasks_qs if task.deadline and task.completed_at and task.completed_at.date() > task.deadline)
            data['summary'] = {
                'total_tasks': tasks_qs.count(),
                'delayed_tasks': delayed_tasks,
                'text': f"Всего задач: {tasks_qs.count()}, С задержкой: {delayed_tasks}"
            }
            data['has_data'] = True
        else:
            data['summary'] = {'text': 'Нет данных за выбранный период'}
            data['has_data'] = False
            
        return data
    
    def _collect_summary_data(self, report, data):
        """Сбор данных для сводного отчета"""
        from projects.models import Project, Task
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Собираем статистику
        total_projects = Project.objects.filter(is_active=True).count()
        active_projects = Project.objects.filter(is_active=True, status__in=['in_progress', 'planning']).count()
        completed_projects = Project.objects.filter(is_active=True, status='completed').count()
        
        total_tasks = Task.objects.filter(is_active=True).count()
        completed_tasks = Task.objects.filter(is_active=True, status='completed').count()
        
        total_employees = User.objects.filter(is_active=True, role__in=['employee', 'manager']).count()
        
        # Задачи за период
        period_tasks = Task.objects.filter(
            created_at__date__range=(report.start_date, report.end_date),
            is_active=True
        ).count()
        
        period_completed = Task.objects.filter(
            completed_at__date__range=(report.start_date, report.end_date),
            is_active=True,
            status='completed'
        ).count()
        
        data['data'] = [
            ['Количество проектов всего', str(total_projects), '', ''],
            ['Активных проектов', str(active_projects), '', ''],
            ['Завершенных проектов', str(completed_projects), '', ''],
            ['Количество задач всего', str(total_tasks), '', ''],
            ['Выполненных задач всего', str(completed_tasks), '', ''],
            ['Количество сотрудников', str(total_employees), '', ''],
            ['Задач создано за период', str(period_tasks), '', ''],
            ['Задач выполнено за период', str(period_completed), '', ''],
        ]
        
        data['summary'] = {
            'text': f"Статистика за период {report.start_date.strftime('%d.%m.%Y')} - {report.end_date.strftime('%d.%m.%Y')}"
        }
        data['has_data'] = True
        
        return data
    
    def _generate_pdf_report(self, report, data):
        """Генерация PDF отчета согласно ТЗ"""
        try:
            buffer = io.BytesIO()
            
            # Регистрируем шрифты с поддержкой кириллицы
            normal_font, bold_font = self._register_fonts()
            
            # Создаем документ
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=20,
                leftMargin=20,
                topMargin=40,
                bottomMargin=40
            )
            
            story = []
            styles = getSampleStyleSheet()
            
            # ========== СОЗДАЕМ СТИЛИ С РУССКИМИ ШРИФТАМИ ==========
            
            # Стиль для заголовка
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontName=bold_font,
                fontSize=16,
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            # Стиль для подзаголовка
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Normal'],
                fontName=bold_font,
                fontSize=12,
                alignment=TA_CENTER,
                textColor=colors.gray,
                spaceAfter=20
            )
            
            # Стиль для метаданных
            meta_style = ParagraphStyle(
                'Meta',
                parent=styles['Normal'],
                fontName=normal_font,
                fontSize=10,
                textColor=colors.gray,
                spaceAfter=5
            )
            
            # Стиль для основного текста
            normal_style = ParagraphStyle(
                'NormalText',
                parent=styles['Normal'],
                fontName=normal_font,
                fontSize=10,
                spaceAfter=10
            )
            
            # Стиль для итогов
            summary_style = ParagraphStyle(
                'Summary',
                parent=styles['Normal'],
                fontName=bold_font,
                fontSize=11,
                alignment=TA_LEFT,
                spaceBefore=15,
                spaceAfter=15,
                textColor=colors.HexColor('#2c3e50')
            )
            
            # Стиль для сообщения об отсутствии данных
            no_data_style = ParagraphStyle(
                'NoData',
                parent=styles['Normal'],
                fontName=normal_font,
                fontSize=12,
                alignment=TA_CENTER,
                textColor=colors.gray,
                spaceBefore=50,
                spaceAfter=50
            )
            
            # Стиль для подвала
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontName=normal_font,
                fontSize=8,
                alignment=TA_CENTER,
                textColor=colors.gray,
                spaceBefore=20
            )
            
            # ========== ГЕНЕРАЦИЯ СОДЕРЖАНИЯ ОТЧЕТА ==========
            
            # 1. ЗАГОЛОВОК ОТЧЕТА (согласно ТЗ п.4, 7)
            story.append(Paragraph(data['header']['organization'], title_style))
            story.append(Paragraph(data['header']['report_name'], subtitle_style))
            story.append(Spacer(1, 10))
            
            # 2. МЕТАДАННЫЕ (согласно ТЗ п.4)
            meta_data = [
                f"<b>Период:</b> {data['header']['period']}",
                f"<b>Дата формирования:</b> {data['header']['generated_at']}",
                f"<b>Пользователь:</b> {data['header']['generated_by']}"
            ]
            
            for meta in meta_data:
                story.append(Paragraph(meta, meta_style))
            
            story.append(Spacer(1, 20))
            
            # 3. ТАБЛИЧНАЯ ЧАСТЬ 
            if data.get('has_data') and data['data']:
                # Заголовки столбцов в зависимости от типа отчета
                headers = self._get_report_headers(report.report_type)
                
                # Создаем таблицу
                table_data = [headers] + data['data']
                
                # Определяем ширину колонок в зависимости от типа отчета
                col_widths = self._get_column_widths(report.report_type, len(headers))
                
                # Создаем таблицу с заданными ширинами
                table = Table(table_data, colWidths=col_widths, repeatRows=1)
                
                # Стили для таблицы
                table_style = TableStyle([
                    # Заголовок
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), bold_font),
                    ('FONTSIZE', (0, 0), (-1, 0), 7),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    
                    # Данные
                    ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 1), (-1, -1), normal_font),
                    ('FONTSIZE', (0, 1), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                    
                    # Чередование строк
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                    
                    # Первая колонка (№) выровнять по центру
                    ('ALIGN', (0, 1), (0, -1), 'CENTER'),
                    
                    # Последняя колонка (проценты/задержка) выровнять по центру
                    ('ALIGN', (-1, 1), (-1, -1), 'CENTER'),
                ])
                
                table.setStyle(table_style)
                story.append(table)
                story.append(Spacer(1, 15))
                
                # 4. ИТОГИ (согласно ТЗ п.5.1)
                if 'summary' in data and 'text' in data['summary']:
                    story.append(Paragraph(f"<b>Итоги:</b> {data['summary']['text']}", summary_style))
            else:
                # Сообщение об отсутствии данных (согласно ТЗ п.6)
                story.append(Paragraph("Данные для формирования отчета отсутствуют", no_data_style))
            
            # 5. ПОДВАЛ (согласно ТЗ п.7)
            story.append(Spacer(1, 30))
            story.append(Paragraph(f"Отчет сформирован программой управления проектами ООО «АртСтудия»", footer_style))
            
            # Собираем документ
            doc.build(story)
            buffer.seek(0)
            
            return buffer.getvalue()
            
        except Exception as e:
            print(f"Error generating PDF: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _get_report_headers(self, report_type):
        """Получение заголовков столбцов согласно ТЗ"""
        headers_by_type = {
            'projects': [
                '№', 'Наименование проекта', 'Клиент', 'Ответственный менеджер',
                'Дата начала', 'Плановая дата завершения', 'Статус проекта',
                'Кол-во задач всего', 'Кол-во выполненных задач', 'Процент выполнения'
            ],
            'tasks': [
                '№', 'Наименование задачи', 'Проект', 'Исполнитель',
                'Срок выполнения', 'Статус задачи', 'Фактическая дата выполнения'
            ],
            'employees': [
                '№', 'Фамилия и имя сотрудника', 'Должность',
                'Кол-во активных задач', 'Кол-во выполненных задач за период',
                'Процент выполнения задач'
            ],
            'tasks_period': [
                '№', 'Задача', 'Проект', 'Исполнитель', 'Статус',
                'Плановый срок', 'Фактический срок', 'Задержка (дней)'
            ],
            'summary': [
                'Показатель', 'Значение', 'Изменение', 'Примечание'
            ],
        }
        
        return headers_by_type.get(report_type, ['Данные'])
    
    def _get_column_widths(self, report_type, num_columns):
        """Определение ширины столбцов для таблицы"""
        # Базовые ширины (в точках)
        base_widths = {
            'projects': [20, 150, 80, 100, 60, 70, 80, 50, 60, 60],
            'tasks': [20, 150, 100, 80, 60, 80, 80],
            'employees': [20, 120, 80, 60, 80, 60],
            'tasks_period': [20, 120, 100, 80, 60, 60, 60, 50],
            'summary': [150, 80, 80, 150],
        }
        
        return base_widths.get(report_type, [100] * num_columns)


class GeneratedReportViewSet(viewsets.ModelViewSet):
    """API для управления отчетами согласно ТЗ"""
    queryset = GeneratedReport.objects.filter(is_active=True)
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated, CanViewReport]
    filter_backends = [DjangoFilterBackend]
    filterset_class = GeneratedReportFilter
    
    def get_queryset(self):
        """Фильтрация отчетов по пользователю"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Директор видит все отчеты
        if user.role == 'director':
            return queryset
        
        # Остальные видят только свои отчеты
        return queryset.filter(generated_by=user)
    
    def get_serializer_context(self):
        """Добавляем request в контекст"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Скачивание отчета (согласно ТЗ п.3)"""
        report = self.get_object()
        
        if not report.file:
            return Response(
                {'error': 'Файл отчета не сгенерирован'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            response = FileResponse(report.file.open('rb'), as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{report.get_file_name()}"'
            return response
        except Exception as e:
            return Response(
                {'error': f'Ошибка при скачивании файла: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Повторная генерация отчета"""
        report = self.get_object()
        
        # Генерируем отчет заново
        view = ReportGenerationView()
        success = view._generate_report_file(report)
        
        if success:
            return Response({'status': 'Отчет успешно перегенерирован'})
        else:
            return Response(
                {'error': 'Не удалось перегенерировать отчет'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Архивация отчета"""
        report = self.get_object()
        report.archive()
        return Response({'status': 'Отчет архивирован'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановление отчета из архива"""
        report = self.get_object()
        report.is_archived = False
        report.save()
        return Response({'status': 'Отчет восстановлен'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика по отчетам"""
        user = request.user
        total_reports = self.get_queryset().count()
        successful_reports = self.get_queryset().filter(is_success=True).count()
        archived_reports = self.get_queryset().filter(is_archived=True).count()
        
        return Response({
            'total_reports': total_reports,
            'successful_reports': successful_reports,
            'archived_reports': archived_reports,
            'success_rate': round((successful_reports / total_reports * 100) if total_reports > 0 else 0, 1)
        })
    
    def perform_destroy(self, instance):
        """Логическое удаление отчета"""
        instance.is_active = False
        instance.save()