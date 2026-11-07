import { useEffect, useState, createContext, useContext, useCallback } from 'react';
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

const cognitoAuthConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY || 'https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_8JmiWWMJZ',
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID || '5lqa9a9o0nd3eb66uulika4ahs',
  redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
  response_type: 'code',
  scope: 'email openid profile',
  userStore: typeof window !== 'undefined' 
    ? new WebStorageStateStore({ store: window.localStorage }) 
    : undefined,
  automaticSilentRenew: true,
  onSigninCallback: () => {
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
  
  const currentUserId = auth.isAuthenticated 
    ? (auth.user?.profile?.sub || (auth.user?.profile as any)?.user_id || auth.user?.profile?.email) 
    : undefined;

  console.log('[Auth Debug] Authenticated:', auth.isAuthenticated, '| User ID:', currentUserId);

  const backendUrl = import.meta.env.VITE_API_URL;

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);
  
  const [dashboardView, setDashboardView] = useState<DashboardView>('bookmark');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);

  const fetchListings = useCallback(async () => {
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
  }, [backendUrl]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchListings();
      return;
    }

    try {
      console.log(`[App] Searching OpenSearch endpoint for: "${query}"`);
      const res = await fetch(`${backendUrl}/api/listings?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search request failed');
      
      const searchResults: Listing[] = await res.json();
      console.log(`[App] Received ${searchResults.length} search results from OpenSearch:`, searchResults);
      setListings(searchResults);
    } catch (err) {
      console.error('[App] Error executing OpenSearch query:', err);
    }
  }, [backendUrl, fetchListings]);

  const handleOpenBookmarks = () => {
    setSelectedListing(null);
    setPendingCoords(null);
    setDashboardView('bookmark');
    setIsSidebarOpen(true);
  };

  const handleToggleProfile = () => {
    if (!auth.isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  };

  const handleNodeAddedOnMap = (lat: number, lng: number) => {
    console.log('[App] New node location clicked on map at:', { lat, lng });
    setSelectedListing(null);
    setPendingCoords({ lat, lng });
    setDashboardView('create_edit');
    setIsSidebarOpen(true);
  };

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

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setPendingCoords(null);
    setDashboardView('create_edit');
    setIsSidebarOpen(true);
  };

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setDashboardView('view');
  };

  const handleCloseSidebar = () => {
    console.log('[App] Closing sidebar / resetting draft coordinates.');
    setPendingCoords(null);
    setSelectedListing(null);
    setIsSidebarOpen(false);
  };

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

  // Main chat route dispatcher
  const handleChat = (listing: Listing) => {
    setSelectedListing(listing);
    const isAuthor = listing.authorId === currentUserId;
    setDashboardView(isAuthor ? 'chat_directory' : 'chat');
    setIsSidebarOpen(true);
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
              
              <Header 
                onBookmarkClick={handleOpenBookmarks}
                onProfileClick={handleToggleProfile}
                onSearch={handleSearch}
                userAvatarUrl={avatarUrl}
              />

              <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
                
                <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                  <OneMapSingapore 
                    listings={listings}
                    currentUserId={currentUserId}
                    onNodeAdded={handleNodeAddedOnMap} 
                    onNodeClick={handleMapNodeClick}
                    pendingCoords={pendingCoords} 
                  />
                </div>

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
                      setView={setDashboardView}
                      listings={listings}
                      setListings={setListings}
                      selectedListing={selectedListing}
                      onSelectListing={handleSelectListing}
                      onEditListing={handleEditListing}
                      onLogout={handleLogout} 
                      onChat={handleChat}
                      pendingCoords={pendingCoords}
                      onSuccess={handleDeploySuccess}
                      onClose={handleCloseSidebar}
                      onOpenLogin={handleOpenLoginModal}
                    />
                  </div>
                )}

              </div>

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