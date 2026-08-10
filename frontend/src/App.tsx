import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import OneMapSingapore from './pages/Map';
import type { Listing } from '../../shared/apiContract';

interface Coordinates {
  lat: number;
  lng: number;
}

const ViewportContext = createContext<{ isMobile: boolean }>({ isMobile: false });
export const useViewport = () => useContext(ViewportContext);

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();
  const backendUrl = import.meta.env.VITE_API_URL;

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);
  
  // Lift listings state so both Map and Dashboard share DynamoDB data
  const [listings, setListings] = useState<Listing[]>([]);

  // 1. Fetch initial DynamoDB listings on application mount
  const fetchListings = async () => {
    try {
      console.log('[App] Fetching initial listings from DynamoDB backend...');
      const res = await fetch(`${backendUrl}/api/listings`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data: Listing[] = await res.json();
      console.log(`[App] Successfully fetched ${data.length} listings from DynamoDB:`, data);
      setListings(data);
    } catch (err) {
      console.error('[App] Error fetching initial listings:', err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [backendUrl]);

  // Triggered when a node is added to the map
  const handleNodeAddedOnMap = (lat: number, lng: number) => {
    console.log('[App] Node clicked on map at:', { lat, lng });
    setPendingCoords({ lat, lng });
    setIsSidebarOpen(true);
  };

  // Clears pending coordinates so temporary marker disappears
  const handleCloseSidebar = () => {
    console.log('[App] Closing sidebar / resetting draft coordinates.');
    setPendingCoords(null);
    setIsSidebarOpen(false);
  };

  // 2. Add new listing to state upon successful deployment so it persists on the map
  const handleDeploySuccess = (newListing?: Listing) => {
    console.log('[App] Listing successfully deployed to DynamoDB:', newListing);
    if (newListing) {
      setListings((prev) => [...prev, newListing]);
    } else {
      // Re-sync from DB if payload isn't passed directly
      fetchListings();
    }
    setPendingCoords(null);
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
        <Route 
          path="/login" 
          element={<LoginPage onLogin={() => {}} />} 
        />

        <Route 
          path="/" 
          element={
            <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
              
              {/* Main Map Workspace - Passes listings to Map */}
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <OneMapSingapore 
                  listings={listings}
                  onNodeAdded={handleNodeAddedOnMap} 
                  pendingCoords={pendingCoords} 
                />
              </div>

              {/* Dashboard Panel */}
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
                    onClick={handleCloseSidebar}
                    style={{ 
                      position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
                      background: '#555', color: '#fff', border: 'none', borderRadius: '4px', 
                      cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.85rem' 
                    }}
                  >
                    ✕ Close
                  </button>
                  
                  <Dashboard 
                    listings={listings}
                    setListings={setListings}
                    onLogout={handleLogout} 
                    pendingCoords={pendingCoords}
                    onSuccess={handleDeploySuccess}
                    onClose={handleCloseSidebar}
                  />
                </div>
              )}

            </div>
          } 
        />

        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </ViewportContext.Provider>
  );
}