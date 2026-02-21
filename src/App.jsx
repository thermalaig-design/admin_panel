import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './Home';
import AdminPanel from './admin/AdminPanel';
import LoginForm from './components/LoginForm';
import { authService } from './services/authService';

const HospitalTrusteeApp = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  useEffect(() => {
    // Check authentication status on app load
    const checkAuthStatus = () => {
      try {
        const authStatus = authService.isAuthenticated();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
      setAuthCheckComplete(true);
    };
    
    checkAuthStatus();
  }, []); // Empty dependency array to run only once

  // Navigation handler for admin panel
  const handleNavigate = (screen) => {
    const routeMap = {
      'home': '/',
      'admin': '/admin',
      'main': '/admin/main',
      'appointments': '/admin/appointments',
      'referrals': '/admin/referrals',
      'gallery': '/admin/gallery'
    };
    const route = routeMap[screen] || '/';
    navigate(route);
  };

  const handleLoginSuccess = () => {
    // Update auth state immediately
    setIsAuthenticated(true);
    // Ensure auth check is complete
    setAuthCheckComplete(true);
    navigate('/');
  };

  // Show loading state while checking auth
  if (!authCheckComplete) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="w-full min-h-screen overflow-y-auto">
      <Routes>
        <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Home 
                  onNavigate={handleNavigate}
                  onLogout={() => {
                    authService.logout();
                    setIsAuthenticated(false);
                    navigate('/login');
                  }}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        <Route 
          path="/login" 
          element={
            <LoginForm 
              onLoginSuccess={handleLoginSuccess}
              onBackToApp={() => navigate('/')}
              showBackButton={true}
            />
          } 
        />
        <Route 
          path="/admin/main" 
          element={
            isAuthenticated ? (
              <AdminPanel 
                initialView="main"
                onNavigate={handleNavigate}
                onLogout={() => {
                  authService.logout();
                  setIsAuthenticated(false);
                  navigate('/');
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            <Navigate to="/admin/main" replace />
          } 
        />
        <Route 
          path="/admin/appointments" 
          element={
            isAuthenticated ? (
              <AdminPanel 
                initialView="appointments"
                onNavigate={handleNavigate}
                onLogout={() => {
                  authService.logout();
                  setIsAuthenticated(false);
                  navigate('/');
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/admin/referrals" 
          element={
            isAuthenticated ? (
              <AdminPanel 
                initialView="referrals"
                onNavigate={handleNavigate}
                onLogout={() => {
                  authService.logout();
                  setIsAuthenticated(false);
                  navigate('/');
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/admin/gallery" 
          element={
            isAuthenticated ? (
              <AdminPanel 
                initialView="gallery"
                onNavigate={handleNavigate}
                onLogout={() => {
                  authService.logout();
                  setIsAuthenticated(false);
                  navigate('/');
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default HospitalTrusteeApp;
