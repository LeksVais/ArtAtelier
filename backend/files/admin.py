# files/admin.py
from django.contrib import admin
from .models import FileCategory, ProjectFile, FileVersionHistory

@admin.register(FileCategory)
class FileCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    readonly_fields = ('get_name_display',)
    
    def get_name_display(self, obj):
        return obj.get_name_display()
    get_name_display.short_description = "Название категории"

class FileVersionHistoryInline(admin.TabularInline):
    model = FileVersionHistory
    extra = 0
    readonly_fields = ('version', 'uploaded_by', 'uploaded_at', 'file_size', 'changes_description')
    raw_id_fields = ('uploaded_by',)

@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'task', 'file_type', 'uploaded_by', 'uploaded_at', 'is_current', 'is_active')
    list_filter = ('file_type', 'is_active', 'uploaded_at', 'is_current')
    search_fields = ('name', 'original_filename', 'description', 'project__title')
    readonly_fields = ('uploaded_at', 'size', 'original_filename', 'version')
    raw_id_fields = ('project', 'task', 'uploaded_by', 'category')
    inlines = [FileVersionHistoryInline]
    
    def file_name(self, obj):
        return obj.name
    file_name.short_description = 'Название файла'

@admin.register(FileVersionHistory)
class FileVersionHistoryAdmin(admin.ModelAdmin):
    list_display = ('project_file', 'version', 'uploaded_by', 'uploaded_at', 'file_size')
    list_filter = ('uploaded_at',)
    readonly_fields = ('uploaded_at', 'file_size')
    raw_id_fields = ('project_file', 'uploaded_by')