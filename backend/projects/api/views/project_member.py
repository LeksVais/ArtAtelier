from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from ...models import ProjectMember
from ..serializers import ProjectMemberSerializer
from ..permissions import CanEditProject

class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.filter(is_active=True)
    serializer_class = ProjectMemberSerializer
    permission_classes = [permissions.IsAuthenticated, CanEditProject]
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset
    
    @action(detail=True, methods=['post'])
    def remove_from_project(self, request, pk=None):
        """Удаление участника из проекта"""
        member = self.get_object()
        member.is_active = False
        member.save()
        
        return Response({'status': 'Участник удален из проекта'})
    
    def perform_destroy(self, instance):
        """Логическое удаление участника"""
        instance.is_active = False
        instance.save()