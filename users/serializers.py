from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PaymentLog


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True, allow_blank=False, allow_null=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'phone', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_phone(self, value):
        """Check if phone number already exists and validate format"""
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        
        # Basic phone validation (digits, spaces, +, -, ())
        import re
        phone_regex = re.compile(r'^[\d\s\-\(\)]+$')
        if not phone_regex.match(value) or len(re.sub(r'\D', '', value)) != 8:
            raise serializers.ValidationError("Please enter a valid phone number (exactly 8 digits).")
        
        return value.strip()
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Ensure new users are unpaid and not notified
        validated_data['is_paid'] = False
        validated_data['notified'] = False
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
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_paid', 'total_points', 'phone', 'notified']
        read_only_fields = ['id', 'username', 'is_paid', 'total_points']


class PaymentLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = PaymentLog
        fields = ['id', 'user', 'amount', 'proof', 'admin_verified', 'timestamp', 'notes']
        read_only_fields = ['timestamp', 'admin_verified']
