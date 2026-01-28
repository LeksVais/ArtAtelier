# comments/admin.py
from django.contrib import admin
from .models import Comment

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'content_type', 'object_id', 'text_preview', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('text', 'author__username')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('author',)
    
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Текст'