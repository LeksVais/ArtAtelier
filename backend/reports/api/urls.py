# reports/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportTemplateViewSet, GeneratedReportViewSet, ReportGenerationView

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet)
router.register(r'generated', GeneratedReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('generate/', ReportGenerationView.as_view(), name='report-generate'),
]