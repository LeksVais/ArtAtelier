from rest_framework import serializers
from ...models import Employee, User
from django.contrib.auth.hashers import make_password

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'user_details', 'full_name', 'position',
            'work_phone', 'work_email', 'employment_status', 'hire_date',
            'salary_rate', 'notes', 'created_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'user_details']
    
    def get_user_details(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'middle_name': obj.user.middle_name,
                'role': obj.user.role,
                'phone': obj.user.phone,
                'avatar': obj.user.avatar.url if obj.user.avatar else None
            }
        return None
    
    def get_full_name(self, obj):
        if obj.user:
            return str(obj.user)
        return "Неизвестный сотрудник"

class EmployeeCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    middle_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=[('designer', 'Дизайнер'), ('copywriter', 'Копирайтер'), 
                 ('manager', 'Менеджер'), ('director', 'Руководитель')],
        write_only=True,
        default='designer'
    )
    
    class Meta:
        model = Employee
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'middle_name', 'role',
            'position', 'work_phone', 'work_email', 'employment_status',
            'hire_date', 'salary_rate', 'notes'
        ]
    
    def validate(self, data):
        # Валидация только для создания (POST)
        if self.context.get('request').method == 'POST':
            if data.get('password') != data.get('confirm_password'):
                raise serializers.ValidationError({"confirm_password": "Пароли не совпадают"})
            
            if User.objects.filter(username=data.get('username')).exists():
                raise serializers.ValidationError({"username": "Пользователь с таким логином уже существует"})
            
            if User.objects.filter(email=data.get('email')).exists():
                raise serializers.ValidationError({"email": "Пользователь с таким email уже существует"})
        
        return data
    
    def create(self, validated_data):
        # Извлекаем данные для создания User
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'middle_name': validated_data.pop('middle_name', ''),
            'role': validated_data.pop('role', 'designer'),
        }
        
        # Удаляем confirm_password, он больше не нужен
        validated_data.pop('confirm_password')
        
        # Создаем пользователя
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            middle_name=user_data['middle_name'],
            role=user_data['role']
        )
        
        # Создаем сотрудника
        employee = Employee.objects.create(user=user, **validated_data)
        return employee
    
    def update(self, instance, validated_data):
        # При обновлении НЕ изменяем username, email, password
        # Удаляем эти поля из validated_data
        validated_data.pop('username', None)
        validated_data.pop('email', None)
        validated_data.pop('password', None)
        validated_data.pop('confirm_password', None)
        
        # Обновляем только поля пользователя, которые можно менять
        user_fields = ['first_name', 'last_name', 'middle_name', 'role']
        user_data = {}
        
        for field in user_fields:
            if field in validated_data:
                user_data[field] = validated_data.pop(field)
        
        if user_data:
            user = instance.user
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()
        
        # Обновляем данные сотрудника
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance