from rest_framework import serializers
from .models import Prediction, TwoStarConfig
from .constants import TWO_STAR_DISABLED_MESSAGE
from matches.serializers import MatchSerializer


class PredictionSerializer(serializers.ModelSerializer):
    match_details = MatchSerializer(source='match', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    base_points = serializers.SerializerMethodField()
    final_points = serializers.SerializerMethodField()
    can_edit = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'user', 'user_name', 'match', 'match_details',
            'predicted_a', 'predicted_b', 'used_two_star', 'points_awarded',
            'base_points', 'final_points', 'can_edit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'points_awarded']
    
    def get_base_points(self, obj):
        return obj.calculate_base_points()
    
    def get_final_points(self, obj):
        return obj.calculate_final_points()
    
    def validate(self, attrs):
        # Check if match is still open for predictions
        match = attrs.get('match') or self.instance.match
        if not match.can_predict():
            raise serializers.ValidationError(
                "Predictions are locked for this match"
            )
        
        # Validate two-star usage
        used_two_star = attrs.get('used_two_star', False)
        if used_two_star:
            config = TwoStarConfig.objects.first()
            if not config or not config.enabled:
                raise serializers.ValidationError(TWO_STAR_DISABLED_MESSAGE)
            
            user = self.context['request'].user
            tournament_usage = Prediction.get_user_two_star_usage(user, match.tournament)
            global_usage = Prediction.get_user_two_star_usage(user)
            
            if tournament_usage >= config.max_per_user_per_tournament:
                raise serializers.ValidationError(
                    f"You have reached the maximum Two-Star predictions ({config.max_per_user_per_tournament}) for this tournament"
                )
            
            if global_usage >= config.max_per_user_global:
                raise serializers.ValidationError(
                    f"You have reached the maximum Two-Star predictions ({config.max_per_user_global}) overall"
                )
        
        return attrs


class PredictionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = ['match', 'predicted_a', 'predicted_b', 'used_two_star']
    
    def validate(self, attrs):
        match = attrs['match']
        
        # Check if user already has a prediction for this match
        user = self.context['request'].user
        if Prediction.objects.filter(user=user, match=match).exists():
            raise serializers.ValidationError(
                "You already have a prediction for this match"
            )
        
        # Check if match is still open for predictions
        if not match.can_predict():
            raise serializers.ValidationError(
                "Predictions are locked for this match"
            )
        
        # Validate two-star usage
        used_two_star = attrs.get('used_two_star', False)
        if used_two_star:
            config = TwoStarConfig.objects.first()
            if not config or not config.enabled:
                raise serializers.ValidationError(TWO_STAR_DISABLED_MESSAGE)
            
            tournament_usage = Prediction.get_user_two_star_usage(user, match.tournament)
            global_usage = Prediction.get_user_two_star_usage(user)
            
            if tournament_usage >= config.max_per_user_per_tournament:
                raise serializers.ValidationError(
                    f"You have reached the maximum Two-Star predictions ({config.max_per_user_per_tournament}) for this tournament"
                )
            
            if global_usage >= config.max_per_user_global:
                raise serializers.ValidationError(
                    f"You have reached the maximum Two-Star predictions ({config.max_per_user_global}) overall"
                )
        
        return attrs


class PredictionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = ['predicted_a', 'predicted_b', 'used_two_star']
    
    def validate(self, attrs):
        if not self.instance.can_edit():
            raise serializers.ValidationError(
                "This prediction can no longer be edited"
            )
        
        # Handle two-star toggle
        used_two_star = attrs.get('used_two_star', self.instance.used_two_star)
        
        # If user is trying to enable two-star
        if used_two_star and not self.instance.used_two_star:
            config = TwoStarConfig.objects.first()
            if not config or not config.enabled:
                raise serializers.ValidationError(TWO_STAR_DISABLED_MESSAGE)
            
            user = self.context['request'].user
            tournament_usage = Prediction.get_user_two_star_usage(user, self.instance.match.tournament)
            global_usage = Prediction.get_user_two_star_usage(user)
            
            if tournament_usage >= config.max_per_user_per_tournament:
                raise serializers.ValidationError(
                    f"You have reached the maximum Two-Star predictions ({config.max_per_user_per_tournament}) for this tournament"
                )
            
            if global_usage >= config.max_per_user_global:
                raise serializers.ValidationError(
                    f"You have reached the maximum Two-Star predictions ({config.max_per_user_global}) overall"
                )
        
        return attrs


class TwoStarConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = TwoStarConfig
        fields = ['enabled', 'max_per_user_per_tournament', 'max_per_user_global', 'description']
