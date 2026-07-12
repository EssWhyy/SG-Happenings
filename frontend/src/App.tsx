import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Perfectly centered on SG CBD
const SG_CENTER: [number, number] = [1.3521, 103.8198];
const MBS_LOCATION: [number, number] = [1.2834, 103.8607];

const SG_BOUNDS = L.latLngBounds(
  [1.1500, 103.6200], // Southwest corner
  [1.4700, 104.0200]  // Northeast corner
);

export const OneMapSingapore: React.FC = () => {
  const theme = 'Default';

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
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden' 
      }}>
        <MapContainer
          center={SG_CENTER}
          zoom={13}            
          minZoom={12.8}  
          maxZoom={19}
          zoomSnap={0.1} // Allows ultra-fine fractional zooming for a perfect fit
          zoomDelta={0.25}      
          scrollWheelZoom={true}
          maxBounds={SG_BOUNDS} 
          maxBoundsViscosity={1.0} 
          style={{ width: '100%', height: '100%', backgroundColor: '#73b2e6' }} 
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
    </>
  );
};

export default OneMapSingapore;