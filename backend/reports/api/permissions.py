from rest_framework import permissions

class CanViewReport(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == 'director':
            return True
        else:
            return obj.generated_by == user

class CanGenerateReport(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['director', 'manager']