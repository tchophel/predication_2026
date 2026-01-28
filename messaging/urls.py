from django.urls import path
from . import views

urlpatterns = [
    # Chat rooms
    path('rooms/', views.ChatRoomListView.as_view(), name='chatroom-list'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='chatroom-detail'),
    path('rooms/<int:room_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('rooms/<int:room_id>/send/', views.send_message, name='send-message'),
    path('rooms/<int:room_id>/add_user/', views.add_user_to_group, name='add-user-to-group'),
    path('rooms/<int:room_id>/mark-read/', views.mark_messages_read, name='mark-messages-read'),
    path('rooms/<int:room_id>/messages/<int:message_id>/edit/', views.edit_message, name='edit-message'),
    path('rooms/<int:room_id>/messages/<int:message_id>/delete/', views.delete_message, name='delete-message'),
    
    # Private chats
    path('private/', views.PrivateChatListView.as_view(), name='private-chat-list'),
    path('private/start/', views.start_private_chat, name='start-private-chat'),
    path('private/<int:chat_id>/send/', views.send_private_message, name='send-private-message'),
    path('private/<int:chat_id>/messages/', views.get_private_messages, name='get-private-messages'),
    path('private/<int:chat_id>/mark-read/', views.mark_private_messages_read, name='mark-private-messages-read'),
    path('private/<int:chat_id>/messages/<int:message_id>/edit/', views.edit_private_message, name='edit-private-message'),
    path('private/<int:chat_id>/messages/<int:message_id>/delete/', views.delete_private_message, name='delete-private-message'),
    
    # Users
    path('users/', views.get_users, name='get-users'),
]
