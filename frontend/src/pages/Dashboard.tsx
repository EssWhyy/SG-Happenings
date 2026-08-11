import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import type { CreateEditListingResponse, Listing, User } from '../../../shared/apiContract';
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

  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to AWS Lambda...');

  // User management state
  const [users, setUsers] = useState<User[]>([]);

  // Filter state for listings (Used in Bookmark view)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showOnlyMyListings, setShowOnlyMyListings] = useState<boolean>(false);

  // Listing Form state (Used in Create/Edit view)
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Sale');
  const [contact, setContact] = useState('');
  const [district, setDistrict] = useState('Central');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📍');

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

  const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})*$/u;

  // Sync selectedListing to form when switching to create_edit in edit mode
  useEffect(() => {
    if (view === 'create_edit' && selectedListing) {
      setEditingListingId(selectedListing.id);
      setTitle(selectedListing.title);
      setType(selectedListing.type);
      setEmoji(selectedListing.emoji || '📍');
      setContact(selectedListing.contact || '');
      setDistrict(selectedListing.district || 'Central');
      setDescription(selectedListing.description || '');
      setExistingImageUrl(selectedListing.image || '');
      setImagePreview(selectedListing.image || null);
      setSelectedFile(null);
    } else if (view === 'create_edit' && !selectedListing) {
      clearListingForm();
    }
  }, [view, selectedListing]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/debug/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: User[] = await res.json();
      setUsers(data);
      setStatusMessage('Users synced successfully.');
    } catch (err) {
      console.error('[Dashboard] Fetch users error:', err);
      setStatusMessage('Failed to pull user records.');
    }
  };

  const filterListings = async () => {
    try {
      let endpoint = `${backendUrl}/api/listings`;

      if (showOnlyMyListings && cognitoUserId) {
        endpoint = `${backendUrl}/api/users/${cognitoUserId}/listings`;
      } else if (selectedDistrict !== 'All') {
        endpoint = `${backendUrl}/api/listings/district/${selectedDistrict}`;
      } else if (selectedType !== 'All') {
        endpoint = `${backendUrl}/api/listings/type/${selectedType}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Network response was not ok');
      const data: Listing[] = await res.json();
      setListings(data);
      setStatusMessage('Listings synced successfully with AWS backend.');
    } catch (err) {
      console.error('[Dashboard] Filter fetch error:', err);
      setStatusMessage('Failed to pull updated listing scopes from AWS.');
    }
  };

  useEffect(() => {
    if (view === 'bookmark') {
      if (activeTab === 'listings') {
        filterListings();
      } else {
        fetchUsers();
      }
    }
  }, [backendUrl, selectedDistrict, selectedType, showOnlyMyListings, cognitoUserId, activeTab, view]);

  const uploadImageToS3 = async (file: File): Promise<string> => {
    const res = await fetch(`${backendUrl}/api/s3/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileType: file.type }),
    });

    if (!res.ok) throw new Error('Failed to obtain presigned upload URL.');
    const { uploadUrl, cdnUrl } = await res.json();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) throw new Error('Failed to upload file to S3.');
    return cdnUrl;
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contact) return alert("Please fill out Title and Contact!");
    if (!editingListingId && !pendingCoords) {
      return alert("Please select a location on the map before creating a listing.");
    }

    const currentListing = listings.find((item) => item.id === editingListingId);
    const latitude = pendingCoords ? pendingCoords.lat : (currentListing?.latitude ?? 1.3521);
    const longitude = pendingCoords ? pendingCoords.lng : (currentListing?.longitude ?? 103.8198);

    try {
      setStatusMessage('Deploying image to S3/CloudFront...');
      
      let imageUrl = existingImageUrl;
      if (selectedFile) {
        imageUrl = await uploadImageToS3(selectedFile);
      }

      if (editingListingId) {
        const payload = {
          title, type, contact, district, description,
          authorId: cognitoUserId, latitude, longitude,
          image: imageUrl
        };

        const response = await fetch(`${backendUrl}/api/listings/${editingListingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update listing');
        const data: CreateEditListingResponse = await response.json();

        if (data.success) {
          setListings(prev => prev.map(item => item.id === editingListingId ? data.listing : item));
          clearListingForm();
          alert('Listing updated successfully!');
          if (onSuccess) onSuccess(data.listing);
        }
      } else {
        const payload = {
          title,
          type,
          emoji: emoji || '📍',
          contact,
          district,
          description,
          authorId: cognitoUserId,
          latitude,
          longitude,
          image: imageUrl,
        };

        const response = await fetch(`${backendUrl}/api/listings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create listing');
        const data: CreateEditListingResponse = await response.json();

        if (data.success) {
          clearListingForm();
          alert(`Success! Created listing with ID: ${data.id}`);
          if (onSuccess) onSuccess(data.listing);
        }
      }
    } catch (err) {
      console.error('[Dashboard] Deploy error:', err);
      alert('Error saving listing or uploading image to AWS.');
    } finally {
      setStatusMessage('Listings synced successfully with AWS backend.');
    }
  };

  const handleDeleteListing = async (listingId: string, authorId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const response = await fetch(`${backendUrl}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId })
      });

      if (!response.ok) throw new Error('Delete request rejected.');
      setListings(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      console.error('[Dashboard] Delete error:', err);
      alert('Failed to delete listing.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) return;
    try {
      const response = await fetch(`${backendUrl}/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete user failed.');
      setUsers(prev => prev.filter(user => user.id !== userId));
      alert(`User ${userId} deleted successfully.`);
    } catch (err) {
      console.error('[Dashboard] User delete error:', err);
      alert('Failed to delete user.');
    }
  };

  const handleEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || EMOJI_REGEX.test(value)) {
      setEmoji(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File size exceeds the 5 MB limit.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearListingForm = () => {
    setEditingListingId(null);
    setTitle('');
    setEmoji('📍');
    setContact('');
    setDescription('');
    setSelectedFile(null);
    setImagePreview(null);
    setExistingImageUrl('');
  };

  const handleCancelOrClose = () => {
    clearListingForm();
    if (onClose) onClose();
  };

  return (
    <div className="dashboard-container">
      {/* Header Profile / Logout */}
      <div className="dashboard-header-auth">
        <div className="user-info">
          <span className="user-label">Logged in as:</span>
          <div className="user-email">{cognitoUserEmail}</div>
        </div>
        <button onClick={onLogout} className="btn-logout">
          Log Out Session
        </button>
      </div>

      {/* 1. CREATE / EDIT VIEW */}
      {view === 'create_edit' && (
        <div className="create-edit-wrapper">
          <form onSubmit={handleSubmitListing} className="listing-form">
            <div className="form-header">
              <h3>{editingListingId ? "✏️ Edit Listing" : "✨ Create New Listing"}</h3>
              <button type="button" onClick={handleCancelOrClose} className="btn-close">
                ✕
              </button>
            </div>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              Listing Image (Max 5MB):
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ padding: '0.5rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} 
              />
            </label>

            {imagePreview && (
              <div style={{ marginTop: '0.5rem' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }} />
              </div>
            )}

            <label className="form-field">
              Title:
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            <label className="form-field" style={{ flex: '0 0 80px' }}>
              Icon:
              <input 
                type="text" 
                value={emoji} 
                maxLength={2}
                placeholder="📍"
                onChange={handleEmojiChange} 
                style={{ textAlign: 'center', fontSize: '1.2rem' }}
              />
            </label>

            <div className="form-row">
              <label className="form-field">
                Type:
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Sale">Sale</option>
                  <option value="Event">Event</option>
                  <option value="Wanted">Wanted</option>
                </select>
              </label>

              <label className="form-field">
                District GRC:
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="Central">Central</option>
                  <option value="East">East</option>
                  <option value="North">North</option>
                </select>
              </label>
            </div>

            <label className="form-field">
              Contact Routing Info:
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>

            <label className="form-field">
              Description:
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </label>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingListingId ? 'Push Update Payload' : 'Deploy to Master DB'}
              </button>
              <button type="button" onClick={handleCancelOrClose} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. BOOKMARK VIEW */}
      {view === 'bookmark' && (
        <div className="bookmark-wrapper">
          <div className="tabs-container">
            <button
              onClick={() => setActiveTab('listings')}
              className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
            >
              📦 Bookmarks & Listings
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            >
              👥 User Registry
            </button>
          </div>

          {activeTab === 'listings' ? (
            <div className="listings-wrapper">
              <div className="filter-panel">
                <div className="filter-card">
                  <h3>Filter Scope</h3>
                  <div className="filter-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={showOnlyMyListings} 
                        onChange={(e) => {
                          setShowOnlyMyListings(e.target.checked);
                          setSelectedDistrict('All');
                          setSelectedType('All');
                        }} 
                      />
                      Show only my items
                    </label>

                    <label className="select-label">
                      District Target Search:
                      <select 
                        disabled={showOnlyMyListings} 
                        value={selectedDistrict} 
                        onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedType('All'); }}
                      >
                        <option value="All">All Regions</option>
                        <option value="Central">Central</option>
                        <option value="East">East</option>
                        <option value="North">North</option>
                      </select>
                    </label>

                    <label className="select-label">
                      Classification Target:
                      <select 
                        disabled={showOnlyMyListings} 
                        value={selectedType} 
                        onChange={(e) => { setSelectedType(e.target.value); setSelectedDistrict('All'); }}
                      >
                        <option value="All">All Operations</option>
                        <option value="Sale">Sale</option>
                        <option value="Event">Event</option>
                        <option value="Wanted">Wanted</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              <div className="content-panel">
                <h3>Listings ({listings.length} entries):</h3>
                {listings.length === 0 ? (
                  <p className="empty-list-notice">No listings match the current filters.</p>
                ) : (
                  listings.map((item) => (
                    <div 
                      key={item.id} 
                      className={`listing-card ${item.authorId === cognitoUserId ? 'is-owner' : ''}`}
                      onClick={() => onSelectListing && onSelectListing(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-header">
                        <h4>
                          {item.title} <span className="badge">({item.type} / {item.district})</span>
                        </h4>
                        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                          {item.authorId === cognitoUserId && (
                            <button 
                              onClick={() => onEditListing ? onEditListing(item) : undefined} 
                              className="btn-edit"
                            >
                              Edit
                            </button>
                          )}
                          <button onClick={() => handleDeleteListing(item.id, item.authorId)} className="btn-delete">
                            Delete
                          </button>
                        </div>
                      </div>

                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', margin: '0.5rem 0' }} 
                        />
                      )}

                      <p className="card-description">{item.description}</p>
                      <p className="card-contact">Contact: {item.contact}</p>
                      <small className="card-meta">ID: {item.id} | Author: {item.authorId}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="users-wrapper">
              <h3>Registered Users Directory ({users.length} entries)</h3>
              {users.length === 0 ? (
                <p className="empty-list-notice">No users found.</p>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="user-card">
                    <div className="user-details">
                      <h4>{u.name || u.email}</h4>
                      <p>Email: {u.email}</p>
                      <small>User ID: {u.id}</small>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} className="btn-delete-user">
                      Delete User
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

    {/* 3. VIEW STATE */}
    {view === 'view' && (
      <div className="view-listing-wrapper">
        {selectedListing ? (
          <div className="view-listing-card">
            <div className="view-header">
              <h2>{selectedListing.emoji} {selectedListing.title}</h2>
              <button type="button" onClick={handleCancelOrClose} className="btn-close">
                ✕
              </button>
            </div>

            {selectedListing.image && (
              <div className="view-image-container">
                <img 
                  src={selectedListing.image} 
                  alt={selectedListing.title} 
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} 
                />
              </div>
            )}

            <div className="view-details" style={{ marginTop: '1rem' }}>
              <p><strong>Type:</strong> <span className="badge">{selectedListing.type}</span></p>
              <p><strong>District:</strong> {selectedListing.district}</p>
              <p><strong>Contact:</strong> {selectedListing.contact}</p>
              <p><strong>Description:</strong> {selectedListing.description}</p>
              <p><strong>Author ID:</strong> {selectedListing.authorId}</p>
              {selectedListing.expiryDate && (
                <p><strong>Expires:</strong> {new Date(selectedListing.expiryDate).toLocaleDateString()}</p>
              )}
            </div>

            <div className="view-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              {selectedListing.authorId === cognitoUserId && (
                <button 
                  className="btn-edit" 
                  onClick={() => onEditListing && onEditListing(selectedListing)}
                >
                  ✏️ Edit Listing
                </button>
              )}
              <button className="btn-cancel" onClick={handleCancelOrClose}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <p className="empty-list-notice">No listing selected.</p>
        )}
      </div>
    )}
    </div>
  );
}