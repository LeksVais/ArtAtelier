from rest_framework import serializers
from ...models import ProjectMember
from core.api.serializers import EmployeeSerializer

class ProjectMemberSerializer(serializers.ModelSerializer):
    employee_details = EmployeeSerializer(source='employee', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = [
            'id', 'project', 'employee', 'employee_details',
            'role', 'role_display', 'joined_at', 'is_active'
        ]
        read_only_fields = ['id', 'joined_at']
    
    def validate(self, data):
        # Проверяем, что сотрудник не добавлен повторно
        if ProjectMember.objects.filter(
            project=data['project'],
            employee=data['employee'],
            is_active=True
        ).exists():
            raise serializers.ValidationError({
                'employee': 'Этот сотрудник уже является участником проекта'
            })
        
        return data