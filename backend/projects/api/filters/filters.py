import django_filters
from django.db.models import Q
from ...models import Project, Task

class ProjectFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Project.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Project.PRIORITY_CHOICES)
    client = django_filters.NumberFilter(field_name='client__id')
    manager = django_filters.NumberFilter(field_name='manager__id')
    
    class Meta:
        model = Project
        fields = ['status', 'priority', 'client', 'manager']

class TaskFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Task.PRIORITY_CHOICES)
    project = django_filters.NumberFilter(field_name='project__id')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')
    created_by = django_filters.NumberFilter(field_name='created_by__id')
    
    class Meta:
        model = Task
        fields = ['status', 'priority', 'project', 'assigned_to', 'created_by']