from rest_framework import serializers
from ...models import Client

class ClientSerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()
    active_project_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_person', 'phone', 'email',
            'website', 'address', 'notes', 'project_count',
            'active_project_count', 'created_at', 'is_active', 'is_archived'
        ]
        read_only_fields = ['id', 'created_at', 'project_count', 'active_project_count']
    
    def get_project_count(self, obj):
        return obj.project_set.filter(is_active=True).count()
    
    def get_active_project_count(self, obj):
        return obj.project_set.filter(
            is_active=True,
            status__in=['planned', 'in_work', 'on_approval']
        ).count()

class ClientDetailSerializer(ClientSerializer):
    projects = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()
    
    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + ['projects', 'recent_comments']
    
    def get_projects(self, obj):
        from projects.api.serializers import ProjectSerializer
        projects = obj.project_set.filter(is_active=True).order_by('-created_at')[:10]
        return ProjectSerializer(projects, many=True).data
    
    def get_recent_comments(self, obj):
        from comments.api.serializers import CommentSerializer
        from comments.models import Comment
        
        comments = Comment.objects.filter(
            content_type='client',
            object_id=obj.id,
            is_active=True
        ).order_by('-created_at')[:5]
        
        return CommentSerializer(comments, many=True).data