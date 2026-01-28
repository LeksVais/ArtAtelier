from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, TaskViewSet, 
    ProjectMemberViewSet, ClientViewSet
)

router = DefaultRouter()
router.register(r'project-tasks', TaskViewSet, basename='task')
router.register(r'project-members', ProjectMemberViewSet, basename='project-member')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'', ProjectViewSet, basename='project')


urlpatterns = [
    path('', include(router.urls)),
    
    # Дополнительные URL для проектов
    path('dashboard_stats/', ProjectViewSet.as_view({'get': 'dashboard_stats'}), name='project-dashboard-stats'),
    path('<int:pk>/change_status/', ProjectViewSet.as_view({'post': 'change_status'}), name='project-change-status'),
    path('<int:pk>/tasks/', ProjectViewSet.as_view({'get': 'tasks'}), name='project-tasks'),
    path('<int:pk>/members/', ProjectViewSet.as_view({'get': 'members'}), name='project-members'),
    path('<int:pk>/add_member/', ProjectViewSet.as_view({'post': 'add_member'}), name='project-add-member'),
    path('<int:pk>/archive/', ProjectViewSet.as_view({'post': 'archive'}), name='project-archive'),
    path('<int:pk>/restore/', ProjectViewSet.as_view({'post': 'restore'}), name='project-restore'),
    
    # Маршрут для архивных проектов
    path('archived/', ProjectViewSet.as_view({'get': 'archived'}), name='project-archived'),
]