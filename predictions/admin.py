from django.contrib import admin
from .models import TwoStarConfig, Prediction


@admin.register(TwoStarConfig)
class TwoStarConfigAdmin(admin.ModelAdmin):
    list_display = ['enabled', 'max_per_user_per_tournament', 'max_per_user_global']
    fieldsets = (
        (None, {
            'fields': ('enabled',)
        }),
        ('Limits', {
            'fields': ('max_per_user_per_tournament', 'max_per_user_global')
        }),
        ('User Information', {
            'fields': ('description',)
        }),
    )


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'match', 'predicted_a', 'predicted_b', 'used_two_star', 'points_awarded']
    list_filter = ['used_two_star', 'points_awarded', 'match__tournament_name', 'match__tournament_year', 'match__status']
    search_fields = ['user__username', 'match__team_a_name', 'match__team_b_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'base_points', 'final_points']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'match', 'predicted_a', 'predicted_b', 'used_two_star')
        }),
        ('Points', {
            'fields': ('points_awarded', 'base_points', 'final_points'),
            'description': 'Points awarded for this prediction'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['award_points_action', 'recalculate_points']
    
    def base_points(self, obj):
        return obj.calculate_base_points()
    base_points.short_description = "Base Points"
    
    def final_points(self, obj):
        return obj.calculate_final_points()
    final_points.short_description = "Final Points"
    
    def award_points_action(self, request, queryset):
        awarded_count = 0
        for prediction in queryset:
            if prediction.match.status == 'finished' and prediction.points_awarded is None:
                prediction.award_points()
                awarded_count += 1
        
        self.message_user(request, f"Awarded points for {awarded_count} predictions.")
    award_points_action.short_description = "Award points for selected predictions"
    
    def recalculate_points(self, request, queryset):
        for prediction in queryset:
            if prediction.match.status == 'finished':
                prediction.award_points()
        
        self.message_user(request, f"Recalculated points for {queryset.count()} predictions.")
    recalculate_points.short_description = "Recalculate points for selected predictions"
