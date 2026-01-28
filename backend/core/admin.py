# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Employee, Client

# Кастомный UserAdmin для вашей модели User
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active', 'account_status')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'middle_name', 'email', 'phone', 'avatar')}),
        ('Роли и права', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Настройки', {'fields': ('account_status', 'timezone', 'language', 'theme', 'two_factor_enabled')}),
        ('Важные даты', {'fields': ('last_login', 'created_at')}),
    )
    readonly_fields = ('created_at',)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_staff', 'is_active'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'employment_status', 'hire_date')
    list_filter = ('employment_status', 'position', 'is_active')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'position')
    raw_id_fields = ('user',)

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'email', 'is_active', 'is_archived')
    list_filter = ('is_active', 'is_archived')
    search_fields = ('name', 'contact_person', 'email', 'phone')
    list_editable = ('is_active',)

# Регистрация моделей
admin.site.register(User, UserAdmin)
# Employee и Client уже зарегистрированы через @admin.register