import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';
import { Grid } from 'lucide-react';

export const DashboardNavbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100">
              <Grid className="h-6 w-6" />
            </span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.total_points || 0} pts</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

DashboardNavbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired
};
