import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Home } from './components/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Matches } from './pages/Matches';
import { Predictions } from './pages/Predictions';
import { Leaderboard } from './pages/Leaderboard';
import { Users } from './pages/Users';
import { MatchManagement } from './pages/MatchManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Protected routes with dashboard layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/matches" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Matches />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/predictions" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Predictions />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Leaderboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/matching" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MatchManagement />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/import" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-gray-900">Import Matches</h1>
                    <p className="mt-2 text-gray-600">Import match data from external sources</p>
                    <div className="mt-8 bg-white shadow rounded-lg p-6">
                      <p className="text-gray-500">Import functionality coming soon...</p>
                    </div>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
