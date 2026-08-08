// src/App.tsx
import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import OneMapSingapore from './pages/Map';

// Import your shared contract types if needed for typing coordinates
interface Coordinates {
  lat: number;
  lng: number;
}

const ViewportContext = createContext<{ isMobile: boolean }>({ isMobile: false });
export const useViewport = () => useContext(ViewportContext);

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // --- NEW SPA STATE FOR CROSS-COMPONENT COMMUNICATION ---
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);

  // Triggered when a node is added to the map
  const handleNodeAddedOnMap = (lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setIsSidebarOpen(true); // Automatically slide open/show the dashboard form
  };

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
        navigate('/dashboard'); // Or change this to your unified route
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
  {/* Login Route (Keep it if you need to manually navigate to it) */}
  <Route 
    path="/login" 
    element={<LoginPage onLogin={() => {}} />} 
  />

  {/* 
    TEMPORARY TESTING ROUTE: Removes the auth check so it renders immediately.
    You can also change the path to "/" so it serves as your default homepage.
  */}
  <Route 
    path="/" 
    element={
      <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        
        {/* Main Map Workspace */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <OneMapSingapore onNodeAdded={handleNodeAddedOnMap} />
        </div>

        {/* Dashboard Sliding/Appearing Panel */}
        {isSidebarOpen && (
          <div style={{
            width: isMobile ? '100%' : '450px',
            height: '100%',
            backgroundColor: '#242424',
            boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
            overflowY: 'auto',
            zIndex: 1100,
            position: isMobile ? 'absolute' : 'relative',
            right: 0,
            transition: 'all 0.3s ease'
          }}>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{ 
                position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
                background: '#555', color: '#fff', border: 'none', borderRadius: '4px', 
                cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.85rem' 
              }}
            >
              ✕ Close
            </button>
            
            <Dashboard 
              onLogout={handleLogout} 
              pendingCoords={pendingCoords}
              onSuccess={() => setIsSidebarOpen(false)} 
            />
          </div>
        )}

      </div>
    } 
  />

  {/* Fallback Catch-All redirects directly to the map workspace path "/" */}
  <Route 
    path="*" 
    element={<Navigate to="/" replace />} 
  />
</Routes>
    </ViewportContext.Provider>
  );
}