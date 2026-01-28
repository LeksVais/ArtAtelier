# reports/admin.py
from django.contrib import admin
from .models import ReportTemplate, GeneratedReport

@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'template_type', 'is_active', 'created_at')
    list_filter = ('template_type', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)

@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ('name', 'report_type', 'generated_by', 'is_success', 'generated_at', 'file')
    list_filter = ('report_type', 'is_success', 'export_format', 'generated_at')
    search_fields = ('name', 'generated_by__username')
    readonly_fields = ('generated_at', 'generation_time', 'error_message', 'file_size')
    raw_id_fields = ('generated_by',)
    list_editable = ('is_success',)