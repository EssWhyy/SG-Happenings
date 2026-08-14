// App.tsx
import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from 'react-oidc-context';
import type { AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import LoginModal from './components/LoginModal';
import Dashboard from './pages/Dashboard';
import type { DashboardView } from './pages/Dashboard';
import OneMapSingapore from './pages/Map';
import Header from './components/Header';
import type { Listing } from '../../shared/apiContract';
import { getUserAvatarUrl } from './utils/getAvatarUrl';

// Configure OIDC Provider for AWS Cognito with Persistent LocalStorage
const cognitoAuthConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY || 'https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_8JmiWWMJZ',
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID || '5lqa9a9o0nd3eb66uulika4ahs',
  redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
  response_type: 'code',
  scope: 'email openid profile',
  // Persist JWT tokens and session data in localStorage across reloads/sessions
  userStore: typeof window !== 'undefined' 
    ? new WebStorageStateStore({ store: window.localStorage }) 
    : undefined,
  automaticSilentRenew: true,
  onSigninCallback: () => {
    // Clean up OIDC query parameters (?code=...) from the URL after redirect
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

interface Coordinates {
  lat: number;
  lng: number;
}

const ViewportContext = createContext<{ isMobile: boolean }>({ isMobile: false });
export const useViewport = () => useContext(ViewportContext);

function MainLayout() {
  const auth = useAuth();
  const backendUrl = import.meta.env.VITE_API_URL;

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);
  
  // Dashboard view and selection state
  const [dashboardView, setDashboardView] = useState<DashboardView>('bookmark');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

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

  // Handler for Header Bookmark button click
  const handleOpenBookmarks = () => {
    setSelectedListing(null);
    setPendingCoords(null);
    setDashboardView('bookmark');
    setIsSidebarOpen(true);
  };

  // Handler for Header Profile button click: opens modal if logged out, toggles dashboard if logged in
  const handleToggleProfile = () => {
    if (!auth.isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  };

  // 2. Triggered when a new node placement is initiated on the map (Create Mode)
  const handleNodeAddedOnMap = (lat: number, lng: number) => {
    console.log('[App] New node location clicked on map at:', { lat, lng });
    setSelectedListing(null);
    setPendingCoords({ lat, lng });
    setDashboardView('create_edit');
    setIsSidebarOpen(true);
  };

  // 3. Triggered when an existing node on the map is clicked (View Mode)
  const handleMapNodeClick = async (listingId: string) => {
    try {
      console.log(`[App] Fetching listing details for ID: ${listingId}`);
      const res = await fetch(`${backendUrl}/api/listings/${listingId}`);
      if (!res.ok) throw new Error('Failed to fetch listing data from backend');
      
      const data: Listing = await res.json();
      setSelectedListing(data);
      setPendingCoords(null);
      setDashboardView('view');
      setIsSidebarOpen(true);
    } catch (err) {
      console.error('[App] Error loading listing node:', err);
      alert('Could not load details for this location.');
    }
  };

  // 4. Triggered when clicking an Edit button inside View mode or Bookmark list
  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setPendingCoords(null);
    setDashboardView('create_edit');
    setIsSidebarOpen(true);
  };

  // 5. Triggered when selecting a card from the Bookmark listing
  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setDashboardView('view');
  };

  // Clears pending coordinates and selection state
  const handleCloseSidebar = () => {
    console.log('[App] Closing sidebar / resetting draft coordinates.');
    setPendingCoords(null);
    setSelectedListing(null);
    setIsSidebarOpen(false);
  };

  // Add/update listing to state upon successful deployment so it persists on the map
  const handleDeploySuccess = (newListing?: Listing) => {
    console.log('[App] Listing successfully deployed to DynamoDB:', newListing);
    if (newListing) {
      setListings((prev) => {
        const index = prev.findIndex((item) => item.id === newListing.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = newListing;
          return updated;
        }
        return [...prev, newListing];
      });
      setSelectedListing(newListing);
      setDashboardView('view');
    } else {
      fetchListings();
      setIsSidebarOpen(false);
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

  const handleLogout = () => {
    auth.removeUser(); 
    setIsSidebarOpen(false);
  };

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  if (auth.isLoading) {
    return <div className="loading-screen">Loading authentication...</div>;
  }

  const avatarUrl = auth.isAuthenticated 
    ? getUserAvatarUrl(auth.user?.profile) 
    : null;
    
  return (
    <ViewportContext.Provider value={{ isMobile }}>
      <Routes>
        <Route 
          path="/" 
          element={
            <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
              
              {/* Header Bar */}
              <Header 
                onBookmarkClick={handleOpenBookmarks}
                onProfileClick={handleToggleProfile}
                userAvatarUrl={avatarUrl}
              />

              {/* Main Content Area */}
              <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
                
                {/* Main Map Workspace */}
                <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                  <OneMapSingapore 
                    listings={listings}
                    onNodeAdded={handleNodeAddedOnMap} 
                    onNodeClick={handleMapNodeClick}
                    pendingCoords={pendingCoords} 
                  />
                </div>

                {/* Dashboard Side Panel */}
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
                    <Dashboard 
                      view={dashboardView}
                      listings={listings}
                      setListings={setListings}
                      selectedListing={selectedListing}
                      onSelectListing={handleSelectListing}
                      onEditListing={handleEditListing}
                      onLogout={handleLogout} 
                      pendingCoords={pendingCoords}
                      onSuccess={handleDeploySuccess}
                      onClose={handleCloseSidebar}
                      onOpenLogin={handleOpenLoginModal}
                    />
                  </div>
                )}

              </div>

              {/* Material UI Animated Modal Login */}
              <LoginModal 
                open={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
              />
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

export default function App() {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      <MainLayout />
    </AuthProvider>
  );
}