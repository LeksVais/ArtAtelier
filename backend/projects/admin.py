# projects/admin.py
from django.contrib import admin
from .models import Project, Task, ProjectMember

class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1
    raw_id_fields = ('employee',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'manager', 'status', 'priority', 'start_date', 'planned_end_date', 'is_active')
    list_filter = ('status', 'is_active', 'start_date', 'planned_end_date', 'priority')
    search_fields = ('title', 'description', 'client__name', 'manager__username')
    readonly_fields = ('created_at', 'actual_end_date')  # Убрал updated_at
    raw_id_fields = ('client', 'manager')
    inlines = [ProjectMemberInline]
    
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assigned_to', 'status', 'priority', 'deadline', 'progress', 'is_active')
    list_filter = ('status', 'priority', 'is_active', 'created_at')
    search_fields = ('title', 'description', 'project__title', 'assigned_to__username')
    readonly_fields = ('created_at', 'completed_at')  # Убрал updated_at
    raw_id_fields = ('project', 'assigned_to', 'created_by')
    date_hierarchy = 'deadline'

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('project', 'employee', 'role', 'joined_at', 'is_active')
    list_filter = ('role', 'joined_at', 'is_active')
    raw_id_fields = ('project', 'employee')
    search_fields = ('project__title', 'employee__user__username')