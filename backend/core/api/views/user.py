from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q
from ...models import User, Employee, Client
from ..serializers import (
    UserSerializer, UserCreateSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer, EmployeeSerializer,
    ClientSerializer, ClientDetailSerializer,
)
from ..permissions import IsDirector, IsDirectorOrManager, IsOwnerOrDirector

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsDirectorOrManager]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['me', 'update_me', 'change_password', 'toggle_two_factor']:
            self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrDirector]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'director':
            return super().get_queryset()
        elif user.role == 'manager':
            return super().get_queryset().filter(
                Q(role__in=['designer', 'copywriter']) | Q(id=user.id)
            )
        else:
            # Обычные пользователи видят только себя
            return super().get_queryset().filter(id=user.id)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Получение и обновление данных текущего пользователя"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            # Пользователь может обновлять только свои данные
            user = request.user
            partial = request.method == 'PATCH'
            
            serializer = self.get_serializer(
                user, 
                data=request.data, 
                partial=partial,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Альтернативный метод для обновления своего профиля"""
        return self.me(request)
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """Смена пароля пользователя"""
        user = self.get_object()
        serializer = ChangePasswordSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'status': 'Пароль успешно изменен'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle_two_factor(self, request, pk=None):
        """Включение/выключение двухфакторной аутентификации"""
        user = self.get_object()
        user.two_factor_enabled = not user.two_factor_enabled
        user.save()
        
        status_text = 'включена' if user.two_factor_enabled else 'выключена'
        return Response({'status': f'Двухфакторная аутентификация {status_text}'})
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Активация/деактивация пользователя"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        status_text = 'активирован' if user.is_active else 'деактивирован'
        return Response({'status': f'Пользователь {status_text}'})
    
    def perform_destroy(self, instance):
        """Логическое удаление пользователя"""
        instance.is_active = False
        instance.save()

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.filter(is_active=True)
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsDirectorOrManager]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'director':
            return super().get_queryset()
        elif user.role == 'manager':
            # Менеджеры видят всех сотрудников
            return super().get_queryset()
        else:
            # Обычные сотрудники видят только себя
            return super().get_queryset().filter(user=user)
    
    @action(detail=True, methods=['get'])
    def workload(self, request, pk=None):
        """Получение загрузки сотрудника"""
        from projects.models import Task
        from django.utils import timezone
        from django.db.models import Count, Avg
        
        employee = self.get_object()
        
        tasks = Task.objects.filter(
            assigned_to=employee.user,
            is_active=True
        )
        
        stats = {
            'total_tasks': tasks.count(),
            'active_tasks': tasks.filter(status__in=['created', 'in_work']).count(),
            'completed_tasks': tasks.filter(status='completed').count(),
            'overdue_tasks': tasks.filter(
                deadline__lt=timezone.now().date(),
                status__in=['created', 'in_work']
            ).count(),
            'avg_progress': tasks.aggregate(avg=Avg('progress'))['avg'] or 0,
            'task_distribution': tasks.values('status').annotate(count=Count('id')),
            'upcoming_deadlines': tasks.filter(
                deadline__lte=timezone.now().date() + timezone.timedelta(days=7)
            ).values('id', 'title', 'deadline', 'project__title')[:10]
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Изменение статуса сотрудника"""
        employee = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Employee.EMPLOYMENT_STATUS).keys():
            return Response(
                {'error': 'Неверный статус'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee.employment_status = new_status
        employee.save()
        
        return Response({'status': f'Статус изменен на {new_status}'})
    
    def perform_destroy(self, instance):
        """Логическое удаление сотрудника"""
        instance.is_active = False
        instance.save()