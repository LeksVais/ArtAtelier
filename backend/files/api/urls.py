from django.urls import path, include
from rest_framework.routers import DefaultRouter
from reports.api.views import GeneratedReportViewSet, ReportTemplateViewSet, ReportGenerationView
from .views import (
    ProjectFileViewSet,
    FileCategoryViewSet,
    FileVersionHistoryViewSet
)

router = DefaultRouter()
router.register(r'reports', GeneratedReportViewSet, basename='report')
router.register(r'report-templates', ReportTemplateViewSet, basename='report-template')

# Дополнительные URL для отчетов
report_urls = [
    path('generate/', ReportGenerationView.as_view(), name='report-generate'),
    path('<int:pk>/download/', GeneratedReportViewSet.as_view({'get': 'download'}), name='report-download'),
    path('<int:pk>/archive/', GeneratedReportViewSet.as_view({'post': 'archive'}), name='report-archive'),
    path('<int:pk>/restore/', GeneratedReportViewSet.as_view({'post': 'restore'}), name='report-restore'),
    path('templates/<str:template_type>/', ReportTemplateViewSet.as_view({'get': 'by_type'}), name='report-templates-by-type'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('reports/', include(report_urls)),
]