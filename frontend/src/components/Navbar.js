import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, LogOut, Bell, MessageCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.is_staff || user?.username === 'admin') {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      
      // Also refresh when page gains focus (user navigates back from Users page)
      const handleFocus = () => {
        fetchNotifications();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
    
    // Fetch chat unread counts for all users
    if (user) {
      fetchChatUnreadCount();
      const chatInterval = setInterval(fetchChatUnreadCount, 10000);
      return () => clearInterval(chatInterval);
    }
  }, [user]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleMarkAllAsPaid = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      // Mark all unpaid users as paid
      const response = await fetch('http://localhost:8000/api/auth/admin/mark-all-paid/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('All users marked as paid successfully');
        // Refresh notifications to update the list
        fetchNotifications();
        setShowNotifications(false);
      } else {
        console.error('Failed to mark all as paid:', response.status);
      }
    } catch (error) {
      console.error('Error marking all as paid:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching notifications with token:', token ? 'exists' : 'missing');

      // Fetch new user registrations (notifications for admin)
      const response = await fetch('http://localhost:8000/api/auth/admin/new-users/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const allUsers = await response.json();
        console.log('Raw API response:', allUsers);
        console.log('Type of response:', typeof allUsers);
        console.log('Is array:', Array.isArray(allUsers));
        
        // Filter for ONLY unpaid users
        const unpaidUsers = Array.isArray(allUsers) ? allUsers.filter(user => {
          console.log(`Processing user: ${user.username}, is_paid: ${user.is_paid}, type: ${typeof user.is_paid}`);
          
          // Check if user is unpaid (handle multiple data types)
          const isUnpaid = user.is_paid === false || 
                          user.is_paid === 'false' || 
                          user.is_paid === 0 || 
                          user.is_paid === '0' ||
                          !user.is_paid;
          
          console.log(`User ${user.username}: isUnpaid = ${isUnpaid}`);
          return isUnpaid;
        }) : [];
        
        console.log('Final unpaid users:', unpaidUsers);
        console.log('Setting notifications to:', unpaidUsers.length);
        console.log('Setting unread count to:', unpaidUsers.length);
        
        // Set notifications to only unpaid users
        setNotifications(unpaidUsers);
        
        // Set count to number of unpaid users
        setUnreadCount(unpaidUsers.length);
      } else {
        console.error('Failed to fetch notifications:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setUnreadCount(0);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setUnreadCount(0);
      setNotifications([]);
    }
  };

  const fetchChatUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }

      // Fetch both room and private chat unread counts
      const [roomsResponse, privateResponse] = await Promise.all([
        fetch('http://localhost:8000/api/messaging/rooms/', {
          headers: { 'Authorization': `Token ${token}` }
        }),
        fetch('http://localhost:8000/api/messaging/private/', {
          headers: { 'Authorization': `Token ${token}` }
        })
      ]);

      let totalUnread = 0;

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        const rooms = roomsData.results || roomsData;
        if (Array.isArray(rooms)) {
          totalUnread += rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
        }
      }

      if (privateResponse.ok) {
        const privateData = await privateResponse.json();
        const privateChats = privateData.results || privateData;
        if (Array.isArray(privateChats)) {
          totalUnread += privateChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
        }
      }

      setChatUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching chat unread count:', error);
      setChatUnreadCount(0);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Trophy className="h-8 w-8" />
              <span className="font-bold text-xl">Match Predictor</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                <button 
                  className="flex items-center space-x-1 hover:bg-indigo-700 px-2 sm:px-3 py-2 rounded transition-colors relative"
                  onClick={() => navigate('/chat')}
                >
                  <MessageCircle className="h-4 w-4" />
                  {chatUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </span>
                  )}
                </button>
                {/* Show notification bell only for admin/staff */}
                {(user?.is_staff || user?.username === 'admin') && (
                  <div className="relative">
                    <button
                      onClick={handleNotificationClick}
                      className="relative p-2 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                      title="View notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {/* Show badge only if there are unpaid users */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowNotifications(false)}
                        />
                        {/* Dropdown */}
                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-w-[calc(100vw-2rem)] right-2 sm:right-0">
                          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                Unpaid Users
                              </h3>
                              {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Users pending payment verification
                            </p>
                          </div>
                          <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((notifUser, index) => (
                                <div 
                                  key={notifUser.id || index} 
                                  className="p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setShowNotifications(false);
                                    window.location.href = '/users';
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3 flex-shrink-0">
                                          {notifUser.first_name?.charAt(0).toUpperCase() || notifUser.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                            {notifUser.username} 
                                          </p>
                                          <p className="text-xs text-gray-500 truncate">
                                            {notifUser.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center mt-1 sm:mt-2 ml-8 sm:ml-11">
                                        <span className={`inline-flex items-center text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border ${
                                          notifUser.is_new_user 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}>
                                          {notifUser.is_new_user ? (
                                            <>
                                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-1.5"></span>
                                              New User
                                            </>
                                          ) : (
                                            <>
                                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full mr-1 sm:mr-1.5"></span>
                                              Unpaid
                                            </>
                                          )}
                                        </span>
                                        {notifUser.phone && (
                                          <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                                            📱 {notifUser.phone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-6 sm:p-8 text-center">
                                <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                                <p className="text-gray-500 text-xs sm:text-sm font-medium">
                                  No unpaid users
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  All users have completed payment
                                </p>
                              </div>
                            )}
                          </div>
                          {notifications.length > 0 && (
                            <div className="p-2 sm:p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg space-y-2">
                              <button
                                onClick={handleMarkAllAsPaid}
                                className="w-full text-xs bg-green-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded hover:bg-green-700 font-medium transition-colors"
                              >
                                Mark All as Paid
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button 
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-1 bg-indigo-700 hover:bg-indigo-800 px-2 sm:px-3 py-2 rounded transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex space-x-1 sm:space-x-2">
                <Link 
                  to="/login" 
                  className="flex items-center space-x-1 bg-indigo-700 hover:bg-indigo-800 px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center space-x-1 bg-white text-blue-600 hover:bg-blue-50 px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4">
              <LogOut className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Are you sure you want to logout?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              You will need to sign in again to access your account.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};