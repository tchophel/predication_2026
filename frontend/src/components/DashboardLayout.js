import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardNavbar } from './DashboardNavbar';

export const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isOpen={true} toggleSidebar={toggleSidebar} />
      </div>
      
      {/* Mobile sidebar (overlay) */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <Sidebar isOpen={true} toggleSidebar={toggleSidebar} />
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile navbar */}
        <DashboardNavbar toggleSidebar={toggleSidebar} />
        
        {/* Page content */}
        <main className="h-full p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
