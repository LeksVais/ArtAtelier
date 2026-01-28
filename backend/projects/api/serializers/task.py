# projects/serializers/task.py
from rest_framework import serializers
from django.utils import timezone
from ...models import Task
from core.api.serializers import UserSerializer

# Вспомогательный импорт для избежания циклической зависимости
try:
    from .project import ProjectSerializer as ProjectSerializerClass
    PROJECT_SERIALIZER_AVAILABLE = True
except ImportError:
    PROJECT_SERIALIZER_AVAILABLE = False
    ProjectSerializerClass = None


class TaskSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    days_until_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project', 'project_title',
            'assigned_to', 'assigned_to_name', 'created_by', 'created_by_name',
            'deadline', 'completed_at', 'status', 'status_display',
            'priority', 'priority_display', 'progress', 'estimated_hours',
            'actual_hours', 'is_overdue', 'days_until_deadline',
            'created_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return str(obj.assigned_to)
        return None
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return str(obj.created_by)
        return None
    
    def get_is_overdue(self, obj):
        return obj.deadline < timezone.now().date() and obj.status not in ['completed', 'cancelled']
    
    def get_days_until_deadline(self, obj):
        days = (obj.deadline - timezone.now().date()).days
        return days
    
    def validate(self, data):
        # Проверка дедлайна
        if 'deadline' in data and data['deadline'] < timezone.now().date():
            raise serializers.ValidationError({
                'deadline': 'Срок выполнения не может быть в прошлом'
            })
        
        # Проверка прогресса
        if 'progress' in data and not 0 <= data['progress'] <= 100:
            raise serializers.ValidationError({
                'progress': 'Прогресс должен быть от 0 до 100'
            })
        
        # Проверка конфликта исполнителя
        if 'assigned_to' in data and 'deadline' in data:
            conflicting_tasks = Task.objects.filter(
                assigned_to=data['assigned_to'],
                deadline=data['deadline'],
                status__in=['created', 'in_work'],
                is_active=True
            ).exclude(id=self.instance.id if self.instance else None)
            
            if conflicting_tasks.exists():
                raise serializers.ValidationError({
                    'assigned_to': 'Исполнитель уже имеет задачу на этот срок'
                })
        
        return data


class TaskDetailSerializer(TaskSerializer):
    project_details = serializers.SerializerMethodField()
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    comments = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    time_logs = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + [
            'project_details', 'assigned_to_details', 'created_by_details',
            'comments', 'files', 'time_logs'
        ]
    
    def get_project_details(self, obj):
        if not PROJECT_SERIALIZER_AVAILABLE:
            # Пробуем импортировать локально
            try:
                from .project import ProjectSerializer
                return ProjectSerializer(obj.project).data
            except ImportError:
                return {}
        else:
            return ProjectSerializerClass(obj.project).data
    
    def get_comments(self, obj):
        try:
            from comments.models import Comment
            from comments.api.serializers import CommentSerializer
            
            comments = Comment.objects.filter(
                content_type='task',
                object_id=obj.id,
                is_active=True
            ).order_by('-created_at')
            
            return CommentSerializer(comments, many=True).data
        except (ImportError, AttributeError):
            return []
    
    def get_files(self, obj):
        try:
            from files.api.serializers import ProjectFileSerializer
            from files.models import ProjectFile
            
            files = ProjectFile.objects.filter(task=obj, is_active=True).order_by('-uploaded_at')
            return ProjectFileSerializer(files, many=True).data
        except (ImportError, AttributeError):
            return []
    
    def get_time_logs(self, obj):
        # Здесь можно добавить логи времени, если такая функция будет реализована
        return []


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'project', 'assigned_to',
            'deadline', 'priority', 'estimated_hours'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)