import React, { useState } from 'react'; 
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import Header from '../components/Header';
import MapControls from '../components/MapControls';
import { MapNodeIcon, MapNodeTooltip } from '../components/MapNode'; 
import type { Listing } from '../../../shared/apiContract'; 
import { renderToStaticMarkup } from 'react-dom/server';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const SG_CENTER: [number, number] = [1.3521, 103.8198];

const SG_BOUNDS = L.latLngBounds(
  [1.1500, 103.6200],
  [1.4700, 104.0200]
);

export const OneMapSingapore: React.FC = () => {
  const theme = 'Default';
  
  const [addEventMode, setAddEventMode] = useState<boolean>(false); 
  const [localListings, setLocalListings] = useState<Listing[]>([]);

  const toggleAddEventMode = () => {
    setAddEventMode((prev) => !prev);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (!addEventMode) return;

        const newListing: Listing = {
          id: Math.random().toString(36).substring(2, 9), 
          type: 'Event',
          title: 'New Map Event Location',
          description: 'A newly created placeholder event.',
          authorId: 'user_123',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          district: 'Unknown District',
          createdAt: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
        };

        setLocalListings((prev) => [...prev, newListing]);
        setAddEventMode(false); 
      },
    });
    return null;
  };

  // Renders ONLY the circular icon markup safely
  const createCustomIcon = (emoji: string = "📍") => {
    const htmlString = renderToStaticMarkup(
      <MapNodeIcon emoji={emoji} />
    );

    return L.divIcon({
      html: htmlString,
      className: "custom-map-node-wrapper",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };
  
  const attributionString = `
    <img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;vertical-align:middle;"/> 
    <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>
  `;

  return (
    <>
      <style>{`
        .custom-map-node-wrapper {
            background: transparent !important;
            border: none !important;
            overflow: visible !important;
        }
      `}</style>

      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden' 
      }}>
        <Header />

        {addEventMode && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            pointerEvents: 'none'
          }}>
            Click anywhere on the map to add an event
          </div>
        )}

        <div style={{ 
          width: '100%', 
          height: 'calc(100vh - 50px)', 
          position: 'relative'
        }}>
          
          <MapControls 
            addEventMode={addEventMode} 
            onToggleAddEventMode={toggleAddEventMode} 
          />

          <MapContainer
            center={SG_CENTER}
            zoom={13}            
            minZoom={12.8}  
            maxZoom={19}
            zoomSnap={0.1} 
            zoomDelta={0.25}      
            scrollWheelZoom={true}
            maxBounds={SG_BOUNDS} 
            maxBoundsViscosity={1.0} 
            style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#73b2e6',
              cursor: addEventMode ? 'crosshair' : 'grab' 
            }} 
          >
            <TileLayer
              url={`https://www.onemap.gov.sg/maps/tiles/${theme}/{z}/{x}/{y}.png`}
              detectRetina={true}
              attribution={attributionString}
              noWrap={true} 
              bounds={SG_BOUNDS} 
            />
            
            <MapClickHandler />

            {localListings.map((listing) => (
              <Marker 
                key={listing.id} 
                position={[listing.latitude, listing.longitude]} 
                icon={createCustomIcon('📍')}
              >
                {/* Standard React-Leaflet Tooltip handles hover events flawlessly */}
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <MapNodeTooltip listing={listing} authorName="Local User" />
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default OneMapSingapore;