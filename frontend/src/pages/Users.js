import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Edit, Trash2, Menu, ChevronLeft, ChevronRight, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    first_name: '',
    last_name: '',
    is_paid: false,
    is_staff: false,
    notified: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}/`
        : '/api/admin/users/create/';
      
      const method = editingUser ? 'put' : 'post';
      
      await api[method](url, formData, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      await fetchUsers();
      setShowAddModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        first_name: '',
        last_name: '',
        is_paid: false,
        is_staff: false,
        notified: false
      });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const togglePaymentStatus = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      await api.patch(`/api/admin/users/${userId}/toggle-payment/`, {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('authToken');
        await api.delete(`/api/admin/users/${userId}/delete/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_paid: user.is_paid,
      is_staff: user.is_staff,
      notified: user.notified || false
    });
    setShowAddModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Gradient */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 shadow-xl">
              <div className="relative z-10">
                <h6 className="text-xl md:text-2xl font-bold text-white mb-1">User Management</h6>
                <p className="text-blue-100 text-sm">Manage users and payment status</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Search and Add User - Modernized */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center font-semibold shadow-lg transform hover:scale-105"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Users Table - Desktop */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {user.first_name && user.last_name ? 
                              `${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}` : 
                              (user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase())
                            }
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">
                              {user.first_name || ''} {user.last_name || ''}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          user.is_staff 
                            ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white' 
                            : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700'
                        }`}>
                          {user.is_staff ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              User
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => togglePaymentStatus(user.id)}
                          className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all transform hover:scale-105 shadow-md ${
                            user.is_paid
                              ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-700'
                              : 'bg-gradient-to-r from-red-400 to-pink-600 text-white hover:from-red-500 hover:to-pink-700'
                          }`}
                        >
                          {user.is_paid ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Unpaid
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-2 rounded-lg transition-all transform hover:scale-110"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-all transform hover:scale-110"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginatedUsers.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <UserPlus className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No users found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search' : 'Get started by creating a new user'}
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <UserPlus className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No users found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search' : 'Get started by creating a new user'}
                    </p>
                  </div>
                ) : (
                  paginatedUsers.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            {user.first_name && user.last_name ? 
                              `${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}` : 
                              (user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase())
                            }
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">
                              {user.first_name || ''} {user.last_name || ''}
                            </div>
                            <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-2 rounded-lg transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Email:</span>
                          <span className="text-xs text-gray-900 truncate ml-2">{user.email}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Phone:</span>
                          <span className="text-xs text-gray-900">{user.phone || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Role:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            user.is_staff 
                              ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {user.is_staff ? 'Admin' : 'User'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Status:</span>
                          <button
                            onClick={() => togglePaymentStatus(user.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              user.is_paid
                                ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-red-400 to-pink-600 text-white'
                            }`}
                          >
                            {user.is_paid ? 'Paid' : 'Unpaid'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pagination - Modernized */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Add/Edit User Modal - Modernized */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-50"></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingUser(null);
                        setFormData({
                          username: '',
                          email: '',
                          phone: '',
                          password: '',
                          first_name: '',
                          last_name: '',
                          is_paid: false,
                          is_staff: false,
                          notified: false
                        });
                      }}
                      className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter email"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Optional"
                          />
                        </div>

                        {!editingUser && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              required
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Min. 8 characters"
                              minLength="8"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={formData.first_name || ''}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Optional"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={formData.last_name || ''}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_staff"
                            checked={formData.is_staff}
                            onChange={(e) => setFormData({...formData, is_staff: e.target.checked})}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_staff" className="ml-3 block text-sm font-medium text-gray-900">
                            Admin User (can access admin features)
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_paid"
                            checked={formData.is_paid}
                            onChange={(e) => setFormData({...formData, is_paid: e.target.checked})}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_paid" className="ml-3 block text-sm font-medium text-gray-900">
                            Paid User (has system access)
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="notified"
                            checked={formData.notified || false}
                            onChange={(e) => setFormData({...formData, notified: e.target.checked})}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="notified" className="ml-3 block text-sm font-medium text-gray-900">
                            Admin Notified
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          setEditingUser(null);
                          setFormData({
                            username: '',
                            email: '',
                            password: '',
                            first_name: '',
                            last_name: '',
                            phone: '',
                            is_paid: false,
                            is_staff: false,
                            notified: false
                          });
                        }}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                      >
                        {editingUser ? 'Update User' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};