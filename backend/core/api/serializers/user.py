from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from ...models import User, Employee, Client

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'middle_name', 'full_name', 'role', 'account_status',
            'phone', 'avatar', 'avatar_url', 'timezone', 'language',
            'theme', 'two_factor_enabled', 'created_at', 'date_joined'
        ]
        read_only_fields = ['id', 'created_at', 'date_joined', 'full_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'avatar': {'write_only': True}
        }
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'middle_name', 'role',
            'phone', 'avatar'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Пароли не совпадают"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Пароли не совпадают"})
        return data
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Текущий пароль неверен")
        return value

class CustomTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        from django.contrib.auth import authenticate
        user = authenticate(username=attrs['username'], password=attrs['password'])
        
        if not user:
            raise serializers.ValidationError("Неверные учетные данные")
        
        if not user.is_active:
            raise serializers.ValidationError("Учетная запись отключена")
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }
    
class UserNotificationSettingsSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_full_name = serializers.ReadOnlyField(source='user.full_name')
    
    class Meta:
        from core.models import UserNotificationSettings  # Импорт модели
        model = UserNotificationSettings
        fields = [
            'id',
            'user',
            'user_email',
            'user_full_name',
            'email_project_updates',
            'email_task_assignments',
            'email_deadline_reminders',
            'email_weekly_digest',
            'push_notifications',
            'push_important_only',
            'notification_frequency',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'user_full_name', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Дополнительная валидация"""
        # Проверка, что пользователь устанавливает настройки только для себя
        request = self.context.get('request')
        instance = self.instance
        
        if request and instance and request.user != instance.user:
            raise serializers.ValidationError("Вы можете изменять только свои настройки уведомлений")
        
        return data
    
    def update(self, instance, validated_data):
        """Обновление настроек с проверкой прав"""
        request = self.context.get('request')
        
        if request and request.user != instance.user:
            raise serializers.ValidationError("Вы можете изменять только свои настройки уведомлений")
        
        return super().update(instance, validated_data)