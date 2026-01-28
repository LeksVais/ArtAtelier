from rest_framework import serializers
from ...models import Comment
from core.api.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    content_object_info = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'author', 'author_details', 'content_type', 'content_type_display',
            'object_id', 'content_object_info', 'text', 'created_at', 'updated_at',
            'time_ago', 'replies', 'can_edit', 'can_delete', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_content_object_info(self, obj):
        content_object = obj.content_object
        if content_object:
            model_name = content_object.__class__.__name__.lower()
            
            info = {
                'id': content_object.id,
                'model': model_name,
            }
            
            # Добавляем информацию в зависимости от типа объекта
            if model_name == 'project':
                info['title'] = content_object.title
                info['url'] = f'/projects/{content_object.id}'
            elif model_name == 'task':
                info['title'] = content_object.title
                info['url'] = f'/tasks/{content_object.id}'
            elif model_name == 'projectfile':
                info['title'] = content_object.name
                info['url'] = f'/files/{content_object.id}'
            elif model_name == 'client':
                info['title'] = content_object.name
                info['url'] = f'/clients/{content_object.id}'
            
            return info
        return None
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        from django.utils.timesince import timesince
        
        if obj.created_at:
            return timesince(obj.created_at, timezone.now()) + ' назад'
        return ''
    
    def get_replies(self, obj):
        # Здесь можно добавить функционал ответов на комментарии
        # Пока возвращаем пустой список
        return []
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return request.user == obj.author or request.user.role in ['director', 'manager']
        return False
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return request.user == obj.author or request.user.role in ['director', 'manager']
        return False
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content_type', 'object_id', 'text']
    
    def validate(self, data):
        # Проверка, что объект существует
        model_map = {
            'project': 'projects.Project',
            'task': 'projects.Task',
            'file': 'files.ProjectFile',
            'client': 'core.Client'
        }
        
        content_type = data['content_type']
        object_id = data['object_id']
        
        if content_type not in model_map:
            raise serializers.ValidationError({
                'content_type': 'Неверный тип контента'
            })
        
        # Импортируем модель
        from django.apps import apps
        try:
            model = apps.get_model(model_map[content_type])
            if not model.objects.filter(id=object_id, is_active=True).exists():
                raise serializers.ValidationError({
                    'object_id': f'Объект с ID {object_id} не найден'
                })
        except LookupError:
            raise serializers.ValidationError({
                'content_type': 'Модель не найдена'
            })
        
        return data