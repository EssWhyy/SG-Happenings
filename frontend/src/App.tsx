// src/App.tsx
import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      // If they are authenticated and sitting on the login page, push to dashboard
      if (window.location.pathname === '/login') {
        navigate('/dashboard');
      }
    }
  }, [auth.isAuthenticated, navigate]);

  const handleLogout = () => {
    // Clear tokens from the oidc-client storage and optionally redirect out of Cognito
    auth.removeUser(); 
    navigate('/login');
  };

  // Prevent routing flickers while the library checks if a session exists in storage
  if (auth.isLoading) {
    return <div className="loading-screen">Loading authentication...</div>;
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/login" 
        element={
          !auth.isAuthenticated ? (
            // empty callback, useEffect above handles post-login navigation automatically.
            <LoginPage onLogin={() => {}} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />

      {/* Protected Dashboard Route */}
      <Route 
        path="/dashboard" 
        element={
          auth.isAuthenticated ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Fallback Catch-All */}
      <Route 
        path="*" 
        element={<Navigate to={auth.isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  );
}