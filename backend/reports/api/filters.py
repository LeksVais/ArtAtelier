from django_filters import rest_framework as filters
from ..models import GeneratedReport

class GeneratedReportFilter(filters.FilterSet):
    """Фильтры для отчетов"""
    report_type = filters.ChoiceFilter(choices=GeneratedReport.REPORT_TYPES)
    start_date = filters.DateFilter(field_name='start_date', lookup_expr='gte')
    end_date = filters.DateFilter(field_name='end_date', lookup_expr='lte')
    generated_after = filters.DateFilter(field_name='generated_at', lookup_expr='gte')
    generated_before = filters.DateFilter(field_name='generated_at', lookup_expr='lte')
    has_file = filters.BooleanFilter(field_name='file', lookup_expr='isnull', exclude=True)
    
    class Meta:
        model = GeneratedReport
        fields = [
            'report_type', 
            'is_success', 
            'is_archived',
            'start_date',
            'end_date',
            'generated_after',
            'generated_before',
            'has_file'
        ]