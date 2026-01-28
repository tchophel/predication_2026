import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { User, Phone, Lock, Eye, EyeOff, Mail, Menu, CheckCircle, XCircle, Shield } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (profileData.phone && !/^\d{8}$/.test(profileData.phone)) {
      showMessage('Phone number must be exactly 8 digits', 'error');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          username: profileData.username,
          phone: profileData.phone
        })
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('Profile updated successfully!', 'success');
        setProfileData(prev => ({
          ...prev,
          username: data.username,
          phone: data.phone
        }));
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (response.ok) {
        showMessage('Password updated successfully!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to update password', 'error');
      }
    } catch (error) {
      console.error('Password update error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = () => {
    const password = passwordData.newPassword;
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) strength++;
    
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['from-red-400 to-red-600', 'from-yellow-400 to-orange-500', 'from-blue-400 to-blue-600', 'from-green-400 to-emerald-600'];
    
    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || ''
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Gradient */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-xl">
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-blue-100">Manage your account settings and preferences</p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 rounded-xl p-4 border-2 transition-all ${
              messageType === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
            }`}>
              <div className="flex items-center">
                {messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                )}
                <p className={`font-medium ${messageType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Tabs and Content Card */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Tabs */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-4 px-6 font-semibold text-sm transition-all relative ${
                    activeTab === 'profile'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Settings
                  </div>
                  {activeTab === 'profile' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex-1 py-4 px-6 font-semibold text-sm transition-all relative ${
                    activeTab === 'password'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Password
                  </div>
                  {activeTab === 'password' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full"></div>
                  )}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 sm:p-8">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* User Info Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-3 mr-4">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{user?.first_name} {user?.last_name}</h3>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-600">+975 - {user?.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className="pl-12 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="pl-12 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="Email cannot be changed"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Email address cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="pl-12 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter phone number (8 digits)"
                        maxLength={8}
                        pattern="\d{8}"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Phone number must be exactly 8 digits</p>
                  </div>

                  <div className="pt-6 border-t-2 border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-bold mb-1">Password Security Tips:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Use at least 8 characters</li>
                          <li>Include uppercase and lowercase letters</li>
                          <li>Add numbers and special characters</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="pl-12 pr-12 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="pl-12 pr-12 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Password must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="pl-12 pr-12 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-700">Password Strength:</p>
                        {getPasswordStrength().label && (
                          <span className={`text-sm font-bold bg-gradient-to-r ${getPasswordStrength().color} bg-clip-text text-transparent`}>
                            {getPasswordStrength().label}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-2 flex-1 rounded-full transition-all ${
                              getPasswordStrength().strength >= level
                                ? `bg-gradient-to-r ${getPasswordStrength().color}`
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t-2 border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};