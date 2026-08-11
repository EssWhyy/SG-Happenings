import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import type { CreateListingRequest, CreateEditListingResponse, Listing, User } from '../../../shared/apiContract';
import './styles/dashboard.scss';

interface DashboardProps {
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onLogout: () => void;
  pendingCoords: { lat: number; lng: number } | null;
  onSuccess?: (newListing: Listing) => void;
  onClose?: () => void;
}

export default function Dashboard({ listings, setListings, onLogout, pendingCoords, onSuccess, onClose }: DashboardProps) {
  const backendUrl = import.meta.env.VITE_API_URL;
  const auth = useAuth();

  const cognitoUserEmail = auth.user?.profile?.email || 'Unknown User';
  const cognitoUserId = auth.user?.profile?.sub || '';

  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to AWS Lambda...');

  // User management state
  const [users, setUsers] = useState<User[]>([]);

  // Filter state for listings
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showOnlyMyListings, setShowOnlyMyListings] = useState<boolean>(false);

  // Listing Form state
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Sale');
  const [contact, setContact] = useState('');
  const [district, setDistrict] = useState('Central');
  const [description, setDescription] = useState('');

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

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
    if (activeTab === 'listings') {
      filterListings();
    } else {
      fetchUsers();
    }
  }, [backendUrl, selectedDistrict, selectedType, showOnlyMyListings, cognitoUserId, activeTab]);

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
      
      // Defer deployment to S3/CloudFront until submit is triggered
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
        }
      } else {
        const payload: CreateListingRequest = {
          title, type, contact, district, description,
          authorId: cognitoUserId, latitude, longitude,
          image: imageUrl
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


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Type (Image only)
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      e.target.value = '';
      return;
    }

    // Validate File Size (Max 5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File size exceeds the 5 MB limit.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

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

  const startEditListing = (item: Listing) => {
    setEditingListingId(item.id);
    setTitle(item.title);
    setType(item.type);
    setContact(item.contact || '');
    setDistrict(item.district || 'Central');
    setDescription(item.description || '');
    setExistingImageUrl(item.image || '');
    setImagePreview(item.image || null);
    setSelectedFile(null);
  };

  const clearListingForm = () => {
    setEditingListingId(null);
    setTitle('');
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
      <h1 className="dashboard-title">Cloud Infrastructure Panel</h1>
      <p className={`status-message ${statusMessage.includes('Failed') ? 'status-failed' : 'status-ok'}`}>
        {statusMessage}
      </p>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('listings')}
          className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
        >
          📦 Listings Engine
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 User Registry
        </button>
      </div>

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

      {/* LISTINGS SECTION */}
      {activeTab === 'listings' && (
        <div className="listings-wrapper">
          <div className="filter-panel">
            <div className="filter-card">
              <h3>Filter Scope (API Routes)</h3>
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
                  Show only my items (/api/users/:id/listings)
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
                  Business Classification Target:
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
            <form onSubmit={handleSubmitListing} className="listing-form">
              <div className="form-header">
                <h3>{editingListingId ? "✏️ Edit Listing Structure" : "✨ Create New Listing"}</h3>
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
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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

            <div>
              <h3>Listings ({listings.length} entries):</h3>
              {listings.length === 0 ? (
                <p className="empty-list-notice">No listings return for this operational query parameters.</p>
              ) : (
                listings.map((item) => (
                  
                  <div key={item.id} className={`listing-card ${item.authorId === cognitoUserId ? 'is-owner' : ''}`}>
                    <div className="card-header">
                      <h4>
                        {item.title} <span className="badge">({item.type} / {item.district})</span>
                      </h4>
                      <div className="card-actions">
                        <button onClick={() => startEditListing(item)} className="btn-edit">Edit</button>
                        <button onClick={() => handleDeleteListing(item.id, item.authorId)} className="btn-delete">Delete</button>
                      </div>
                    </div>
                    {/* Display image inside the card if present */}
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
        </div>
      )}

      {/* USERS SECTION */}
      {activeTab === 'users' && (
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
  );
}