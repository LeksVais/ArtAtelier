from rest_framework import permissions


class CanViewProject(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not hasattr(user, 'role'):
            return False
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return obj.manager == user or obj.projectmember_set.filter(employee__user=user).exists()
        else:
            return obj.projectmember_set.filter(employee__user=user).exists()


class CanEditProject(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role in ['director', 'manager']
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not hasattr(user, 'role'):
            return False
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return obj.manager == user
        return False


class CanViewTask(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        if not hasattr(user, 'role'):
            return False
        
        # Разрешаем POST запросы (создание задач) для директоров и менеджеров
        if request.method == 'POST':
            return user.role in ['director', 'manager']
        
        # Для GET запросов (просмотр) разрешаем всем аутентифицированным
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Для остальных методов проверяется в has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not hasattr(user, 'role'):
            return False
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return (obj.project.manager == user or 
                   obj.assigned_to == user or 
                   obj.created_by == user)
        else:
            return obj.assigned_to == user or obj.created_by == user


class CanEditTask(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not hasattr(user, 'role'):
            return False
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return obj.project.manager == user or obj.created_by == user
        else:
            # Исполнитель может редактировать только свою задачу
            return obj.assigned_to == user and request.method in ['PUT', 'PATCH', 'POST']


# Добавьте эти классы для клиентов
class CanViewClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not hasattr(user, 'role'):
            return False
        
        if user.role in ['director', 'manager']:
            return True
        return False


class CanEditClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role in ['director', 'manager']
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not hasattr(user, 'role'):
            return False
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            # Менеджер может редактировать клиентов
            return True
        return False