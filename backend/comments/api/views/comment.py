from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from ...models import Comment
from ..serializers import CommentSerializer, CommentCreateSerializer

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CommentCreateSerializer
        return CommentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'director':
            return Comment.objects.filter(is_active=True)
        elif user.role == 'manager':
            # Менеджер видит комментарии к своим проектам и задачам
            from projects.models import Project, Task
            manager_projects = Project.objects.filter(manager=user).values_list('id', flat=True)
            project_tasks = Task.objects.filter(project__in=manager_projects).values_list('id', flat=True)
            
            return Comment.objects.filter(
                Q(is_active=True) &
                (Q(content_type='project', object_id__in=manager_projects) |
                 Q(content_type='task', object_id__in=project_tasks) |
                 Q(author=user))
            )
        else:
            # Обычные пользователи видят только свои комментарии
            return Comment.objects.filter(author=user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Ответ на комментарий"""
        parent_comment = self.get_object()
        serializer = CommentCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            # Создаем ответный комментарий
            reply = Comment.objects.create(
                author=request.user,
                content_type=parent_comment.content_type,
                object_id=parent_comment.object_id,
                text=serializer.validated_data['text']
            )
            
            return Response(
                CommentSerializer(reply).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_destroy(self, instance):
        """Логическое удаление комментария"""
        instance.is_active = False
        instance.save()

class ObjectCommentsView(generics.ListAPIView):
    """Получение комментариев для конкретного объекта"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        content_type = self.kwargs.get('content_type')
        object_id = self.kwargs.get('object_id')
        
        return Comment.objects.filter(
            content_type=content_type,
            object_id=object_id,
            is_active=True
        ).order_by('-created_at')