import React, { useState } from 'react'; // <-- 1. Import useState
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useViewport } from '../App';
import Header from '../components/Header';
import MapControls from '../components/MapControls';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const SG_CENTER: [number, number] = [1.3521, 103.8198];
const MBS_LOCATION: [number, number] = [1.2834, 103.8607];

const SG_BOUNDS = L.latLngBounds(
  [1.1500, 103.6200],
  [1.4700, 104.0200]
);

export const OneMapSingapore: React.FC = () => {
  const { isMobile } = useViewport();
  const theme = 'Default';
  
  // 2. Define the mode state here
  const [addEventMode, setAddEventMode] = useState<boolean>(false); 

  const toggleAddEventMode = () => {
    setAddEventMode((prev) => !prev);
  };

  const attributionString = `
    <img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;vertical-align:middle;"/> 
    <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>
  `;

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          height: 100% !important;
          width: 100% !important;
          overflow: hidden !important;
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

        {/* Optional: Visual Banner informing the user that Add mode is active */}
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
          
          {/* 3. Pass state and toggle function down as props */}
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
              // Dynamic cursor change to show users they are placing pins
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
            
            <Marker position={MBS_LOCATION}>
              <Popup>
                <strong>Marina Bay Sands</strong>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default OneMapSingapore;