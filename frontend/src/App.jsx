import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WhiskiesPage from './pages/WhiskiesPage';
import WhiskyDetailPage from './pages/WhiskyDetailPage';
import RatingsPage from './pages/RatingsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import WhiskyForm from './pages/admin/WhiskyForm';
import NewsEventForm from './pages/admin/NewsEventForm';
import UserManagementPage from './pages/admin/UserManagementPage';
import ContentModerationPage from './pages/admin/ContentModerationPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import DataExportPage from './pages/admin/DataExportPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />

          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/whiskies" element={<WhiskiesPage />} />
              <Route path="/whiskies/:id" element={<WhiskyDetailPage />} />
              
              {/* Auth routes (only for non-authenticated users) */}
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <RegisterPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/settings" 
                element={
                  <ProtectedRoute>
                    <ProfileSettingsPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/events" 
                element={<EventsPage />} 
              />
              <Route 
                path="/events/:id" 
                element={<EventDetailPage />} 
              />

              <Route 
                path="/ratings" 
                element={<RatingsPage />} 
              />

              {/* Admin routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/whiskies/new" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <WhiskyForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/whiskies/:id/edit" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <WhiskyForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/new" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <NewsEventForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:id/edit" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <NewsEventForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <UserManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/content" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <ContentModerationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <SystemSettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/export" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <DataExportPage />
                  </ProtectedRoute>
                } 
              />

              {/* 404 page */}
              <Route 
                path="*" 
                element={
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
                    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                } 
              />
            </Routes>
          </main>

          <footer className="bg-gray-800 text-white mt-16">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p>&copy; 2024 Åby Whisky Club. All rights reserved.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Built with ❤️ for whisky enthusiasts
                </p>
              </div>
            </div>
          </footer>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
