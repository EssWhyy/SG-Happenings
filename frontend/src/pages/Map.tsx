import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import TrainIcon from '@mui/icons-material/Train';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalParkIcon from '@mui/icons-material/Park';

import Header from '../components/Header';
import MapControls from '../components/MapControls';
import type { OverlayConfig }  from '../components/MapControls';
import { MrtOverlay } from '../components/overlays/MrtOverlay';
import { MapNodeIcon, MapNodeTooltip } from '../components/MapNode';
import type { Listing } from '../../../shared/apiContract';

interface OneMapSingaporeProps {
  onNodeAdded: (lat: number, lng: number) => void;
}

const SG_CENTER = { lat: 1.3521, lng: 103.8198 };
const SG_BOUNDS = {
  north: 1.4700,
  south: 1.1500,
  east: 104.0200,
  west: 103.6200,
};

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
  backgroundColor: '#73b2e6',
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const OneMapSingapore: React.FC<OneMapSingaporeProps> = ({ onNodeAdded }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [addEventMode, setAddEventMode] = useState<boolean>(false);
  const [localListings, setLocalListings] = useState<Listing[]>([]);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  // Track state for each active overlay
  const [activeOverlays, setActiveOverlays] = useState<Record<string, boolean>>({
    mrt: true,
    parks: false,
    food: false,
  });

  const toggleAddEventMode = () => {
    setAddEventMode((prev) => !prev);
  };

  const handleToggleOverlay = (id: string) => {
    setActiveOverlays((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!addEventMode || !e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      const newListing: Listing = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'Event',
        title: 'New Map Event Location',
        description: 'A newly created placeholder event.',
        authorId: 'user_123',
        latitude: lat,
        longitude: lng,
        district: 'Unknown District',
        createdAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      setLocalListings((prev) => [...prev, newListing]);
      onNodeAdded(lat, lng);
      setAddEventMode(false);
    },
    [addEventMode, onNodeAdded]
  );

  // Configuration passed to MapControls
  const overlayConfigs: OverlayConfig[] = [
    {
      id: 'mrt',
      name: 'MRT Lines',
      icon: <TrainIcon />,
      active: activeOverlays.mrt,
    },
    {
      id: 'parks',
      name: 'Parks & Nature',
      icon: <LocalParkIcon />,
      active: activeOverlays.parks,
    },
    {
      id: 'food',
      name: 'Food & Dining',
      icon: <RestaurantIcon />,
      active: activeOverlays.food,
    },
  ];

  if (loadError) return <div>Error loading Google Maps API</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Header />

      {addEventMode && (
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            pointerEvents: 'none',
          }}
        >
          Click anywhere on the map to add an event
        </div>
      )}

      <div style={{ width: '100%', height: 'calc(100vh - 50px)', position: 'relative' }}>
        <MapControls
          addEventMode={addEventMode}
          onToggleAddEventMode={toggleAddEventMode}
          overlays={overlayConfigs}
          onToggleOverlay={handleToggleOverlay}
        />

        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={SG_CENTER}
          zoom={13}
          onClick={handleMapClick}
          options={{
            restriction: {
              latLngBounds: SG_BOUNDS,
              strictBounds: true,
            },
            minZoom: 12.8,
            maxZoom: 18,
            draggableCursor: addEventMode ? 'crosshair' : undefined,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: true,
          }}
        >
          {/* Render overlay conditionally based on active state */}
          {activeOverlays.mrt && <MrtOverlay />}

          {/* Render Markers & Custom Tooltips */}
          {localListings.map((listing) => (
            <React.Fragment key={listing.id}>
              <OverlayView
                position={{ lat: listing.latitude, lng: listing.longitude }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({
                  x: -(width / 2),
                  y: -(height / 2),
                })}
              >
                <div
                  style={{ cursor: 'pointer', fontSize: '24px' }}
                  onMouseEnter={() => setHoveredListingId(listing.id)}
                  onMouseLeave={() => setHoveredListingId(null)}
                >
                  <MapNodeIcon emoji="📍" />
                </div>
              </OverlayView>

              {hoveredListingId === listing.id && (
                <OverlayView
                  position={{ lat: listing.latitude, lng: listing.longitude }}
                  mapPaneName={OverlayView.FLOAT_PANE}
                  getPixelPositionOffset={(width, height) => ({
                    x: -(width / 2),
                    y: -height - 20,
                  })}
                >
                  <MapNodeTooltip listing={listing} authorName="Local User" />
                </OverlayView>
              )}
            </React.Fragment>
          ))}
        </GoogleMap>
      </div>
    </div>
  );
};

export default OneMapSingapore;