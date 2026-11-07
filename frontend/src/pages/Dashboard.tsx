import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import type { Listing } from '../../../shared/apiContract';
import CreateEditListingView from './CreateEditListingView';
import BookmarkDirectoryView from './BookmarkDirectoryView';
import ViewListingDetail from './ViewListingDetail';
import ChatView from './ChatView';
import ChatDirectoryView from './ChatDirectoryView';
import './styles/dashboard.scss';

export type DashboardView = 'create_edit' | 'bookmark' | 'view' | 'chat' | 'chat_directory';

interface DashboardProps {
  view: DashboardView;
  setView?: (view: DashboardView) => void;
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onLogout: () => void;
  pendingCoords: { lat: number; lng: number } | null;
  onSuccess?: (newListing: Listing) => void;
  onClose?: () => void;
  selectedListing?: Listing | null;
  onSelectListing?: (listing: Listing) => void;
  onEditListing?: (listing: Listing) => void;
  onChat?: (listing: Listing) => void;
  onOpenLogin?: () => void;
}

export default function Dashboard({
  view,
  setView,
  listings,
  setListings,
  onLogout,
  pendingCoords,
  onSuccess,
  onClose,
  selectedListing,
  onSelectListing,
  onEditListing,
  onChat,
  onOpenLogin
}: DashboardProps) {
  const backendUrl = import.meta.env.VITE_API_URL;
  const auth = useAuth();
  const cognitoUserEmail = auth.user?.profile?.email || 'Unknown User';
  const cognitoUserId = auth.user?.profile?.sub || '';

  const [selectedChatRecipientId, setSelectedChatRecipientId] = useState<string | null>(null);


  const handleChat = (listing: Listing) => {
    const isAuthor = listing.authorId === cognitoUserId;

    if (isAuthor) {
      if (setView) {
        setView('chat_directory');
      }
    } else {
      if (onChat) {
        onChat(listing);
      } else if (setView) {
        setSelectedChatRecipientId(listing.authorId);
        setView('chat');
      }
    }
  };

  const handleSelectChatFromDirectory = (recipientId: string) => {
    setSelectedChatRecipientId(recipientId);
    if (setView) setView('chat');
  };

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
          onOpenLogin={onOpenLogin}
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
          onOpenLogin={onOpenLogin}
        />
      )}

      {view === 'view' && (
        <ViewListingDetail
          selectedListing={selectedListing}
          cognitoUserId={cognitoUserId}
          onEditListing={onEditListing}
          onClose={onClose}
          onChat={handleChat}
        />
      )}

      {view === 'chat_directory' && selectedListing && (
        <ChatDirectoryView
          listing={selectedListing}
          currentUserId={cognitoUserId}
          onBack={() => {
            if (setView) setView('view');
          }}
          onSelectChat={handleSelectChatFromDirectory}
        />
      )}

      {view === 'chat' && selectedListing && (
        <ChatView
          listing={selectedListing}
          currentUserId={cognitoUserId}
          currentUserEmail={cognitoUserEmail}
          recipientId={selectedChatRecipientId || selectedListing.authorId}
          onBack={() => {
            if (setView) {
              const isAuthor = selectedListing.authorId === cognitoUserId;
              setView(isAuthor ? 'chat_directory' : 'view');
            }
          }}
        />
      )}
    </div>
  );
}