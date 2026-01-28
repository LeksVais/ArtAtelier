from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from ...models import Task
from ..serializers import TaskSerializer, TaskDetailSerializer, TaskCreateSerializer
from ..permissions import CanEditTask, CanViewTask
from ..filters import TaskFilter

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.filter(is_active=True)
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['deadline', 'priority', 'created_at']
    
    def create(self, request, *args, **kwargs):
        print("=" * 50)
        print("DEBUG: TaskViewSet.create() called!")
        print(f"Request method: {request.method}")
        print(f"Request path: {request.path}")
        print(f"Request data: {request.data}")
        print(f"View action: {self.action}")
        print("=" * 50)
        
        # Проверяем URL
        print(f"Resolved URL name: {self.get_view_name()}")
        
        return super().create(request, *args, **kwargs)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        elif self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer
    
    def get_permissions(self):
        # Настраиваем permissions в зависимости от действия
        if self.action == 'create':
            # Для создания задач используем CanViewTask, который теперь разрешает POST
            self.permission_classes = [IsAuthenticated, CanViewTask]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, CanEditTask]
        # Для кастомных действий используем CanEditTask
        elif self.action in ['take_to_work', 'send_to_review', 'complete', 
                           'return_for_revision', 'update_progress', 'change_assignee']:
            self.permission_classes = [IsAuthenticated, CanEditTask]
        # Для остальных действий (list, retrieve, my_tasks, overdue) используем CanViewTask
        else:
            self.permission_classes = [IsAuthenticated, CanViewTask]
        
        return super().get_permissions()
    
    def get_queryset(self):
        """Фильтрация по правам доступа - ИСПРАВЛЕННЫЙ ВАРИАНТ"""
        user = self.request.user
        
        if not user.is_authenticated:
            return Task.objects.none()
        
        # Для директора - все задачи
        if hasattr(user, 'role') and user.role == 'director':
            return super().get_queryset()
        
        # Для менеджера - задачи своих проектов или свои задачи
        elif hasattr(user, 'role') and user.role == 'manager':
            return super().get_queryset().filter(
                Q(project__manager=user) | 
                Q(assigned_to=user) |
                Q(created_by=user)
            ).distinct()
        
        # Для остальных - только свои задачи
        else:
            return super().get_queryset().filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()
    
    def perform_create(self, serializer):
        """Создание задачи с установкой создателя"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Задачи текущего пользователя"""
        tasks = self.get_queryset().filter(
            assigned_to=request.user,
        ).order_by('deadline')
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Просроченные задачи"""
        tasks = self.get_queryset().filter(
            deadline__lt=timezone.now().date(),
            status__in=['created', 'in_work']
        ).order_by('deadline')
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def take_to_work(self, request, pk=None):
        """Взять задачу в работу"""
        task = self.get_object()
        
        if task.status != 'created':
            return Response(
                {'error': 'Задачу можно взять в работу только из статуса "Создана"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.assigned_to = request.user
        task.status = 'in_work'
        task.save()
        
        return Response({'status': 'Задача взята в работу'})
    
    @action(detail=True, methods=['post'])
    def send_to_review(self, request, pk=None):
        """Отправить задачу на проверку"""
        task = self.get_object()
        
        if task.status != 'in_work':
            return Response(
                {'error': 'Задачу можно отправить на проверку только из статуса "В работе"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if task.assigned_to != request.user:
            return Response(
                {'error': 'Только исполнитель может отправить задачу на проверку'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'on_review'
        task.save()
        
        return Response({'status': 'Задача отправлена на проверку'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Завершить задачу"""
        task = self.get_object()
        
        if task.status != 'on_review':
            return Response(
                {'error': 'Задачу можно завершить только из статуса "На проверке"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        

        user_can_complete = (
            request.user.role in ['director', 'manager'] or 
            task.assigned_to == request.user  
        )
    
        if not user_can_complete:
            return Response(
                {'error': 'Только руководитель, менеджер или исполнитель задачи может завершить задачу'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.progress = 100
        task.save()
        
        return Response({'status': 'Задача завершена'})
    
    @action(detail=True, methods=['post'])
    def return_for_revision(self, request, pk=None):
        """Вернуть задачу на доработку"""
        task = self.get_object()
        
        if task.status != 'on_review':
            return Response(
                {'error': 'Задачу можно вернуть только из статуса "На проверке"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.user.role not in ['director', 'manager']:
            return Response(
                {'error': 'Только руководитель или менеджер может вернуть задачу'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'in_work'
        task.save()
        
        return Response({'status': 'Задача возвращена на доработку'})
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Обновить прогресс выполнения"""
        task = self.get_object()
        progress = request.data.get('progress')
        
        if not isinstance(progress, int) or not (0 <= progress <= 100):
            return Response(
                {'error': 'Прогресс должен быть целым числом от 0 до 100'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if task.assigned_to != request.user:
            return Response(
                {'error': 'Только исполнитель может обновлять прогресс'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.progress = progress
        task.save()
        
        return Response({'status': 'Прогресс обновлен'})
    
    @action(detail=True, methods=['post'])
    def change_assignee(self, request, pk=None):
        """Изменить исполнителя задачи"""
        task = self.get_object()
        new_assignee_id = request.data.get('assignee_id')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            new_assignee = User.objects.get(id=new_assignee_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        task.assigned_to = new_assignee
        task.save()
        
        return Response({'status': 'Исполнитель изменен'})
    
    def perform_destroy(self, instance):
        """Логическое удаление задачи"""
        instance.is_active = False
        instance.save()