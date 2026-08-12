import { useAuth } from 'react-oidc-context';
import type { Listing } from '../../../shared/apiContract';
import CreateEditListingView from './CreateEditListingView';
import BookmarkDirectoryView from './BookmarkDirectoryView';
import ViewListingDetail from './ViewListingDetail';
import './styles/dashboard.scss';

export type DashboardView = 'create_edit' | 'bookmark' | 'view';

interface DashboardProps {
  view: DashboardView;
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onLogout: () => void;
  pendingCoords: { lat: number; lng: number } | null;
  onSuccess?: (newListing: Listing) => void;
  onClose?: () => void;
  selectedListing?: Listing | null;
  onSelectListing?: (listing: Listing) => void;
  onEditListing?: (listing: Listing) => void;
}

export default function Dashboard({
  view,
  listings,
  setListings,
  onLogout,
  pendingCoords,
  onSuccess,
  onClose,
  selectedListing,
  onSelectListing,
  onEditListing
}: DashboardProps) {
  const backendUrl = import.meta.env.VITE_API_URL;
  const auth = useAuth();
  const cognitoUserEmail = auth.user?.profile?.email || 'Unknown User';
  const cognitoUserId = auth.user?.profile?.sub || '';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-auth">
        <div className="user-info">
          <span className="user-label">Logged in as:</span>
          <div className="user-email">{cognitoUserEmail}</div>
        </div>
        <button onClick={onLogout} className="btn-logout">
          Log Out Session
        </button>
      </div>

      {view === 'create_edit' && (
        <CreateEditListingView
          backendUrl={backendUrl}
          cognitoUserId={cognitoUserId}
          selectedListing={selectedListing}
          pendingCoords={pendingCoords}
          listings={listings}
          setListings={setListings}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )}

      {view === 'bookmark' && (
        <BookmarkDirectoryView
          backendUrl={backendUrl}
          cognitoUserId={cognitoUserId}
          listings={listings}
          setListings={setListings}
          onSelectListing={onSelectListing}
          onEditListing={onEditListing}
        />
      )}

      {view === 'view' && (
        <ViewListingDetail
          selectedListing={selectedListing}
          cognitoUserId={cognitoUserId}
          onEditListing={onEditListing}
          onClose={onClose}
        />
      )}
    </div>
  );
}