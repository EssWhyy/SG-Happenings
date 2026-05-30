import { useEffect, useState } from 'react';

export default function App() {
  const [message, setMessage] = useState<string>('Connecting to AWS Lambda...');

  useEffect(() => {
    // This reads from your frontend/.env.local file
    const backendUrl = import.meta.env.VITE_API_URL;

    fetch(`${backendUrl}/api/hello`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setMessage('Failed to connect to AWS backend.');
      });
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#242424',
      color: 'white',
      fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ color: '#646cff' }}>Frontend + AWS Integration</h1>
      <p style={{ fontSize: '1.2rem' }}>Status from Cloud Function:</p>
      <strong style={{ 
        fontSize: '1.5rem', 
        color: message.includes('Failed') ? '#ff6b6b' : '#4cd137',
        backgroundColor: '#1a1a1a',
        padding: '1rem 2rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        {message}
      </strong>
    </div>
  );
}