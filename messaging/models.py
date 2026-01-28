from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class ChatRoom(models.Model):
    """A chat room where users can communicate"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rooms')
    participants = models.ManyToManyField(User, related_name='chat_rooms', blank=True)
    is_group_chat = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class Message(models.Model):
    """Individual messages in chat rooms"""
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."

class PrivateChat(models.Model):
    """Private one-on-one chats between users"""
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='private_chats_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='private_chats_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user1', 'user2']
        ordering = ['-last_message_at']
    
    def __str__(self):
        return f"Chat between {self.user1.username} and {self.user2.username}"

class PrivateMessage(models.Model):
    """Messages in private chats"""
    chat = models.ForeignKey(PrivateChat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."
