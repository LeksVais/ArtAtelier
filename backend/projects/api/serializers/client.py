from rest_framework import serializers
from core.models import Client
from core.api.serializers import UserSerializer


class ClientSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone',
            'address', 'website', 'description', 'is_active',
            'is_archived', 'created_by', 'created_by_name',
            'updated_by', 'updated_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return str(obj.created_by) if obj.created_by else None
    
    def get_updated_by_name(self, obj):
        return str(obj.updated_by) if obj.updated_by else None


class ClientDetailSerializer(ClientSerializer):
    projects_count = serializers.SerializerMethodField()
    active_projects = serializers.SerializerMethodField()
    
    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + [
            'projects_count', 'active_projects'
        ]
    
    def get_projects_count(self, obj):
        return obj.project_set.count()
    
    def get_active_projects(self, obj):
        return obj.project_set.filter(
            is_active=True,
            status__in=['planned', 'in_work', 'on_approval']
        ).count()