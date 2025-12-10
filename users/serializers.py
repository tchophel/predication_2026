from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PaymentLog


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError("Invalid credentials")
            
            if not user.is_paid:
                raise serializers.ValidationError("Awaiting admin payment confirmation")
            
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include username and password")


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_paid', 'total_points', 'avatar']
        read_only_fields = ['id', 'username', 'is_paid', 'total_points']


class PaymentLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = PaymentLog
        fields = ['id', 'user', 'amount', 'proof', 'admin_verified', 'timestamp', 'notes']
        read_only_fields = ['timestamp', 'admin_verified']
