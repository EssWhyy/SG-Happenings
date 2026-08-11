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
  listings: Listing[];
  pendingCoords: { lat: number; lng: number } | null;
  onNodeAdded: (lat: number, lng: number) => void;
  onNodeClick: (listingId: string) => void;
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

export const OneMapSingapore: React.FC<OneMapSingaporeProps> = ({ listings, pendingCoords, onNodeAdded, onNodeClick }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [addEventMode, setAddEventMode] = useState<boolean>(false);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  const [activeOverlays, setActiveOverlays] = useState<Record<string, boolean>>({
    mrt: true,
    parks: false,
    food: false,
  });

  const toggleAddEventMode = () => {
    console.log('[Map] Toggling add event mode:', !addEventMode);
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

      console.log('[Map] Map clicked at coords:', { lat, lng });
      onNodeAdded(lat, lng);
      setAddEventMode(false);
    },
    [addEventMode, onNodeAdded]
  );

  const overlayConfigs: OverlayConfig[] = [
    { id: 'mrt', name: 'MRT Lines', icon: <TrainIcon />, active: activeOverlays.mrt },
    { id: 'parks', name: 'Parks & Nature', icon: <LocalParkIcon />, active: activeOverlays.parks },
    { id: 'food', name: 'Food & Dining', icon: <RestaurantIcon />, active: activeOverlays.food },
  ];

  if (loadError) return <div>Error loading Google Maps API</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  console.log('[Map] Rendering map with total persisted listings:', listings.length);
  console.log('[Map Debug] Current state:', {
    listingsCount: listings.length,
    pendingCoords: pendingCoords
  });
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
            restriction: { latLngBounds: SG_BOUNDS, strictBounds: true },
            minZoom: 12.8,
            maxZoom: 18,
            draggableCursor: addEventMode ? 'crosshair' : undefined,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: true,
          }}
        >
          {activeOverlays.mrt && <MrtOverlay />}

          {/* Render Saved Permanent Listings from DynamoDB */}
          {listings.map((listing) => (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(listing.id); // <--- Trigger backend fetch callback
                  }}
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

          {/* Render Uncommitted Pending Draft Node */}
          {pendingCoords && pendingCoords.lat && pendingCoords.lng && (
            <OverlayView
              position={{ lat: pendingCoords.lat, lng: pendingCoords.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -(height / 2),
              })}
            >
              <div style={{ cursor: 'pointer', opacity: 0.8 }}>
                <MapNodeIcon emoji="📍" />
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default OneMapSingapore;