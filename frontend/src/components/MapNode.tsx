import React from 'react';

export interface MapNodeProps {
  listing: {
    title: string;
    expiryDate: string;
    [key: string]: any;
  };
  authorName: string;
  emoji?: string;
}

// 1. The visual marker icon (The Circle)
export const MapNodeIcon: React.FC<{ emoji?: string }> = ({ emoji = "📍" }) => {
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        backgroundColor: '#ffffff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        border: '2px solid #4f46e5',
        boxSizing: 'border-box',
      }}
    >
      {emoji}
    </div>
  );
};

// 2. The hover tooltip content
export const MapNodeTooltip: React.FC<MapNodeProps> = ({
  listing,
  authorName,
}) => {
  const formattedExpiry = new Date(listing.expiryDate).toLocaleDateString();

  return (
    <div style={{ padding: '4px', minWidth: '180px', fontFamily: 'sans-serif' }}>
      <div
        style={{
          height: '70px',
          background: '#eee',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '12px',
          marginBottom: '8px',
        }}
      >
        No Thumbnail
      </div>
      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
        {listing.title}
      </h4>
      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
        By {authorName}
      </p>
      <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>
        Expires: {formattedExpiry}
      </p>
    </div>
  );
};