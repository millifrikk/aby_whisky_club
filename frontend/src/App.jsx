import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import Navigation from './components/common/Navigation';
import useAppearance from './hooks/useAppearance';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestBrowsingGuard from './components/common/GuestBrowsingGuard';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WhiskiesPage from './pages/WhiskiesPage';
import WhiskyDetailPage from './pages/WhiskyDetailPage';
import RatingsPage from './pages/RatingsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import MembersPage from './pages/MembersPage';
import WishlistPage from './pages/WishlistPage';
import ComparisonPage from './pages/ComparisonPage';
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
import PendingWhiskiesPage from './pages/admin/PendingWhiskiesPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ComparisonProvider>
            <AppContent />
          </ComparisonProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { footerText } = useAppearance();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/whiskies" element={
                <GuestBrowsingGuard>
                  <WhiskiesPage />
                </GuestBrowsingGuard>
              } />
              <Route path="/whiskies/:id" element={
                <GuestBrowsingGuard>
                  <WhiskyDetailPage />
                </GuestBrowsingGuard>
              } />
              
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
              <Route 
                path="/members" 
                element={<MembersPage />} 
              />
              <Route 
                path="/wishlist" 
                element={<WishlistPage />} 
              />
              <Route 
                path="/comparison" 
                element={<ComparisonPage />} 
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
                path="/admin/whiskies/pending" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <PendingWhiskiesPage />
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
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <AnalyticsPage />
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
                <p>{footerText}</p>
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
  );
}

export default App;
