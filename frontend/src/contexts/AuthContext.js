import React, { createContext, useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8001',
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
      const response = await api.post('/api/auth/login/', credentials);
      const { user, token } = response.data;
      
      // Check if user is admin or paid user
      if (!user.is_staff && !user.is_paid) {
        return { 
          success: false, 
          error: 'Your account is not approved. Please contact admin for payment confirmation.' 
        };
      }
      
      localStorage.setItem('authToken', token);
      setUser(user);
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
      await api.post('/api/auth/register/', userData);
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
      await api.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      // Force redirect by clearing loading state
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await api.get('/api/auth/profile/', {
          headers: { Authorization: `Token ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setLoading(false);
  };

  React.useEffect(() => {
    checkAuth();
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    loading
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
