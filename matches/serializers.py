from rest_framework import serializers
from .models import Tournament, Group, Team, Match


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'year', 'is_active', 'created_at']


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'tournament']


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'country_code', 'flag']


class MatchTimeFieldsMixin(serializers.Serializer):
    """Adds separate human-readable date and time fields derived from start_time."""
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    def get_date(self, obj):
        return obj.start_time.date().isoformat() if obj.start_time else None

    def get_time(self, obj):
        return obj.start_time.strftime('%H:%M') if obj.start_time else None


class MatchSerializer(MatchTimeFieldsMixin, serializers.ModelSerializer):
    is_prediction_locked = serializers.BooleanField(read_only=True)
    time_until_lock = serializers.DurationField(read_only=True)
    can_predict = serializers.BooleanField(read_only=True)

    class Meta:
        model = Match
        fields = [
            'id', 'team_a_name', 'team_a_code', 'team_b_name', 'team_b_code',
            'start_time', 'date', 'time', 'status', 'score_a', 'score_b', 'venue',
            'tournament_name', 'tournament_year', 'group',
            # 'extra_time', 'final_whistle_time',  # Temporarily commented out until migration runs
            'is_locked', 'lock_override_time', 'is_prediction_locked',
            'time_until_lock', 'can_predict', 'created_at', 'updated_at'
        ]


class MatchListSerializer(MatchTimeFieldsMixin, serializers.ModelSerializer):
    is_prediction_locked = serializers.BooleanField(read_only=True)
    time_until_lock_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'id', 'team_a_name', 'team_a_code', 'team_b_name', 'team_b_code',
            'start_time', 'date', 'time', 'status', 'score_a', 'score_b', 'venue',
            'tournament_name', 'tournament_year', 'group',
            # 'extra_time', 'final_whistle_time',  # Temporarily commented out until migration runs
            'is_prediction_locked', 'time_until_lock_minutes'
        ]

    def get_time_until_lock_minutes(self, obj):
        time_until = obj.time_until_lock
        if time_until:
            return int(time_until.total_seconds() / 60)
        return 0


class MatchDetailSerializer(MatchTimeFieldsMixin, serializers.ModelSerializer):
    is_prediction_locked = serializers.BooleanField(read_only=True)
    time_until_lock = serializers.DurationField(read_only=True)
    can_predict = serializers.BooleanField(read_only=True)

    class Meta:
        model = Match
        fields = [
            'id', 'team_a_name', 'team_a_code', 'team_b_name', 'team_b_code',
            'start_time', 'date', 'time', 'status', 'score_a', 'score_b', 'venue',
            'tournament_name', 'tournament_year', 'group',
            'is_locked', 'lock_override_time', 'is_prediction_locked',
            'time_until_lock', 'can_predict', 'created_at', 'updated_at'
        ]
