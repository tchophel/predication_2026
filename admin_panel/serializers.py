from rest_framework import serializers
from matches.models import Match, Tournament, Team, Group
from users.models import User


class MatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['team_a', 'team_b', 'start_time', 'tournament', 'group', 'venue', 'match_day']


class MatchSerializer(serializers.ModelSerializer):
    team_a_name = serializers.CharField(source='team_a.name', read_only=True)
    team_b_name = serializers.CharField(source='team_b.name', read_only=True)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    is_prediction_locked = serializers.BooleanField(read_only=True)
    time_until_lock = serializers.DurationField(read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'team_a', 'team_b', 'team_a_name', 'team_b_name',
            'start_time', 'status', 'score_a', 'score_b', 'tournament',
            'tournament_name', 'group', 'venue', 'match_day',
            'is_locked', 'lock_override_time', 'is_prediction_locked', 'time_until_lock'
        ]


class UserAdminSerializer(serializers.ModelSerializer):
    payment_logs_count = serializers.SerializerMethodField()
    predictions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_paid', 'total_points', 'is_staff', 'is_active',
            'date_joined', 'payment_logs_count', 'predictions_count'
        ]
    
    def get_payment_logs_count(self, obj):
        return obj.payment_logs.count()
    
    def get_predictions_count(self, obj):
        return obj.predictions.count()


class TournamentSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'year', 'is_active', 'created_at', 'groups']
    
    def get_groups(self, obj):
        return [{'id': g.id, 'name': g.name} for g in obj.groups.all()]


class GroupSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    matches_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'tournament', 'tournament_name', 'matches_count']
    
    def get_matches_count(self, obj):
        return obj.matches.count()


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'country_code', 'flag']


class MatchWithGroupSerializer(serializers.ModelSerializer):
    team_a = TeamSerializer(read_only=True)
    team_b = TeamSerializer(read_only=True)
    tournament = TournamentSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'team_a', 'team_b', 'start_time', 'status', 'score_a', 'score_b',
            'tournament', 'group', 'venue', 'match_day', 'is_locked', 'lock_override_time'
        ]
