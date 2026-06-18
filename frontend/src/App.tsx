import { useEffect, useState } from 'react';
import type { CreateListingRequest, CreateEditListingResponse, Listing, User } from '../../shared/apiContract';

export default function App() {
  const backendUrl = import.meta.env.VITE_API_URL;

  // Global States
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to AWS Lambda...');
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Filtered States
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showOnlyMyListings, setShowOnlyMyListings] = useState<boolean>(false);

  // Create/Edit Listing Form States
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Sale');
  const [contact, setContact] = useState('');
  const [district, setDistrict] = useState('Central');
  const [description, setDescription] = useState('');

  // Create User Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // ----------------------------------------------------------------
  // 1. DATA FETCHING (GET REQUESTS)
  // ----------------------------------------------------------------

  // Fetch all users (Debug)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/debug/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: User[] = await res.json();
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        setCurrentUser(data[0]); // Auto-login to first user for convenience
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Main Listing Query Dispatcher (Applies filters dynamically matching backend routes)
  const fetchListings = async () => {
    try {
      let endpoint = `${backendUrl}/api/listings`;

      if (showOnlyMyListings && currentUser) {
        endpoint = `${backendUrl}/api/users/${currentUser.id}/listings`;
      } else if (selectedDistrict !== 'All') {
        endpoint = `${backendUrl}/api/listings/district/${selectedDistrict}`;
      } else if (selectedType !== 'All') {
        endpoint = `${backendUrl}/api/listings/type/${selectedType}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Network response was not ok');
      const data: Listing[] = await res.json();
      setListings(data);
      setStatusMessage('Data synced successfully with AWS backend.');
    } catch (err) {
      console.error('Fetch error:', err);
      setStatusMessage('Failed to pull updated listing scopes from AWS.');
    }
  };

  // Trigger fetches on dependency changes
  useEffect(() => {
    fetchUsers();
  }, [backendUrl]);

  useEffect(() => {
    fetchListings();
  }, [backendUrl, selectedDistrict, selectedType, showOnlyMyListings, currentUser]);


  // ----------------------------------------------------------------
  // 2. LISTING MUTATIONS (POST, PUT, DELETE)
  // ----------------------------------------------------------------

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contact) return alert("Please fill out Title and Contact!");
    if (!currentUser) return alert("Please create or select a User profile first!");

    if (editingListingId) {
      // AP2: Update Existing Listing (PUT)
      try {
        const payload = {
          title,
          type,
          contact,
          district,
          description,
          authorId: currentUser.id,
          latitude: 1.3521,
          longitude: 103.8198
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
        console.error(err);
        alert('Error updating listing.');
      }
    } else {
      // AP2: Create New Listing (POST)
      const payload: CreateListingRequest = {
        title,
        type,
        contact,
        district,
        description,
        authorId: currentUser.id,
        latitude: 1.3521,
        longitude: 103.8198,
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
          setListings((prev) => [...prev, data.listing]);
          clearListingForm();
          alert(`Success! Created listing with ID: ${data.id}`);
        }
      } catch (err) {
        console.error(err);
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
        body: JSON.stringify({ authorId }) // Pass authorId body as requested by backend route layout
      });

      if (!response.ok) throw new Error('Delete request rejected.');
      setListings(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete resource.');
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


  // ----------------------------------------------------------------
  // 3. USER MANAGEMENT MUTATIONS (POST, DELETE)
  // ----------------------------------------------------------------

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return alert("Fill in user credentials");

    try {
      const response = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, email: newUserEmail })
      });

      if (!response.ok) throw new Error('Error making profile.');
      const data = await response.json();
      if (data.success) {
        setUsers(prev => [...prev, data.user]);
        setCurrentUser(data.user);
        setNewUserName('');
        setNewUserEmail('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete profile entirely?")) return;
    try {
      const response = await fetch(`${backendUrl}/api/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Fail deletion process.');
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser?.id === userId) {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------------------
  // RENDER INTERFACE
  // ----------------------------------------------------------------

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh',
      backgroundColor: '#242424', color: 'white', fontFamily: 'sans-serif', padding: '2rem'
    }}>
      <h1 style={{ color: '#646cff', marginBottom: '0.5rem' }}>Cloud Infrastructure Panel</h1>
      <p style={{ marginBottom: '2rem', color: statusMessage.includes('Failed') ? '#ff6b6b' : '#4cd137' }}>
        {statusMessage}
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
        
        {/* LEFT COLUMN: IDENTITY AND FILTERS */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* USER MANAGEMENT SECTION */}
          <div style={{ backgroundColor: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
            <h3>Active Profile Workspace</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label>Acting User Persona: </label>
              <select 
                value={currentUser?.id || ''} 
                onChange={(e) => {
                  const target = users.find(u => u.id === e.target.value);
                  if (target) setCurrentUser(target);
                }}
                style={{ padding: '0.4rem', width: '100%', marginTop: '0.5rem', backgroundColor: '#333', color: 'white' }}
              >
                {users.length === 0 && <option>No Users available. Create one below.</option>}
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
              {currentUser && (
                <button 
                  onClick={() => handleDeleteUser(currentUser.id)}
                  style={{ marginTop: '0.5rem', background: '#ff6b6b', border: 'none', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Purge Selected User
                </button>
              )}
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>
              <h4>Register New User Profile</h4>
              <input type="text" placeholder="Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ padding: '0.4rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              <input type="email" placeholder="Email Address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} style={{ padding: '0.4rem', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              <button type="submit" style={{ background: '#4cd137', color: 'black', border: 'none', padding: '0.4rem', cursor: 'pointer', fontWeight: 'bold' }}>Register User</button>
            </form>
          </div>

          {/* FILTERING WORKFLOW BAR */}
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

        {/* RIGHT COLUMN: LISTING EDITOR FORM */}
        <div style={{ flex: '1.2', minWidth: '320px' }}>
          <form onSubmit={handleSubmitListing} style={{
            backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '8px', border: '1px solid #333',
            display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'
          }}>
            <h3>{editingListingId ? "✏️ Edit Listing Structure" : "✨ Create New Listing"}</h3>
            
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
              {editingListingId && (
                <button type="button" onClick={clearListingForm} style={{ backgroundColor: '#555', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* ACTIVE OUTPUT ENGINE */}
          <div>
            <h3>Current View Sync Engine ({listings.length} entries):</h3>
            {listings.length === 0 ? (
              <p style={{ color: '#aaa' }}>No listings return for this operational query parameters.</p>
            ) : (
              listings.map((item) => (
                <div key={item.id} style={{
                  backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '6px',
                  borderLeft: `4px solid ${item.authorId === currentUser?.id ? '#4cd137' : '#646cff'}`, marginBottom: '1rem'
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
    </div>
  );
}