from django.contrib import admin
from .models import Tournament, Group, Team, Match


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'is_active', 'created_at']
    list_filter = ['is_active', 'year']
    search_fields = ['name']
    ordering = ['-year', 'name']


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'tournament']
    list_filter = ['tournament']
    search_fields = ['name']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'country_code']
    search_fields = ['name', 'country_code']


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['team_a_name', 'team_b_name', 'start_time', 'status', 'score_a', 'score_b', 'tournament_name', 'group']
    list_filter = ['status', 'tournament_name', 'tournament_year', 'group']
    search_fields = ['team_a_name', 'team_b_name', 'venue', 'tournament_name']
    ordering = ['start_time']
    readonly_fields = ['is_prediction_locked', 'time_until_lock']
    
    fieldsets = (
        (None, {
            'fields': ('team_a_name', 'team_a_code', 'team_b_name', 'team_b_code', 'start_time', 'status', 'tournament_name', 'tournament_year', 'group')
        }),
        ('Score', {
            'fields': ('score_a', 'score_b'),
            'description': 'Enter final scores when match is finished'
        }),
        ('Match Details', {
            'fields': ('venue',),
            'classes': ('collapse',)
        }),
        ('Prediction Locking', {
            'fields': ('is_locked', 'lock_override_time'),
            'description': 'Control prediction locking for this match'
        }),
        ('Status Info', {
            'fields': ('is_prediction_locked', 'time_until_lock'),
            'classes': ('collapse',),
            'description': 'Read-only information about prediction lock status'
        }),
    )
    
    actions = ['finish_match', 'postpone_match', 'lock_predictions', 'unlock_predictions']
    
    def finish_match(self, request, queryset):
        queryset.update(status='finished')
    finish_match.short_description = "Mark selected matches as finished"
    
    def postpone_match(self, request, queryset):
        queryset.update(status='postponed')
    postpone_match.short_description = "Mark selected matches as postponed"
    
    def lock_predictions(self, request, queryset):
        queryset.update(is_locked=True)
    lock_predictions.short_description = "Lock predictions for selected matches"
    
    def unlock_predictions(self, request, queryset):
        queryset.update(is_locked=False)
    unlock_predictions.short_description = "Unlock predictions for selected matches"
