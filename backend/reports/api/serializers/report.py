from rest_framework import serializers
from datetime import datetime, timedelta
from ...models import GeneratedReport, ReportTemplate
from projects.models import Project
from django.contrib.auth import get_user_model

User = get_user_model()

class ReportTemplateSerializer(serializers.ModelSerializer):
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    available_columns = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'template_type', 'template_type_display',
            'description', 'frequency', 'frequency_display',
            'include_columns', 'default_parameters',
            'show_totals', 'show_header', 'show_footer',
            'is_active', 'is_default', 'created_at', 'updated_at',
            'available_columns'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'available_columns']
    
    def get_available_columns(self, obj):
        return obj.get_available_columns()

class GeneratedReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    export_format_display = serializers.CharField(source='get_export_format_display', read_only=True)
    generated_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    projects_count = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    can_download = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'name', 'report_type', 'report_type_display',
            'start_date', 'end_date', 'projects', 'employees',
            'export_format', 'export_format_display',
            'file', 'file_url', 'file_size', 'file_size_formatted',
            'generated_by', 'generated_by_name', 'generated_at',
            'generation_time', 'is_success', 'error_message',
            'projects_count', 'duration_days', 'can_download',
            'is_active', 'is_archived'
        ]
        read_only_fields = [
            'id', 'generated_at', 'generation_time', 'is_success',
            'error_message', 'file_size', 'file', 'generated_by'
        ]
    
    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return obj.generated_by.get_full_name()
        return 'Неизвестно'
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
    
    def get_file_size_formatted(self, obj):
        return obj.get_formatted_file_size()
    
    def get_projects_count(self, obj):
        return obj.projects.count()
    
    def get_duration_days(self, obj):
        return (obj.end_date - obj.start_date).days
    
    def get_can_download(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return obj.can_view(request.user)
        return False
    
    def validate(self, data):
        """Валидация согласно ТЗ п.3"""
        errors = {}
        
        # Проверка дат
        if 'start_date' in data and 'end_date' in data:
            if data['start_date'] > data['end_date']:
                errors['start_date'] = 'Дата начала не может быть позже даты окончания'
            
            # Максимальный период - 1 год
            max_duration = 365
            if (data['end_date'] - data['start_date']).days > max_duration:
                errors['end_date'] = f'Период не может превышать {max_duration} дней'
            
            # Дата окончания не может быть в будущем
            if data['end_date'] > datetime.now().date():
                errors['end_date'] = 'Конечная дата не может быть в будущем'
        
        # Проверка для отчетов по сотрудникам
        if data.get('report_type') == 'employees' and 'employees' not in data:
            errors['employees'] = 'Для отчета по сотрудникам необходимо указать хотя бы одного сотрудника'
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data

class ReportGenerationSerializer(serializers.Serializer):
    """Сериализатор для генерации отчетов согласно ТЗ"""
    name = serializers.CharField(required=False, max_length=255)
    report_type = serializers.ChoiceField(choices=GeneratedReport.REPORT_TYPES)
    template = serializers.PrimaryKeyRelatedField(
        queryset=ReportTemplate.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    projects = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Project.objects.filter(is_active=True),
        required=False
    )
    employees = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(is_active=True),
        required=False
    )
    
    def validate(self, data):
        # Автоматическое название отчета, если не указано
        if not data.get('name'):
            report_type_display = dict(GeneratedReport.REPORT_TYPES)[data['report_type']]
            start_str = data['start_date'].strftime('%d.%m.%Y')
            end_str = data['end_date'].strftime('%d.%m.%Y')
            data['name'] = f"{report_type_display} за период {start_str} - {end_str}"
        
        return data