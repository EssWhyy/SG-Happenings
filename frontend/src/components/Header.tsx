import React from 'react';

interface HeaderProps {
  userAvatarUrl?: string | null;
  onBookmarkClick?: () => void;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  userAvatarUrl, 
  onBookmarkClick, 
  onProfileClick 
}) => {
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
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Left Action: Bookmark */}
      <button 
        onClick={onBookmarkClick}
        style={iconButtonStyle}
        aria-label="Bookmarks"
      >
        🔖
      </button>

      {/* Center Title */}
      <h1 style={{
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#333',
        textAlign: 'center',
        flex: 1
      }}>
        SG Happenings: Free Events, Hangs and Second-Hand in Singapore
      </h1>

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