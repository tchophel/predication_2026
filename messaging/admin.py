from django.contrib import admin
from .models import ChatRoom, Message, PrivateChat, PrivateMessage

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'is_group_chat', 'created_at', 'participant_count']
    list_filter = ['is_group_chat', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    
    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'room', 'content_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'

@admin.register(PrivateChat)
class PrivateChatAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'created_at', 'last_message_at']
    list_filter = ['created_at', 'last_message_at']
    search_fields = ['user1__username', 'user2__username']
    readonly_fields = ['created_at', 'last_message_at']

@admin.register(PrivateMessage)
class PrivateMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'chat', 'content_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
