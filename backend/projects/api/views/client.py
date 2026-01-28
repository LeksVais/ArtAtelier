from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from core.models import Client
from ..serializers import ClientSerializer, ClientDetailSerializer
from ..permissions import CanViewClient, CanEditClient

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.filter(is_active=True, is_archived=False)
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewClient]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ClientDetailSerializer
        return ClientSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'archive']:
            self.permission_classes = [permissions.IsAuthenticated, CanEditClient]
        return super().get_permissions()
    
    def get_queryset(self):
        """Фильтрация по правам доступа"""
        user = self.request.user
        
        if user.role in ['director', 'manager']:
            return super().get_queryset()
        else:
            # Обычные сотрудники не видят клиентов
            return Client.objects.none()
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Активные клиенты"""
        clients = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(clients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """Архивные клиенты"""
        clients = Client.objects.filter(is_archived=True)
        
        if request.user.role not in ['director', 'manager']:
            clients = Client.objects.none()
        
        serializer = self.get_serializer(clients, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        """Проекты клиента"""
        client = self.get_object()
        
        from ...models import Project
        from ..serializers import ProjectSerializer
        
        projects = client.project_set.filter(is_active=True)
        
        data = {
            'client': ClientSerializer(client).data,
            'projects_count': projects.count(),
            'projects_by_status': projects.values('status').annotate(count=Count('id')),
            'active_projects': projects.filter(status__in=['planned', 'in_work', 'on_approval']),
            'completed_projects': projects.filter(status='completed'),
        }
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Архивация клиента с проверкой согласно ТЗ 4.1.2"""
        client = self.get_object()
        
        # Проверка активных проектов
        from ...models import Project
        active_projects = client.project_set.filter(
            is_active=True,
            status__in=['planned', 'in_work', 'on_approval']
        ).exists()
        
        if active_projects:
            return Response(
                {'error': 'Нельзя архивировать клиента с активными проектами'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        client.is_archived = True
        client.save()
        
        return Response({'status': 'Клиент архивирован'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановление из архива"""
        client = self.get_object()
        client.is_archived = False
        client.save()
        
        return Response({'status': 'Клиент восстановлен'})
    
    def perform_destroy(self, instance):
        """Логическое удаление клиента"""
        instance.is_active = False
        instance.save()