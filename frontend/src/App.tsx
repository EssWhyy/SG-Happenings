// src/App.tsx
import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import OneMapSingapore from './pages/Map';

const ViewportContext = createContext<{ isMobile: boolean }>({ isMobile: false });
export const useViewport = () => useContext(ViewportContext);

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 768px)');
    setIsMobile(media.matches);

    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      if (window.location.pathname === '/login') {
        navigate('/dashboard');
      }
    }
  }, [auth.isAuthenticated, navigate]);

  const handleLogout = () => {
    auth.removeUser(); 
    navigate('/login');
  };

  if (auth.isLoading) {
    return <div className="loading-screen">Loading authentication...</div>;
  }

  return (
    <ViewportContext.Provider value={{ isMobile }}>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            !auth.isAuthenticated ? (
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
              <Dashboard onLogout={handleLogout} />
          } 
        />

        {/* Public Map Route */}
        <Route 
          path="/map" 
          element={<OneMapSingapore />} 
        />

        {/* Fallback Catch-All */}
        <Route 
          path="*" 
          element={<Navigate to={auth.isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </ViewportContext.Provider>
  );
}