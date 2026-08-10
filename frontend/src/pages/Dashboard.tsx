import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import type { CreateListingRequest, CreateEditListingResponse, Listing, User } from '../../../shared/apiContract';

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

  // Fetch Users
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

  // Filter & Fetch Listings
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

      console.log('[Dashboard] Filtering listings with endpoint:', endpoint);
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

    // Block creation if no map point was selected
    if (!editingListingId && !pendingCoords) {
      return alert("Please select a location on the map before creating a listing.");
    }

    // Preserve existing coordinates during edits if pendingCoords is null
    const currentListing = listings.find((item) => item.id === editingListingId);
    const latitude = pendingCoords ? pendingCoords.lat : (currentListing?.latitude ?? 1.3521);
    const longitude = pendingCoords ? pendingCoords.lng : (currentListing?.longitude ?? 103.8198);

    if (editingListingId) {
      try {
        const payload = {
          title, type, contact, district, description,
          authorId: cognitoUserId, latitude, longitude
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
      } catch (err) {
        console.error('[Dashboard] Update error:', err);
        alert('Error updating listing.');
      }
    } else {
      const payload: CreateListingRequest = {
        title, type, contact, district, description,
        authorId: cognitoUserId, latitude, longitude,
      };

      try {
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
      } catch (err) {
        console.error('[Dashboard] Deploy error:', err);
        alert('Error saving listing to AWS.');
      }
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

  const startEditListing = (item: Listing) => {
    setEditingListingId(item.id);
    setTitle(item.title);
    setType(item.type);
    setContact(item.contact || '');
    setDistrict(item.district || 'Central');
    setDescription(item.description || '');
  };

  const clearListingForm = () => {
    setEditingListingId(null);
    setTitle('');
    setContact('');
    setDescription('');
  };

  const handleCancelOrClose = () => {
    clearListingForm();
    if (onClose) onClose();
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh',
      backgroundColor: '#242424', color: 'white', fontFamily: 'sans-serif', padding: '2rem'
    }}>
      <h1 style={{ color: '#646cff', marginBottom: '0.5rem' }}>Cloud Infrastructure Panel</h1>
      <p style={{ marginBottom: '1.5rem', color: statusMessage.includes('Failed') ? '#ff6b6b' : '#4cd137' }}>
        {statusMessage}
      </p>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            backgroundColor: activeTab === 'listings' ? '#646cff' : '#333', color: 'white'
          }}
        >
          📦 Listings Engine
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            backgroundColor: activeTab === 'users' ? '#646cff' : '#333', color: 'white'
          }}
        >
          👥 User Registry
        </button>
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
          <span style={{ color: '#aaa' }}>Logged in as:</span>
          <div style={{ fontWeight: 'bold', color: '#4cd137' }}>{cognitoUserEmail}</div>
        </div>
        <button 
          onClick={onLogout} 
          style={{ background: '#ff6b6b', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Log Out Session
        </button>
      </div>

      {/* LISTINGS SECTION */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
          <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
              <h3>Filter Scope (API Routes)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                <label>
                  District Target Search:
                  <select 
                    disabled={showOnlyMyListings} 
                    value={selectedDistrict} 
                    onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedType('All'); }}
                    style={{ width: '100%', padding: '0.4rem', backgroundColor: '#333', color: 'white' }}
                  >
                    <option value="All">All Regions</option>
                    <option value="Central">Central</option>
                    <option value="East">East</option>
                    <option value="North">North</option>
                  </select>
                </label>

                <label>
                  Business Classification Target:
                  <select 
                    disabled={showOnlyMyListings} 
                    value={selectedType} 
                    onChange={(e) => { setSelectedType(e.target.value); setSelectedDistrict('All'); }}
                    style={{ width: '100%', padding: '0.4rem', backgroundColor: '#333', color: 'white' }}
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

          <div style={{ flex: '1.2', minWidth: '320px' }}>
            <form onSubmit={handleSubmitListing} style={{
              backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '8px', border: '1px solid #333',
              display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{editingListingId ? "✏️ Edit Listing Structure" : "✨ Create New Listing"}</h3>
                
                <button 
                  type="button" 
                  onClick={handleCancelOrClose}
                  style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                Title:
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              </label>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  Type:
                  <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}>
                    <option value="Sale">Sale</option>
                    <option value="Event">Event</option>
                    <option value="Wanted">Wanted</option>
                  </select>
                </label>

                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  District GRC:
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}>
                    <option value="Central">Central</option>
                    <option value="East">East</option>
                    <option value="North">North</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                Contact Routing Info:
                <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                Description:
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ padding: '0.5rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{ backgroundColor: '#646cff', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', flex: 2 }}>
                  {editingListingId ? 'Push Update Payload' : 'Deploy to Master DB'}
                </button>
                
                <button type="button" onClick={handleCancelOrClose} style={{ backgroundColor: '#555', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>

            <div>
              <h3>Listings ({listings.length} entries):</h3>
              {listings.length === 0 ? (
                <p style={{ color: '#aaa' }}>No listings return for this operational query parameters.</p>
              ) : (
                listings.map((item) => (
                  <div key={item.id} style={{
                    backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '6px',
                    borderLeft: `4px solid ${item.authorId === cognitoUserId ? '#4cd137' : '#646cff'}`, marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.title} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({item.type} / {item.district})</span></h4>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => startEditListing(item)} style={{ background: '#333', color: '#fff', border: 'none', padding: '0.2rem 0.4rem', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDeleteListing(item.id, item.authorId)} style={{ background: '#ff6b6b', color: '#fff', border: 'none', padding: '0.2rem 0.4rem', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem' }}>Delete</button>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#ccc' }}>{item.description}</p>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: '#aaa' }}>Contact: {item.contact}</p>
                    <small style={{ color: '#666', fontSize: '0.75rem' }}>ID: {item.id} | Author: {item.authorId}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS SECTION */}
      {activeTab === 'users' && (
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <h3>Registered Users Directory ({users.length} entries)</h3>
          {users.length === 0 ? (
            <p style={{ color: '#aaa' }}>No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} style={{
                backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '6px',
                borderLeft: '4px solid #4cd137', marginBottom: '1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0' }}>{u.name || u.email}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Email: {u.email}</p>
                  <small style={{ color: '#666', fontSize: '0.75rem' }}>User ID: {u.id}</small>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  style={{ background: '#ff6b6b', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}
                >
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