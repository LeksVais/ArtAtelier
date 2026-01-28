from rest_framework import viewsets, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.http import FileResponse
import os
from ...models import ProjectFile, FileCategory, FileVersionHistory
from ..serializers import (
    ProjectFileSerializer, FileUploadSerializer,
    FileVersionHistorySerializer, FileCategorySerializer
)
from ..permissions import CanUploadFile, CanViewFile, CanDeleteFile

class ProjectFileViewSet(viewsets.ModelViewSet):
    queryset = ProjectFile.objects.filter(is_active=True)
    serializer_class = ProjectFileSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [IsAuthenticated, CanViewFile]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'task', 'file_type', 'category', 'is_current']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FileUploadSerializer
        return ProjectFileSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'upload']:
            self.permission_classes = [IsAuthenticated, CanUploadFile]
        elif self.action in ['delete', 'restore_version']:
            self.permission_classes = [IsAuthenticated, CanDeleteFile]
        return super().get_permissions()
    
    def get_queryset(self):
        """Фильтрация по правам доступа"""
        user = self.request.user
        
        if user.role == 'director':
            return super().get_queryset()
        elif user.role == 'manager':
            return super().get_queryset().filter(
                Q(project__manager=user) |
                Q(uploaded_by=user) |
                Q(project__members__employee__user=user)
            ).distinct()
        else:
            return super().get_queryset().filter(
                Q(uploaded_by=user) |
                Q(task__assigned_to=user) |
                Q(project__members__employee__user=user)
            ).distinct()
    
    def create(self, request, *args, **kwargs):
        """Загрузка файла с валидацией"""
        serializer = FileUploadSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Валидация типа файла согласно ТП
            allowed_extensions = [ext[0] for ext in ProjectFile.EXTENSION_CHOICES]
            file = request.FILES.get('file')
            file_ext = os.path.splitext(file.name)[1].lower()
            
            if file_ext not in allowed_extensions:
                return Response(
                    {'error': f'Тип файла {file_ext} не поддерживается'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Проверка размера файла (макс 100MB)
            if file.size > 100 * 1024 * 1024:
                return Response(
                    {'error': 'Размер файла превышает 100MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            project_file = serializer.save(uploaded_by=request.user)
            return Response(
                ProjectFileSerializer(project_file).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Скачивание файла"""
        project_file = self.get_object()
        
        if not project_file.file:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response = FileResponse(project_file.file.open('rb'))
        response['Content-Disposition'] = f'attachment; filename="{project_file.original_filename}"'
        return response
    
    @action(detail=True, methods=['post'])
    def upload_new_version(self, request, pk=None):
        """Загрузка новой версии файла"""
        project_file = self.get_object()
        new_file = request.FILES.get('file')
        description = request.data.get('description', '')
        
        if not new_file:
            return Response(
                {'error': 'Файл не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка прав
        if project_file.uploaded_by != request.user and request.user.role not in ['director', 'manager']:
            return Response(
                {'error': 'Только автор файла или менеджер могут загружать новые версии'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            new_version = project_file.create_new_version(new_file, request.user)
            
            # Сохраняем историю
            FileVersionHistory.objects.create(
                project_file=project_file,
                version=new_version.version,
                file=new_file,
                uploaded_by=request.user,
                changes_description=description
            )
            
            return Response(
                ProjectFileSerializer(new_version).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """История версий файла"""
        project_file = self.get_object()
        versions = FileVersionHistory.objects.filter(project_file=project_file)
        
        serializer = FileVersionHistorySerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        """Восстановление версии файла"""
        project_file = self.get_object()
        version_number = request.data.get('version')
        
        if not version_number:
            return Response(
                {'error': 'Не указана версия для восстановления'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        version = FileVersionHistory.objects.filter(
            project_file=project_file,
            version=version_number
        ).first()
        
        if not version:
            return Response(
                {'error': 'Версия не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Восстанавливаем файл
        project_file.file = version.file
        project_file.save()
        
        # Создаем новую версию с восстановленным файлом
        new_version = project_file.create_new_version(version.file, request.user)
        
        return Response(
            ProjectFileSerializer(new_version).data,
            status=status.HTTP_200_OK
        )
    
    def perform_destroy(self, instance):
        """Логическое удаление файла"""
        instance.is_active = False
        instance.save()