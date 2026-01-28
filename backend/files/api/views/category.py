from rest_framework import viewsets, permissions
from ...models import FileCategory
from ..serializers import FileCategorySerializer

class FileCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API для категорий файлов"""
    queryset = FileCategory.objects.all()
    serializer_class = FileCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return FileCategory.objects.filter(is_active=True)