from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import models
from .models import ChatRoom, Message, PrivateChat, PrivateMessage
from .serializers import (
    ChatRoomSerializer, MessageSerializer, 
    PrivateChatSerializer, PrivateMessageSerializer
)

User = get_user_model()

# Constants for error messages
PRIVATE_CHAT_NOT_FOUND = 'Private chat not found'
CHAT_ROOM_NOT_FOUND = 'Chat room not found'

class ChatRoomListView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)
    
    def perform_create(self, serializer):
        room = serializer.save(created_by=self.request.user)
        room.participants.add(self.request.user)

class ChatRoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)

class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return Message.objects.filter(room_id=room_id, room__participants=self.request.user)
    
    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
        serializer.save(sender=self.request.user, room=room)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_message(request, room_id):
    """Send a message to a chat room"""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
        content = request.data.get('content')
        
        if not content or not content.strip():
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        message = Message.objects.create(
            room=room,
            sender=request.user,
            content=content.strip()
        )
        
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
    
    except ChatRoom.DoesNotExist:
        return Response({'error': CHAT_ROOM_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_read(request, room_id):
    """Mark all messages in a room as read for the current user"""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
        # Mark messages as read (excluding user's own messages)
        unread_messages = Message.objects.filter(room=room, is_read=False).exclude(sender=request.user)
        unread_messages.update(is_read=True)
        
        return Response({'message': f'Marked {unread_messages.count()} messages as read'})
    
    except ChatRoom.DoesNotExist:
        return Response({'error': CHAT_ROOM_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)

class PrivateChatListView(generics.ListAPIView):
    serializer_class = PrivateChatSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return PrivateChat.objects.filter(models.Q(user1=user) | models.Q(user2=user))

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_private_chat(request):
    """Start or get a private chat with another user"""
    other_user_id = request.data.get('user_id')
    
    if not other_user_id:
        return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        other_user = User.objects.get(id=other_user_id)
        
        # Check if private chat already exists
        private_chat = PrivateChat.objects.filter(
            models.Q(user1=request.user, user2=other_user) |
            models.Q(user1=other_user, user2=request.user)
        ).first()
        
        if not private_chat:
            # Create new private chat
            private_chat = PrivateChat.objects.create(
                user1=request.user,
                user2=other_user
            )
        
        return Response(PrivateChatSerializer(private_chat, context={'request': request}).data)
    
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_private_message(request, chat_id):
    """Send a message in a private chat"""
    try:
        chat = PrivateChat.objects.filter(
            id=chat_id
        ).filter(models.Q(user1=request.user) | models.Q(user2=request.user)).first()
        
        if not chat:
            return Response({'error': PRIVATE_CHAT_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        
        content = request.data.get('content')
        
        if not content or not content.strip():
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        message = PrivateMessage.objects.create(
            chat=chat,
            sender=request.user,
            content=content.strip()
        )
        
        return Response(PrivateMessageSerializer(message).data, status=status.HTTP_201_CREATED)
    
    except Exception:
        return Response({'error': 'Failed to send message'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_private_messages(request, chat_id):
    """Get messages in a private chat"""
    try:
        chat = PrivateChat.objects.filter(
            id=chat_id
        ).filter(models.Q(user1=request.user) | models.Q(user2=request.user)).first()
        
        if not chat:
            return Response({'error': PRIVATE_CHAT_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        
        messages = PrivateMessage.objects.filter(chat=chat)
        return Response(PrivateMessageSerializer(messages, many=True).data)
    
    except Exception:
        return Response({'error': 'Failed to get messages'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_user_to_group(request, room_id):
    """Add a user to a group chat room"""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user, is_group_chat=True)
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_to_add = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is already in the room
        if room.participants.filter(id=user_id).exists():
            return Response({'error': 'User is already in the group'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add user to the room
        room.participants.add(user_to_add)
        
        return Response({
            'message': f'{user_to_add.username} added to {room.name}',
            'user': {
                'id': user_to_add.id,
                'username': user_to_add.username,
                'first_name': user_to_add.first_name,
                'last_name': user_to_add.last_name
            }
        }, status=status.HTTP_200_OK)
    
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Group chat not found or you are not a participant'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_private_messages_read(request, chat_id):
    """Mark all messages in a private chat as read for the current user"""
    try:
        chat = PrivateChat.objects.filter(
            id=chat_id
        ).filter(models.Q(user1=request.user) | models.Q(user2=request.user)).first()
        
        if not chat:
            return Response({'error': PRIVATE_CHAT_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        
        # Mark messages as read (excluding user's own messages)
        unread_messages = PrivateMessage.objects.filter(chat=chat, is_read=False).exclude(sender=request.user)
        unread_messages.update(is_read=True)
        
        return Response({'message': f'Marked {unread_messages.count()} messages as read'})
    
    except Exception:
        return Response({'error': 'Failed to mark messages as read'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def edit_message(request, room_id, message_id):
    """Edit a message in a chat room"""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
        message = Message.objects.get(id=message_id, room=room, sender=request.user)
        
        content = request.data.get('content')
        if not content or not content.strip():
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        message.content = content.strip()
        message.save()
        
        return Response(MessageSerializer(message).data, status=status.HTTP_200_OK)
    
    except ChatRoom.DoesNotExist:
        return Response({'error': CHAT_ROOM_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found or you can only edit your own messages'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def delete_message(request, room_id, message_id):
    """Delete a message in a chat room"""
    try:
        room = ChatRoom.objects.get(id=room_id, participants=request.user)
        message = Message.objects.get(id=message_id, room=room, sender=request.user)
        
        message.delete()
        
        return Response({'message': 'Message deleted successfully'}, status=status.HTTP_200_OK)
    
    except ChatRoom.DoesNotExist:
        return Response({'error': CHAT_ROOM_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found or you can only delete your own messages'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def edit_private_message(request, chat_id, message_id):
    """Edit a message in a private chat"""
    try:
        chat = PrivateChat.objects.filter(
            id=chat_id
        ).filter(models.Q(user1=request.user) | models.Q(user2=request.user)).first()
        
        if not chat:
            return Response({'error': PRIVATE_CHAT_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        
        message = PrivateMessage.objects.get(id=message_id, chat=chat, sender=request.user)
        
        content = request.data.get('content')
        if not content or not content.strip():
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        message.content = content.strip()
        message.save()
        
        return Response(PrivateMessageSerializer(message).data, status=status.HTTP_200_OK)
    
    except PrivateMessage.DoesNotExist:
        return Response({'error': 'Message not found or you can only edit your own messages'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def delete_private_message(request, chat_id, message_id):
    """Delete a message in a private chat"""
    try:
        chat = PrivateChat.objects.filter(
            id=chat_id
        ).filter(models.Q(user1=request.user) | models.Q(user2=request.user)).first()
        
        if not chat:
            return Response({'error': PRIVATE_CHAT_NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        
        message = PrivateMessage.objects.get(id=message_id, chat=chat, sender=request.user)
        
        message.delete()
        
        return Response({'message': 'Message deleted successfully'}, status=status.HTTP_200_OK)
    
    except PrivateMessage.DoesNotExist:
        return Response({'error': 'Message not found or you can only delete your own messages'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_users(request):
    """Get list of users for starting private chats"""
    users = User.objects.exclude(id=request.user.id).values('id', 'username', 'first_name', 'last_name')
    return Response(list(users))

