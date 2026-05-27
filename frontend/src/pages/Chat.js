import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, MessageSquare, Search, Plus, X, UserPlus, Edit2, Trash2, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

// Database connection helper
const databaseAPI = {
  baseURL: '/api/messaging',
  
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    console.log('Making API request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers
    });

    try {
      const response = await fetch(url, config);
      
      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      
      // Check if response is JSON
      const contentType = response.headers?.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned HTML instead of JSON. Database tables may not be created yet.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('Database API error:', error);
      console.error('Request details:', { url, config });
      throw error;
    }
  },

  async get(endpoint) {
    return this.request(endpoint);
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const Chat = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms');
  const [chatRooms, setChatRooms] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatRooms();
    fetchPrivateChats();
    fetchUsers();
    
    // Set up periodic refresh for chat lists to update unread counts
    const interval = setInterval(() => {
      fetchChatRooms();
      fetchPrivateChats();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    if (!selectedChat) return;

    try {
      let endpoint;
      
      if (activeTab === 'rooms') {
        endpoint = `/rooms/${selectedChat.id}/mark-read/`;
      } else {
        endpoint = `/private/${selectedChat.id}/mark-read/`;
      }
      
      await databaseAPI.post(endpoint);
      
      // Refresh the chat lists to update unread counts
      if (activeTab === 'rooms') {
        fetchChatRooms();
      } else {
        fetchPrivateChats();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [selectedChat, activeTab]);

  const fetchRoomParticipants = useCallback(async () => {
    if (!selectedChat || activeTab !== 'rooms') return;
    
    try {
      // Get participants for the selected room
      const roomData = await databaseAPI.get(`/rooms/${selectedChat.id}/`);
      setRoomParticipants(roomData.participants || []);
    } catch (error) {
      console.error('Error fetching room participants:', error);
      setRoomParticipants([]);
    }
  }, [selectedChat, activeTab]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

    try {
      console.log('Fetching messages...');
      let endpoint;
      
      if (activeTab === 'rooms') {
        endpoint = `/rooms/${selectedChat.id}/messages/`;
      } else {
        endpoint = `/private/${selectedChat.id}/messages/`;
      }
      
      const data = await databaseAPI.get(endpoint);
      console.log('Messages received:', data);
      
      // Handle paginated response - extract results array
      const messages = data.results || data;
      setMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  }, [selectedChat, activeTab]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      markMessagesAsRead();
      if (activeTab === 'rooms') {
        fetchRoomParticipants();
      }
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, activeTab, fetchMessages, fetchRoomParticipants, markMessagesAsRead]);

  const fetchChatRooms = async () => {
    try {
      console.log('Fetching chat rooms...');
      const data = await databaseAPI.get('/rooms/');
      console.log('Chat rooms received:', data);
      
      // Handle paginated response - extract results array
      const rooms = data.results || data;
      console.log('Number of rooms:', Array.isArray(rooms) ? rooms.length : 0);
      
      // Debug: Check if user is participant in rooms
      if (Array.isArray(rooms)) {
        rooms.forEach(room => {
          console.log('Room:', room.name, 'Participants:', room.participants?.map(p => p.username));
        });
      }
      
      setChatRooms(Array.isArray(rooms) ? rooms : []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setChatRooms([]);
    }
  };

  const fetchPrivateChats = async () => {
    try {
      console.log('Fetching private chats...');
      const data = await databaseAPI.get('/private/');
      console.log('Private chats received:', data);
      
      // Handle paginated response - extract results array
      const chats = data.results || data;
      setPrivateChats(Array.isArray(chats) ? chats : []);
    } catch (error) {
      console.error('Error fetching private chats:', error);
      setPrivateChats([]);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const data = await databaseAPI.get('/users/');
      console.log('Users received:', data);
      
      // Handle paginated response - extract results array
      const users = data.results || data;
      setUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      // Loading state removed
    }
  };

  const addUserToGroup = async (userId) => {
    if (!selectedChat || activeTab !== 'rooms') return;

    try {
      await databaseAPI.post(`/rooms/${selectedChat.id}/add_user/`, { user_id: userId });
      
      // Refresh room data to get updated participants
      await fetchRoomParticipants();
      await fetchChatRooms();
      
      alert('User added to group successfully!');
    } catch (error) {
      console.error('Error adding user to group:', error);
      alert('Failed to add user: ' + error.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Determine endpoint before try-catch
    let endpoint;
    if (activeTab === 'rooms') {
      endpoint = `/rooms/${selectedChat.id}/send/`;
    } else {
      endpoint = `/private/${selectedChat.id}/send/`;
    }

    try {
      console.log('Sending message...');
      console.log('Active tab:', activeTab);
      console.log('Selected chat:', selectedChat);
      console.log('Message content:', newMessage.trim());
      console.log('Endpoint:', endpoint);
      console.log('Full URL:', `/api/messaging${endpoint}`);
      
      const response = await databaseAPI.post(endpoint, { content: newMessage.trim() });
      console.log('Message sent successfully:', response);
      
      setNewMessage('');
      await fetchMessages();
      
      if (activeTab === 'rooms') {
        fetchChatRooms();
      } else {
        fetchPrivateChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // If the error is about not being a participant, try to join the room first
      if (error.message.includes('not found') || error.message.includes('participant')) {
        console.log('Attempting to join room...');
        try {
          await databaseAPI.post(`/rooms/${selectedChat.id}/add_user/`, { user_id: user.id });
          console.log('Joined room successfully, retrying message send...');
          // Retry sending the message
          const response = await databaseAPI.post(endpoint, { content: newMessage.trim() });
          console.log('Message sent successfully after joining room:', response);
          
          setNewMessage('');
          await fetchMessages();
          fetchChatRooms();
          return; // Exit early since we succeeded
        } catch (joinError) {
          console.error('Failed to join room:', joinError);
        }
      }
      
      alert('Failed to send message: ' + error.message);
    }
  };

  const createChatRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      console.log('Creating chat room:', newRoomName.trim());
      const roomData = await databaseAPI.post('/rooms/', {
        name: newRoomName.trim(),
        description: newRoomDescription.trim(),
        is_group_chat: true
      });
      
      console.log('Room created successfully:', roomData);
      setShowNewRoomModal(false);
      setNewRoomName('');
      setNewRoomDescription('');
      
      // Force refresh and ensure we're on the rooms tab
      setActiveTab('rooms');
      await fetchChatRooms();
      
      console.log('After fetch, current chatRooms:', chatRooms);
      
      setTimeout(() => {
        setSelectedChat(roomData);
        setActiveTab('rooms');
      }, 500);
      
      alert('Room created successfully!');
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Error creating room: ' + error.message);
    }
  };

  const startPrivateChat = async (userId) => {
    try {
      console.log('Starting private chat with user ID:', userId);
      const chatData = await databaseAPI.post('/private/start/', { user_id: userId });
      
      console.log('Chat data received:', chatData);
      setActiveTab('private');
      setSelectedChat(chatData);
      setShowUserList(false);
      fetchPrivateChats();
    } catch (error) {
      console.error('Error starting private chat:', error);
      alert('Error starting chat: ' + error.message);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      let endpoint;
      if (activeTab === 'rooms') {
        endpoint = `/rooms/${selectedChat.id}/messages/${messageId}/delete/`;
      } else {
        endpoint = `/private/${selectedChat.id}/messages/${messageId}/delete/`;
      }
      
      await databaseAPI.post(endpoint);
      await fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      if (error.message.includes('Database tables may not be created yet')) {
        alert('Delete functionality is not available yet. This feature will be enabled soon.');
      } else {
        alert('Failed to delete message: ' + error.message);
      }
    }
  };

  const startEditMessage = (message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const saveEditMessage = async () => {
    if (!editContent.trim() || !editingMessage) return;

    try {
      let endpoint;
      if (activeTab === 'rooms') {
        endpoint = `/rooms/${selectedChat.id}/messages/${editingMessage}/edit/`;
      } else {
        endpoint = `/private/${selectedChat.id}/messages/${editingMessage}/edit/`;
      }
      
      await databaseAPI.post(endpoint, { content: editContent.trim() });
      setEditingMessage(null);
      setEditContent('');
      await fetchMessages();
    } catch (error) {
      console.error('Error editing message:', error);
      if (error.message.includes('Database tables may not be created yet')) {
        alert('Edit functionality is not available yet. This feature will be enabled soon.');
        cancelEdit();
      } else {
        alert('Failed to edit message: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1">
        <Navbar />
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden" style={{ height: '90vh', maxHeight: '700px' }}>
            <div className="flex h-full">
              {/* Chat List Sidebar - Messenger Style */}
              <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white border-r border-gray-100 flex flex-col`}>
                {/* Header */}
                <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Chats
                    </h1>
                    <div className="flex space-x-1 sm:space-x-2">
                      <button
                        onClick={() => setShowNewRoomModal(true)}
                        className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                        title="Create Room"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </button>
                      <button
                        onClick={() => setShowUserList(true)}
                        className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                        title="New Chat"
                      >
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="flex bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className={`flex-1 py-1.5 px-1.5 sm:py-2 sm:px-2 md:py-2.5 md:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'rooms'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 inline mr-1 sm:mr-1.5 md:mr-2" />
                      <span className="hidden xs:inline">Rooms</span>
                      <span className="xs:hidden">R</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('private')}
                      className={`flex-1 py-1.5 px-1.5 sm:py-2 sm:px-2 md:py-2.5 md:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'private'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 inline mr-1 sm:mr-1.5 md:mr-2" />
                      <span className="hidden xs:inline">Private</span>
                      <span className="xs:hidden">P</span>
                    </button>
                  </div>
                </div>
                
                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    if (activeTab === 'rooms') {
                      if (chatRooms.length > 0) {
                        return chatRooms.map(room => (
                          <button
                            key={room.id}
                            onClick={() => setSelectedChat(room)}
                            className={`w-full p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-gray-50 text-left ${
                              selectedChat?.id === room.id 
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 sm:w-12 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                                {room.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{room.name}</h3>
                                {room.unread_count > 0 && (
                                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 ml-2 shadow-sm">
                                    {room.unread_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {room.last_message?.content || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        </button>
                        ));
                      } else {
                        return (
                          <div className="p-4">
                            <div className="mb-4 text-center">
                              <h3 className="font-bold text-gray-900 mb-2">Available Rooms</h3>
                              <p className="text-sm text-gray-500">Join a room to start chatting</p>
                            </div>
                            <div className="space-y-2">
                              {chatRooms.length > 0 ? (
                                chatRooms.map(room => (
                                  <button
                                    key={room.id}
                                    onClick={() => setSelectedChat(room)}
                                    className={`w-full p-4 cursor-pointer transition-all duration-200 border-b border-gray-50 text-left ${
                                      selectedChat?.id === room.id 
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50' 
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                          {room.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        {room.unread_count > 0 && (
                                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                            {room.unread_count}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <h3 className="font-bold text-gray-900 truncate">{room.name}</h3>
                                          {room.unread_count > 0 && (
                                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full px-2.5 py-1 ml-2 shadow-sm">
                                              {room.unread_count}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                          {room.last_message?.content || 'No messages yet'}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <p className="text-gray-500">No available rooms at the moment</p>
                                  <button
                                    onClick={() => setShowNewRoomModal(true)}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                  >
                                    Create New Room
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    } else {
                      return privateChats.length > 0 ? privateChats.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`w-full p-4 cursor-pointer transition-all duration-200 border-b border-gray-50 text-left ${
                              selectedChat?.id === chat.id 
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {chat.other_user?.username?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-gray-900 truncate">
                                  {chat.other_user?.username}
                                </h3>
                                {chat.unread_count > 0 && (
                                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full px-2.5 py-1 ml-2 shadow-sm">
                                    {chat.unread_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {chat.last_message?.content || 'Start conversation'}
                              </p>
                            </div>
                          </div>
                        </button>
                        )) : (
                          <div className="p-4">
                            <div className="mb-4 text-center">
                              <h3 className="font-bold text-gray-900 mb-2">Start a conversation</h3>
                              <p className="text-sm text-gray-500">Click on a user to start chatting</p>
                            </div>
                            <div className="space-y-2">
                              {users.filter(u => u.id !== user?.id).map(userItem => (
                                <button
                                  key={userItem.id}
                                  onClick={() => startPrivateChat(userItem.id)}
                                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100 text-left"
                                >
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                    {userItem.username?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">{userItem.username}</p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {userItem.first_name} {userItem.last_name}
                                  </p>
                                </div>
                                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              </button>
                              ))}
                              {users.filter(u => u.id !== user?.id).length === 0 && (
                                <div className="text-center py-8">
                                  <p className="text-gray-500">No other users available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                    }
                  )()}
                </div>
              </div>

              {/* Chat Area - Messenger Style */}
              <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gradient-to-b from-gray-50 to-white`}>
                {selectedChat ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-white border-b border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                          {/* Back button for mobile */}
                          <button
                            onClick={() => setSelectedChat(null)}
                            className="md:hidden p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                          </button>
                          <div className="relative">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                              activeTab === 'rooms' 
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                : 'bg-gradient-to-br from-green-400 to-emerald-600'
                            }`}>
                              {activeTab === 'rooms' 
                                ? selectedChat.name?.charAt(0)?.toUpperCase() || '?'
                                : selectedChat.other_user?.first_name?.charAt(0)?.toUpperCase()}{selectedChat.other_user?.last_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            {activeTab === 'private' && (
                              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">
                              {activeTab === 'rooms' ? selectedChat.name : `${selectedChat.other_user?.first_name || ''} ${selectedChat.other_user?.last_name || ''}`.trim() || selectedChat.other_user?.username}
                            </h2>
                            {activeTab === 'rooms' && selectedChat.description && (
                              <p className="text-xs md:text-sm text-gray-500 truncate">{selectedChat.description}</p>
                            )}
                            {activeTab === 'rooms' && (
                              <p className="text-xs text-blue-600 font-semibold flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {roomParticipants.length} participants
                              </p>
                            )}
                            {activeTab === 'private' && (
                              <p className="text-xs text-green-600 font-semibold flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                                Active now
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Group management buttons for rooms */}
                        {activeTab === 'rooms' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowAddUserModal(true)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                              title="Add user to group"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-6 space-y-1 sm:space-y-2 md:space-y-3">
                      {messages.length > 0 ? (
                        messages.map(message => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-end space-x-1 sm:space-x-1.5 md:space-x-2 max-w-[85%] sm:max-w-xs md:max-w-md ${message.sender.id === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              {message.sender.id !== user.id && (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {message.sender.username?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                              <div>
                                {message.sender.id !== user.id && activeTab === 'rooms' && (
                                  <p className="text-xs font-semibold text-gray-600 mb-1 ml-1">
                                    {message.sender.username}
                                  </p>
                                )}
                                {editingMessage === message.id ? (
                                  <div className="bg-white border border-gray-300 rounded-lg p-2">
                                    <input
                                      type="text"
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                    />
                                    <div className="flex justify-end space-x-2 mt-2">
                                      <button
                                        onClick={cancelEdit}
                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={saveEditMessage}
                                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div
                                      className={`px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-2xl sm:rounded-3xl shadow-sm ${
                                        message.sender.id === user.id
                                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm'
                                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                      }`}
                                    >
                                      <p className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>
                                    </div>
                                    <div className={`flex items-center mt-1 space-x-1 ${
                                      message.sender.id === user.id ? 'justify-end' : 'justify-start'
                                    }`}>
                                      <p className="text-xs text-gray-400">
                                        {formatTime(message.timestamp)}
                                      </p>
                                      {message.sender.id === user.id && (
                                        <div className="flex space-x-1">
                                          <button
                                            onClick={() => startEditMessage(message)}
                                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Edit message"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => deleteMessage(message.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete message"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center px-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                            </div>
                            <p className="font-semibold text-gray-900 mb-1 text-sm md:text-base">No messages yet</p>
                            <p className="text-gray-500 text-sm md:text-base">Send a message to start the conversation</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-4 bg-white border-t border-gray-100">
                      <form onSubmit={sendMessage} className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Aa"
                          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 md:px-5 md:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm placeholder-gray-500"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="p-1.5 sm:p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-blue-600"
                        >
                          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md px-4 md:px-6">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl">
                        <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Your Messages</h3>
                      <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                        Send private messages to friends or start a group conversation
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] sm:max-h-[600px] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  New Message
                </h3>
                <button
                  onClick={() => setShowUserList(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                <div>
                  {filteredUsers.map(userItem => (
                    <div
                      key={userItem.id}
                      onClick={() => {
                        console.log('User clicked:', userItem.username, 'ID:', userItem.id);
                        startPrivateChat(userItem.id);
                      }}
                      className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {userItem.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{userItem.username}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {userItem.first_name} {userItem.last_name}
                          </p>
                        </div>
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Room Modal */}
      {showNewRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create Room
                </h3>
                <button
                  onClick={() => setShowNewRoomModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={createChatRoom} className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-5">
                <label htmlFor="roomName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  className="w-full px-4 py-2 sm:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter room name..."
                />
              </div>
              <div className="mb-5 sm:mb-6">
                <label htmlFor="roomDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="roomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-4 py-2 sm:py-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows={3}
                  placeholder="What's this room about?"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="flex-1 px-4 py-2 sm:px-5 sm:py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 font-semibold transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg transition-all text-sm sm:text-base"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User to Group Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] sm:max-h-[600px] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Add User to Group
                </h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Current Participants */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Participants ({roomParticipants.length})</h4>
                <div className="space-y-2">
                  {roomParticipants.map(participant => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {participant.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{participant.username}</p>
                        <p className="text-xs text-gray-500">{participant.first_name} {participant.last_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Available Users to Add */}
              <div className="p-4 sm:p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Participant</h4>
                {filteredUsers.filter(u => !roomParticipants.find(p => p.id === u.id) && u.id !== user?.id).length > 0 ? (
                  <div className="space-y-2">
                    {filteredUsers.filter(u => !roomParticipants.find(p => p.id === u.id) && u.id !== user?.id).map(userItem => (
                      <div
                        key={userItem.id}
                        onClick={() => addUserToGroup(userItem.id)}
                        className="flex items-center space-x-3 p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100 rounded-lg"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {userItem.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{userItem.username}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {userItem.first_name} {userItem.last_name}
                          </p>
                        </div>
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No available users to add</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};