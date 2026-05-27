import React, { createContext, useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

// Generate unique device ID
const generateDeviceId = () => {
  return 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    try {
      // Generate unique device ID
      const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
      localStorage.setItem('deviceId', deviceId);
      
      const response = await api.post('/api/auth/login/', {
        ...credentials,
        device_id: deviceId
      });
      const { user, token } = response.data;
      
      // Check if user is admin or paid user
      if (!user.is_staff && !user.is_paid) {
        return { 
          success: false, 
          error: 'Your account is not approved. Please contact admin for payment confirmation.' 
        };
      }
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentDeviceId', deviceId);
      localStorage.setItem('userData', JSON.stringify(user));
      setUser(user);
      
      // Set up session monitoring
      setupSessionMonitoring();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Sending registration data:', userData);
      const response = await api.post('/api/auth/register/', userData);
      console.log('Registration response:', response.data);
      // Don't automatically log in the user after registration
      // They need to pay and get admin approval first
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed';
      
      if (errorData) {
        if (errorData.username) {
          errorMessage = errorData.username[0];
        } else if (errorData.email) {
          errorMessage = errorData.email[0];
        } else if (errorData.phone) {
          errorMessage = errorData.phone[0];
        } else if (errorData.password) {
          errorMessage = errorData.password[0];
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      const deviceId = localStorage.getItem('currentDeviceId');
      if (deviceId) {
        await api.post('/api/auth/logout/', { device_id: deviceId });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentDeviceId');
      localStorage.removeItem('userData');
      setUser(null);
      setLoading(false);
    }
  };

  const setupSessionMonitoring = () => {
    // Check for session conflicts every 30 seconds
    const interval = setInterval(async () => {
      const token = localStorage.getItem('authToken');
      const deviceId = localStorage.getItem('currentDeviceId');
      
      if (token && deviceId) {
        try {
          const response = await api.get('/api/auth/check-session/', {
            headers: { 
              Authorization: `Token ${token}`,
              'X-Device-ID': deviceId
            }
          });
          
          if (!response.data.valid) {
            // Session invalidated by another device
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentDeviceId');
            setUser(null);
            alert('Your account has been logged in from another device. You have been logged out here.');
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('Session check error:', error);
        }
      }
    }, 30000);
    
    // Store interval ID for cleanup
    localStorage.setItem('sessionInterval', interval);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    const deviceId = localStorage.getItem('currentDeviceId');

    if (!token) {
      setLoading(false);
      return;
    }

    // Restore cached user immediately so the page doesn't flash to login
    const cached = localStorage.getItem('userData');
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch (_) { /* ignore parse error */ }
    }

    try {
      const response = await api.get('/api/auth/profile/', {
        headers: {
          Authorization: `Token ${token}`,
          'X-Device-ID': deviceId || ''
        }
      });
      const freshUser = response.data;
      localStorage.setItem('userData', JSON.stringify(freshUser));
      setUser(freshUser);
      if (deviceId) setupSessionMonitoring();
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Token is invalid or expired — force logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentDeviceId');
        localStorage.removeItem('userData');
        setUser(null);
      }
      // For network errors / 5xx — keep the cached user, don't log out
    }
    setLoading(false);
  };

  // Cleanup session monitoring on unmount
  React.useEffect(() => {
    return () => {
      const intervalId = localStorage.getItem('sessionInterval');
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        localStorage.removeItem('sessionInterval');
      }
    };
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password/', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send reset email' 
      };
    }
  };

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    forgotPassword,
    loading
  }), [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
