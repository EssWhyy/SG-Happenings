import { useEffect, useState } from 'react';
import type { CreateListingRequest, CreateEditListingResponse, Listing } from '../../shared/apiContract';

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to AWS Lambda...');
  
  // Form input states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Sale');
  const [contact, setContact] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL;

  // 1. GET Request: Fetch existing listings on mount
  useEffect(() => {
    fetch(`${backendUrl}/api/listings`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: Listing[]) => {
        setListings(data);
        setStatusMessage('Connected to AWS successfully!');
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setStatusMessage('Failed to connect to AWS backend.');
      });
  }, [backendUrl]);

  // 2. POST Request: Handle creating a new listing
  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contact) return alert("Please fill out Title and Contact!");

    // Construct the payload matching your shared 'CreateListingRequest' contract
    const payload: CreateListingRequest = {
      title,
      type,
      contact,
      authorId: "usr_mock_123", // Using a fake User ID for now
      x_cood: 1.3521,            // Standard latitude mock
      y_cood: 103.8198,          // Standard longitude mock
      description: "Created from the frontend UI!" 
    };

    try {
      const response = await fetch(`${backendUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create listing');

      // Enforce your contract structure on the incoming response
      const data: CreateEditListingResponse = await response.json();

      if (data.success) {
        // Optimistically update your local UI state with the new listing
        setListings((prevListings) => [...prevListings, data.listing]);
        
        // Reset form inputs
        setTitle('');
        setContact('');
        alert(`Success! Created item with ID: ${data.id}`);
      }
    } catch (err) {
      console.error('Post error:', err);
      alert('Error saving listing to AWS backend.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#242424',
      color: 'white',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h1 style={{ color: '#646cff', marginBottom: '0.5rem' }}>Frontend + AWS Integration</h1>
      <p style={{ marginBottom: '2rem', color: statusMessage.includes('Failed') ? '#ff6b6b' : '#4cd137' }}>
        {statusMessage}
      </p>

      {/* --- POST REQUEST FORM --- */}
      <form onSubmit={handleSubmitListing} style={{
        backgroundColor: '#1a1a1a',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #333',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <h3>Create New Listing</h3>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          Title:
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          Type:
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}
          >
            <option value="Sale">Sale</option>
            <option value="Event">Event</option>
            <option value="Wanted">Wanted</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          Contact Info:
          <input 
            type="text" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}
          />
        </label>

        <button type="submit" style={{
          backgroundColor: '#646cff',
          color: 'white',
          border: 'none',
          padding: '0.7rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginTop: '0.5rem'
        }}>
          Submit to Backend
        </button>
      </form>

      {/* --- DISPLAYING ITEMS FETCHED FROM GET --- */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h3>Current Active Listings:</h3>
        {listings.length === 0 ? (
          <p style={{ color: '#aaa' }}>No active listings available.</p>
        ) : (
          listings.map((item) => (
            <div key={item.id} style={{
              backgroundColor: '#1a1a1a',
              padding: '1rem',
              borderRadius: '6px',
              borderLeft: '4px solid #646cff',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.title} ({item.type})</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#aaa' }}>Contact: {item.contact}</p>
              <small style={{ color: '#666' }}>ID: {item.id}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}