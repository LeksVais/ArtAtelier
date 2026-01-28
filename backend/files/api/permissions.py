from rest_framework import permissions

class CanViewFile(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return (obj.uploaded_by == user or 
                   obj.project.manager == user or
                   obj.project.members.filter(employee__user=user).exists())
        else:
            return (obj.uploaded_by == user or
                   obj.task.assigned_to == user or
                   obj.project.members.filter(employee__user=user).exists())

class CanUploadFile(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return (obj.uploaded_by == user or 
                   obj.project.manager == user)
        else:
            return (obj.uploaded_by == user or
                   obj.task.assigned_to == user)

class CanDeleteFile(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['director', 'manager']
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == 'director':
            return True
        elif user.role == 'manager':
            return obj.project.manager == user
        return False