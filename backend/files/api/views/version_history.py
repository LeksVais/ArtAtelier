from rest_framework import viewsets, permissions
from ...models import FileVersionHistory
from ..serializers import FileVersionHistorySerializer

class FileVersionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API для истории версий файлов"""
    queryset = FileVersionHistory.objects.all()
    serializer_class = FileVersionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        file_id = self.request.query_params.get('file_id')
        if file_id:
            return self.queryset.filter(project_file_id=file_id)
        return self.queryset