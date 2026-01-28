from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ...models import Project, Task, ProjectMember
from ..serializers import (
    ProjectSerializer, ProjectDetailSerializer,
    ProjectCreateSerializer, TaskSerializer,
    ProjectMemberSerializer
)
from ..permissions import CanViewProject, CanEditProject
from ..filters import ProjectFilter

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.filter(is_active=True)
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['title', 'description', 'client__name', 'manager__username']
    ordering_fields = ['created_at', 'start_date', 'planned_end_date', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateSerializer
        return ProjectSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'archive', 'restore']:
            return [permissions.IsAuthenticated(), CanEditProject()]
        elif self.action in ['list', 'retrieve', 'archived']:
            return [permissions.IsAuthenticated(), CanViewProject()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """Фильтрация проектов по правам доступа"""
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'director':
            return queryset
        elif user.role == 'manager':
            # Менеджер видит проекты, где он менеджер или участник
            return queryset.filter(
                Q(manager=user) | 
                Q(projectmember__employee__user=user)
            ).distinct()
        else:
            # Обычные сотрудники видят проекты, где они участники
            return queryset.filter(projectmember__employee__user=user).distinct()
    
    def get_object(self):
        """
        Переопределяем get_object, чтобы можно было получать архивные проекты
        при запросе деталей или выполнении действий над ними
        """
        if self.action in ['retrieve', 'tasks', 'members', 'add_member', 
                          'change_status', 'archive', 'restore']:
            # Для этих действий разрешаем доступ к неактивным проектам
            queryset = Project.objects.all()  # Все проекты, включая архивные
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            obj = get_object_or_404(queryset, **filter_kwargs)
            
            # Проверяем права доступа
            self.check_object_permissions(self.request, obj)
            return obj
        
        return super().get_object()
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Статистика для дашборда"""
        user = request.user
        projects = self.get_queryset()
        
        stats = {
            'total_projects': projects.count(),
            'active_projects': projects.filter(status='in_work').count(),
            'planned_projects': projects.filter(status='planned').count(),
            'on_approval_projects': projects.filter(status='on_approval').count(),
            'completed_projects': projects.filter(status='completed').count(),
            'paused_projects': projects.filter(status='paused').count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Получение задач проекта"""
        project = self.get_object()
        tasks = project.task_set.filter(is_active=True)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Получение участников проекта"""
        project = self.get_object()
        members = project.projectmember_set.filter(is_active=True)
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Добавление участника в проект"""
        project = self.get_object()
        
        # Нельзя добавлять участников в архивный проект
        if not project.is_active:
            return Response(
                {'error': 'Нельзя добавлять участников в архивный проект'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee_id = request.data.get('employee_id')
        role = request.data.get('role')
        
        if not employee_id or not role:
            return Response(
                {'error': 'Необходимо указать employee_id и role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from core.models import Employee
        try:
            employee = Employee.objects.get(id=employee_id, is_active=True)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Сотрудник не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, не добавлен ли уже сотрудник
        if ProjectMember.objects.filter(project=project, employee=employee, is_active=True).exists():
            return Response(
                {'error': 'Сотрудник уже является участником проекта'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member = ProjectMember.objects.create(
            project=project,
            employee=employee,
            role=role
        )
        
        serializer = ProjectMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Изменение статуса проекта"""
        project = self.get_object()
        
        # Нельзя менять статус архивного проекта
        if not project.is_active:
            return Response(
                {'error': 'Нельзя менять статус архивного проекта'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_status = request.data.get('status')
        
        if new_status not in dict(Project.STATUS_CHOICES):
            return Response(
                {'error': 'Неверный статус'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.status = new_status
        
        # Если статус 'completed', устанавливаем фактическую дату завершения
        if new_status == 'completed':
            project.actual_end_date = timezone.now().date()
        
        project.save()
        
        serializer = self.get_serializer(project)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """Получение архивных проектов"""
        user = request.user
        archived_projects = Project.objects.filter(is_active=False)
        
        # Фильтрация по правам доступа
        if user.role == 'director':
            projects = archived_projects
        elif user.role == 'manager':
            projects = archived_projects.filter(
                Q(manager=user) | 
                Q(projectmember__employee__user=user)
            ).distinct()
        else:
            projects = archived_projects.filter(projectmember__employee__user=user).distinct()
        
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановление проекта из архива"""
        try:
            project = Project.objects.get(pk=pk, is_active=False)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Проект не найден или не архивирован'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, что проект действительно архивный
        if project.is_active:
            return Response(
                {'error': 'Проект уже активен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Восстанавливаем проект
        project.is_active = True
        project.is_archived = False
        project.restored_at = timezone.now()
        project.restored_by = request.user
        project.save()
        
        # Восстанавливаем все задачи проекта
        project.task_set.update(is_active=True)
        
        serializer = self.get_serializer(project)
        return Response({
            'status': 'Проект восстановлен',
            'project': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Архивация проекта"""
        project = self.get_object()
        
        # Проверяем, что проект активен
        if not project.is_active:
            return Response(
                {'error': 'Проект уже архивирован'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка активных задач
        active_tasks = project.task_set.filter(
            is_active=True,
            status__in=['created', 'in_work', 'on_review']
        ).exists()
        
        if active_tasks:
            return Response(
                {'error': 'Нельзя архивировать проект с активными задачами'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Архивируем проект
        project.is_active = False
        project.is_archived = True
        project.archived_at = timezone.now()
        project.archived_by = request.user
        project.save()
        
        # Архивируем все задачи проекта
        project.task_set.update(is_active=False)
        
        serializer = self.get_serializer(project)
        return Response({
            'status': 'Проект архивирован',
            'project': serializer.data
        })
    
    def perform_create(self, serializer):
        """При создании проекта устанавливаем создателя как менеджера по умолчанию"""
        if 'manager' not in serializer.validated_data:
            serializer.validated_data['manager'] = self.request.user
        serializer.save()
    
    def perform_update(self, serializer):
        """При обновлении проекта"""
        instance = serializer.save()
    
    def perform_destroy(self, instance):
        """Логическое удаление проекта"""
        instance.is_active = False
        instance.is_archived = True
        instance.archived_at = timezone.now()
        instance.archived_by = self.request.user
        instance.save()
        
        # Архивируем все задачи проекта
        instance.task_set.update(is_active=False)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.filter(is_active=True)
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'project', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            from ..serializers import TaskDetailSerializer
            return TaskDetailSerializer
        elif self.action == 'create':
            from ..serializers import TaskCreateSerializer
            return TaskCreateSerializer
        return TaskSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from ..permissions import CanEditTask
            return [permissions.IsAuthenticated(), CanEditTask()]
        else:
            from ..permissions import CanViewTask
            return [permissions.IsAuthenticated(), CanViewTask()]
    
    def get_queryset(self):
        """Фильтрация задач по правам доступа"""
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'director':
            return queryset
        elif user.role == 'manager':
            # Менеджер видит задачи своих проектов или задачи, назначенные ему
            return queryset.filter(
                Q(project__manager=user) |
                Q(assigned_to=user) |
                Q(created_by=user)
            ).distinct()
        else:
            # Обычные сотрудники видят только свои задачи
            return queryset.filter(
                Q(assigned_to=user) |
                Q(created_by=user)
            ).distinct()
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Задачи текущего пользователя"""
        user = request.user
        tasks = self.get_queryset().filter(assigned_to=user)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Просроченные задачи"""
        tasks = self.get_queryset().filter(
            deadline__lt=timezone.now().date(),
            status__in=['created', 'in_work']
        )
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
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_to_review(self, request, pk=None):
        """Отправить задачу на проверку"""
        task = self.get_object()
        
        if task.status != 'in_work':
            return Response(
                {'error': 'Задачу можно отправить на проверку только из статуса "В работе"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'on_review'
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Завершить задачу"""
        task = self.get_object()
        
        if task.status != 'on_review':
            return Response(
                {'error': 'Задачу можно завершить только из статуса "На проверке"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.progress = 100
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def return_for_revision(self, request, pk=None):
        """Вернуть задачу на доработку"""
        task = self.get_object()
        
        if task.status != 'on_review':
            return Response(
                {'error': 'Задачу можно вернуть на доработку только из статуса "На проверке"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'in_work'
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Обновить прогресс выполнения задачи"""
        task = self.get_object()
        progress = request.data.get('progress')
        
        if progress is None or not 0 <= int(progress) <= 100:
            return Response(
                {'error': 'Прогресс должен быть числом от 0 до 100'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.progress = int(progress)
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_assignee(self, request, pk=None):
        """Изменить исполнителя задачи"""
        task = self.get_object()
        assignee_id = request.data.get('assignee_id')
        
        if not assignee_id:
            return Response(
                {'error': 'Необходимо указать assignee_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from core.models import User
        try:
            assignee = User.objects.get(id=assignee_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'Пользователь не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        task.assigned_to = assignee
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """При создании задачи устанавливаем создателя"""
        serializer.save(created_by=self.request.user)
