// frontend/src/components/Header.tsx
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  userAvatarUrl?: string | null;
  onBookmarkClick?: () => void;
  onProfileClick?: () => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  userAvatarUrl, 
  onBookmarkClick, 
  onProfileClick,
  onSearch 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search input to avoid hitting endpoint on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <header style={{
      width: '100%',
      height: '50px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      gap: '12px'
    }}>
      {/* Left Action: Bookmark */}
      <button 
        onClick={onBookmarkClick}
        style={iconButtonStyle}
        aria-label="Bookmarks"
      >
        🔖
      </button>

      {/* Center Title & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <h1 style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: 600,
          color: '#333',
          whiteSpace: 'nowrap'
        }}>
          SG Happenings
        </h1>

        <input
          type="text"
          placeholder="Search listings by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: '16px',
            border: '1px solid #ccc',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Right Action: Profile / Login */}
      <button 
        onClick={onProfileClick}
        style={iconButtonStyle}
        aria-label="User Profile"
      >
        {userAvatarUrl ? (
          <img 
            src={userAvatarUrl} 
            alt="User Profile" 
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover'
            }} 
          />
        ) : (
          '👤'
        )}
      </button>
    </header>
  );
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.4rem',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default Header;