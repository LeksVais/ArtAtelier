from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from ...models import Employee
from ..serializers import EmployeeSerializer, EmployeeCreateSerializer
from ..permissions import IsDirectorOrManager

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.filter(is_active=True).select_related('user')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EmployeeCreateSerializer
        return EmployeeSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            # Только директор или менеджер могут создавать/удалять сотрудников
            return [permissions.IsAuthenticated(), IsDirectorOrManager()]
        elif self.action in ['update', 'partial_update']:
            # Обновлять могут только директор/менеджер или сам сотрудник
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
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
        
        employee = self.get_object()
        
        tasks = Task.objects.filter(
            assigned_to=employee.user,
            is_active=True
        )
        
        data = {
            'employee': EmployeeSerializer(employee).data,
            'current_tasks': tasks.count(),
            'tasks_by_status': tasks.values('status').annotate(count=Count('id')),
            'upcoming_deadlines': tasks.filter(
                deadline__lte=timezone.now() + timezone.timedelta(days=7)
            ).values('title', 'deadline', 'project__title')
        }
        return Response(data)
    
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