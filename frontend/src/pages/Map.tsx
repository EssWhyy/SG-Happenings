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

// Perfectly centered on the main island of Singapore
const SG_CENTER: [number, number] = [1.3521, 103.8198];
const MBS_LOCATION: [number, number] = [1.2834, 103.8607];

// --- UPDATED: Tightened bounds to crop out Pedra Branca and extra ocean ---
const SG_BOUNDS = L.latLngBounds(
  [1.1500, 103.5500], // Southwest corner (Tuas / Southern Islands)
  [1.4800, 104.1000]  // Northeast corner (Tekong / Changi - cutting off Pedra Branca)
);

export const OneMapSingapore: React.FC = () => {
  const theme = 'Default';

  const attributionString = `
    <img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;vertical-align:middle;"/> 
    <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a> © contributors | 
    <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>
  `;

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <MapContainer
        center={SG_CENTER}
        zoom={12} 
        minZoom={12} // --- CHANGED: Prevents zooming out to see tile borders/gray voids ---
        maxZoom={19}
        scrollWheelZoom={true}
        maxBounds={SG_BOUNDS} 
        maxBoundsViscosity={1.0} 
        style={{ width: '100%', height: '100%', backgroundColor: '#a0c8f0' }} // --- OPTIONAL: Matches Leaflet's void color to OneMap's ocean blue
      >
        <TileLayer
          url={`https://www.onemap.gov.sg/maps/tiles/${theme}/{z}/{x}/{y}.png`}
          detectRetina={true}
          attribution={attributionString}
          noWrap={true} 
        />
        
        <Marker position={MBS_LOCATION}>
          <Popup>
            <strong>Marina Bay Sands</strong>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default OneMapSingapore;