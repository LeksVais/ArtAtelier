from rest_framework import serializers
import os
from django.core.validators import FileExtensionValidator
from ...models import ProjectFile, FileCategory, FileVersionHistory

class FileCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FileCategory
        fields = ['id', 'name', 'description', 'is_active']
        read_only_fields = ['id']

class ProjectFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)
    extension_display = serializers.CharField(source='get_extension_display', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    size_formatted = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectFile
        fields = [
            'id', 'name', 'original_filename', 'file', 'file_url',
            'file_type', 'file_type_display', 'extension', 'extension_display',
            'size', 'size_formatted', 'project', 'task', 'category', 'category_name',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'version',
            'is_current', 'description', 'is_image', 'is_active'
        ]
        read_only_fields = ['id', 'uploaded_at', 'version', 'size', 'original_filename']
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
    
    def get_size_formatted(self, obj):
        """Форматирование размера файла"""
        size = obj.size
        for unit in ['Б', 'КБ', 'МБ', 'ГБ']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} ТБ"
    
    def get_is_image(self, obj):
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg']
        return obj.extension.lower() in image_extensions

class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(
        validators=[
            FileExtensionValidator(allowed_extensions=[
                'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx',
                'xls', 'xlsx', 'ppt', 'pptx', 'psd', 'ai', 'indd',
                'mp4', 'mov', 'avi', 'zip', 'rar'
            ])
        ]
    )
    
    class Meta:
        model = ProjectFile
        fields = ['file', 'name', 'project', 'task', 'category', 'description']
    
    def validate(self, data):
        # Проверка размера файла (макс 100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        if data['file'].size > max_size:
            raise serializers.ValidationError({
                'file': f'Размер файла превышает {max_size // (1024*1024)}MB'
            })
        
        # Проверка, что указан либо проект, либо задача
        if not data.get('project') and not data.get('task'):
            raise serializers.ValidationError({
                'project': 'Необходимо указать проект или задачу'
            })
        
        # Автоматическое заполнение имени, если не указано
        if not data.get('name'):
            filename = os.path.splitext(data['file'].name)[0]
            data['name'] = filename
        
        return data
    
    def create(self, validated_data):
        file = validated_data['file']
        
        # Определяем расширение файла
        ext = os.path.splitext(file.name)[1].lower()
        
        # Определяем тип файла
        file_type = 'other'
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg']:
            file_type = 'image'
        elif ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']:
            file_type = 'document'
        elif ext in ['.zip', '.rar', '.7z']:
            file_type = 'archive'
        elif ext in ['.mp4', '.mov', '.avi', '.mkv']:
            file_type = 'video'
        elif ext in ['.mp3', '.wav', '.ogg']:
            file_type = 'audio'
        
        # Создаем запись файла
        project_file = ProjectFile.objects.create(
            name=validated_data['name'],
            original_filename=file.name,
            file=file,
            file_type=file_type,
            extension=ext,
            size=file.size,
            project=validated_data.get('project'),
            task=validated_data.get('task'),
            category=validated_data.get('category'),
            uploaded_by=self.context['request'].user,
            description=validated_data.get('description', '')
        )
        
        return project_file

class FileVersionHistorySerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = FileVersionHistory
        fields = [
            'id', 'project_file', 'version', 'file', 'file_url',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at',
            'changes_description', 'size_formatted'
        ]
        read_only_fields = ['id', 'uploaded_at']
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
    
    def get_size_formatted(self, obj):
        size = obj.file.size
        for unit in ['Б', 'КБ', 'МБ', 'ГБ']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} ТБ"