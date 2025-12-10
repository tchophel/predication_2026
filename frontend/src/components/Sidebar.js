import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  Home, 
  Calendar, 
  Trophy, 
  Users, 
  X,
  Upload,
  Settings
} from 'lucide-react';
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
      path: '/predictions', 
      icon: Trophy, 
      label: 'Predictions',
      description: 'Your predictions'
    },
    { 
      path: '/leaderboard', 
      icon: Users, 
      label: 'Leaderboard',
      description: 'Top players'
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
        path: '/import', 
        icon: Upload, 
        label: 'Import Matches',
        description: 'Import match data'
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isOpen ? 'fixed inset-y-0 left-0 z-50' : 'fixed inset-y-0 left-0 z-50 -translate-x-full'} 
        lg:relative lg:inset-0 lg:translate-x-0
        h-full w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Prediction</h2>
              <p className="text-xs text-blue-400 font-medium">Pro Edition</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* User Profile Section */}
        <Link
          to="/users"
          className="block px-6 py-6 border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-4 border border-blue-500/30">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 ml-4">
                <p className="text-base font-semibold text-white">{user?.username}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {user?.total_points || 0} pts
                  </span>
                  {user?.is_staff && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-1">
            {allMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  className={`
                    group relative flex items-center px-4 py-3 rounded-xl transition-all duration-200
                    ${item.isWelcome 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 mb-4' 
                      : isActive(item.path) 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                    ${item.isWelcome 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg' 
                      : isActive(item.path) 
                        ? 'bg-blue-700 shadow-blue-500/25 shadow-lg' 
                        : 'bg-slate-700 group-hover:bg-slate-600'
                    }
                  `}>
                    <Icon className={`h-5 w-5 ${item.isWelcome ? 'text-white' : ''}`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`font-medium ${item.isWelcome ? 'text-white text-sm' : ''}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs ${item.isWelcome ? 'text-blue-200' : isActive(item.path) ? 'text-blue-200' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive(item.path) && !item.isWelcome && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                  {item.isWelcome && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-700"></div>

          {/* Additional Options */}
          <div className="space-y-1">
            <button className="w-full flex items-center px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700 group-hover:bg-slate-600 transition-all duration-200">
                <Settings className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1 text-left">
                <p className="font-medium">Settings</p>
                <p className="text-xs text-slate-500">Preferences</p>
              </div>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired
};
