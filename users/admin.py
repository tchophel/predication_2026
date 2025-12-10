from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PaymentLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'is_paid', 'total_points', 'is_staff', 'date_joined']
    list_filter = ['is_paid', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['username', 'email']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Prediction System', {
            'fields': ('is_paid', 'total_points', 'avatar')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Prediction System', {
            'fields': ('is_paid', 'total_points')
        }),
    )


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'admin_verified', 'timestamp']
    list_filter = ['admin_verified', 'timestamp']
    search_fields = ['user__username', 'notes']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']
    
    actions = ['mark_verified', 'mark_unverified']
    
    def mark_verified(self, request, queryset):
        queryset.update(admin_verified=True)
        for log in queryset:
            log.user.is_paid = True
            log.user.save()
    mark_verified.short_description = "Mark selected payments as verified"
    
    def mark_unverified(self, request, queryset):
        queryset.update(admin_verified=False)
    mark_unverified.short_description = "Mark selected payments as unverified"
