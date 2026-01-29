from rest_framework import permissions


class IsDirector(permissions.BasePermission):
    """
    Разрешение только для пользователей с ролью 'director'
    ТЗ: 3.2.1 Руководитель имеет полный доступ
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'director'
        )
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsManager(permissions.BasePermission):
    """
    Разрешение только для пользователей с ролью 'manager'
    ТЗ: 3.2.2 Менеджер проектов
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'manager'
        )
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsDirectorOrManager(permissions.BasePermission):
    """
    Разрешение для директора или менеджера
    ТЗ: 3.2.1 + 3.2.2 - оба имеют расширенные права
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role in ['director', 'manager']
        )
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsOwnerOrDirector(permissions.BasePermission):
    """
    Разрешение для владельца объекта или директора
    ТЗ: 3.2.3 Пользователь может редактировать только свои данные
         3.2.1 Директор может редактировать все
    """
    def has_object_permission(self, request, view, obj):
        # Проверка аутентификации
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Директор имеет доступ ко всему
        if hasattr(request.user, 'role') and request.user.role == 'director':
            return True
        
        # Проверка владения объектом
        # Для User объекта
        if hasattr(obj, 'id'):
            return obj.id == request.user.id
        
        # Для Employee объекта (если у него есть user)
        if hasattr(obj, 'user') and hasattr(obj.user, 'id'):
            return obj.user.id == request.user.id
        
        # Для других объектов с user foreign key
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        
        return False


class IsDirectorOrManagerOrReadOnly(permissions.BasePermission):
    """
    Разрешение: директор/менеджер - все действия, остальные - только чтение
    """
    def has_permission(self, request, view):
        # Всегда разрешаем безопасные методы (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Для изменяющих методов проверяем роль
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role in ['director', 'manager']
        )
    
    def has_object_permission(self, request, view, obj):
        # Аналогичная логика на уровне объекта
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role in ['director', 'manager']
        )


class IsProjectManagerOrDirector(permissions.BasePermission):
    """
    Специальное разрешение для управления проектами
    ТЗ: 4.2.1 Создание/редактирование проектов - только менеджер/директор
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role in ['director', 'manager']
        )


class IsTaskAssigneeOrManagerOrDirector(permissions.BasePermission):
    """
    Разрешение для работы с задачами
    ТЗ: 4.3.2 Назначение задач
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Директор/менеджер имеют полный доступ
        if hasattr(request.user, 'role') and request.user.role in ['director', 'manager']:
            return True
        
        # Исполнитель задачи имеет доступ
        if hasattr(obj, 'assigned_to') and obj.assigned_to == request.user:
            return True
        
        # Создатель задачи имеет доступ
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        
        return False

class CanViewClient(permissions.BasePermission):
    """
    Разрешение на просмотр клиентов
    ТЗ: 4.1.1 Просмотр клиентов - директор и менеджер
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Директор и менеджер могут просматривать клиентов
        if hasattr(request.user, 'role') and request.user.role in ['director', 'manager']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class CanEditClient(permissions.BasePermission):
    """
    Разрешение на редактирование клиентов
    ТЗ: 4.1.1 Редактирование клиентов - только директор
    ИЗМЕНЕНО: Менеджер тоже может создавать и редактировать клиентов
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Директор ИЛИ менеджер может создавать/редактировать клиентов
        if hasattr(request.user, 'role') and request.user.role in ['director', 'manager']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

# Экспортируем все классы
__all__ = [
    'IsDirector',
    'IsManager', 
    'IsDirectorOrManager',
    'IsOwnerOrDirector',
    'IsDirectorOrManagerOrReadOnly',
    'IsProjectManagerOrDirector',
    'IsTaskAssigneeOrManagerOrDirector',
    'CanViewClient', 
    'CanEditClient'
]