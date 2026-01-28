from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, PrivateChat, PrivateMessage

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    timestamp = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'is_read']

class ChatRoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'description', 'created_at', 'created_by', 
                 'participants', 'is_group_chat', 'messages', 'last_message', 'unread_count']
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class PrivateMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    timestamp = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    
    class Meta:
        model = PrivateMessage
        fields = ['id', 'sender', 'content', 'timestamp', 'is_read']

class PrivateChatSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    messages = PrivateMessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = PrivateChat
        fields = ['id', 'user1', 'user2', 'created_at', 'last_message_at', 
                 'messages', 'last_message', 'unread_count', 'other_user']
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return PrivateMessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
    
    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user:
            if obj.user1 == request.user:
                return UserSerializer(obj.user2).data
            else:
                return UserSerializer(obj.user1).data
        return None
