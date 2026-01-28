from rest_framework import serializers
from django.db.models import Count
from django.utils import timezone
from ...models import Project, Task, ProjectMember
from core.api.serializers import UserSerializer, ClientSerializer as CoreClientSerializer

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'client', 'client_name',
            'manager', 'manager_name', 'start_date', 'planned_end_date',
            'actual_end_date', 'status', 'status_display', 'priority',
            'priority_display', 'budget', 'tasks_count', 'completed_tasks',
            'progress_percentage', 'days_remaining', 'created_at', 'updated_at',
            'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'actual_end_date']
    
    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}" if obj.manager.first_name and obj.manager.last_name else obj.manager.username
        return ''
    
    def get_tasks_count(self, obj):
        return Task.objects.filter(project=obj, is_active=True).count()
    
    def get_completed_tasks(self, obj):
        return Task.objects.filter(project=obj, is_active=True, status='completed').count()
    
    def get_progress_percentage(self, obj):
        total = self.get_tasks_count(obj)
        completed = self.get_completed_tasks(obj)
        if total > 0:
            return round((completed / total) * 100, 1)
        return 0
    
    def get_days_remaining(self, obj):
        if obj.planned_end_date:
            remaining = (obj.planned_end_date - timezone.now().date()).days
            return max(0, remaining)
        return None


class ProjectDetailSerializer(ProjectSerializer):
    client_details = CoreClientSerializer(source='client', read_only=True)
    manager_details = UserSerializer(source='manager', read_only=True)
    tasks = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + [
            'client_details', 'manager_details', 'tasks',
            'members'
        ]
    
    def get_tasks(self, obj):
        from .task import TaskSerializer
        tasks = Task.objects.filter(project=obj, is_active=True).order_by('priority', 'deadline')[:20]
        return TaskSerializer(tasks, many=True).data
    
    def get_members(self, obj):
        from core.api.serializers import EmployeeSerializer
        members = ProjectMember.objects.filter(project=obj, is_active=True).select_related('employee__user')
        return [
            {
                'id': member.id,
                'employee': EmployeeSerializer(member.employee).data,
                'role': member.get_role_display(),
                'joined_at': member.joined_at
            }
            for member in members
        ]


class ProjectStatsSerializer(serializers.Serializer):
    active_projects = serializers.IntegerField()
    tasks_today = serializers.IntegerField()
    on_approval = serializers.IntegerField()
    completed_this_month = serializers.IntegerField()


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'client', 'manager',
            'start_date', 'planned_end_date', 'priority', 'budget'
        ]
    
    def validate(self, data):
        if data['start_date'] < timezone.now().date():
            raise serializers.ValidationError({
                'start_date': 'Дата начала не может быть в прошлом'
            })
        
        if data['planned_end_date'] <= data['start_date']:
            raise serializers.ValidationError({
                'planned_end_date': 'Дата завершения должна быть позже даты начала'
            })
        
        return data