import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Home, Calendar, Users, Trophy, Settings, Star, X, Shield, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard',
      description: 'Overview & stats'
    },
    { 
      path: '/matches', 
      icon: Calendar, 
      label: 'Matches',
      description: 'View all matches'
    },
    {
      path: '/leaderboard',
      icon: Users,
      label: 'Leaderboard',
      description: 'Top players'
    },
    {
      path: '/teams',
      icon: Flag,
      label: 'Teams',
      description: 'WC2026 teams'
    },
  ];

  const adminMenuItems = [];
  if (user?.username === 'admin') {
    adminMenuItems.push(
      { 
        path: '/users', 
        icon: Users, 
        label: 'User Management',
        description: 'Manage users'
      },
      { 
        path: '/matching', 
        icon: Calendar, 
        label: 'Match Management',
        description: 'Manage matches'
      },
      { 
        path: '/prediction-list', 
        icon: Star, 
        label: 'Prediction Awards',
        description: 'Award prediction points'
      },
    );
  }

  const allMenuItems = [...menuItems, ...adminMenuItems];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
        >
          <div className="absolute top-4 right-4">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <X className="text-gray-800 w-6 h-6" />
            </div>
          </div>
        </button>
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isOpen ? 'fixed inset-y-0 left-0 z-50' : 'fixed inset-y-0 left-0 z-50 -translate-x-full'} 
        lg:relative lg:inset-0 lg:translate-x-0
        min-h-screen w-64 sm:w-72 lg:w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out
      `}>
        {/* Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-5 shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Prediction</h2>
                <p className="text-xs text-blue-100 font-medium">Pro Edition</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* User Profile Section with Gradient */}
        <div className="px-4 sm:px-6 py-6 border-b border-slate-700/50">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-2xl p-4 border-2 border-blue-500/30 backdrop-blur-sm">
            <div className="relative z-10 flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user?.first_name?.charAt(0).toUpperCase()}{user?.last_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 ml-4 min-w-0">
                <p className="text-base font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-blue-200 truncate">{user?.email}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md">
                    {user?.total_points || 0} pts
                  </span>
                  {user?.is_staff && (
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {allMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  className={`
                    group relative flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform
                    ${active 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                      : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:scale-102'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                    ${active 
                      ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
                      : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                    }
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {item.label}
                    </p>
                    <p className={`text-xs truncate ${active ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider with Gradient */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>

          {/* Settings */}
          <div className="space-y-2">
            <Link
              to="/settings"
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              className={`
                group relative flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform
                ${isActive('/settings') 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                  : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:scale-102'
                }
              `}
            >
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                ${isActive('/settings') 
                  ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
                  : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                }
              `}>
                <Settings className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">Settings</p>
                <p className={`text-xs truncate ${isActive('/settings') ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                  Preferences
                </p>
              </div>
              {isActive('/settings') && (
                <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
              )}
            </Link>
          </div>
        </nav>

        {/* Footer with gradient accent */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">
              © 2026 Match Predictor
            </p>
            <p className="text-xs text-slate-500 mt-1">
              v2.0.0 Pro
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired
};