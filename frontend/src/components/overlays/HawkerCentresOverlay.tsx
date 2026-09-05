import React, { useCallback } from 'react';
import { Data } from '@react-google-maps/api';

const HAWKER_CENTRES_GEOJSON_URL = '/data/hawker-centres.geojson';

export const HawkerCentresOverlay: React.FC = () => {
  const onDataLoad = useCallback((data: google.maps.Data) => {
    // 1. Fetch GeoJSON from local URL/endpoint
    data.loadGeoJson(HAWKER_CENTRES_GEOJSON_URL);

    // 2. Configure Marker styling
    data.setStyle(() => ({
      icon: {
        url: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
        scaledSize: new google.maps.Size(28, 28),
      },
    }));

    // 3. Attach Click Event Listener for Popups / InfoWindows
    const infoWindow = new google.maps.InfoWindow();

    data.addListener('click', (event: google.maps.Data.MouseEvent) => {
      const name = event.feature.getProperty('NAME') || 'Hawker Centre';
      const address = event.feature.getProperty('ADDRESS_MYENV') || 'N/A';
      const stalls = event.feature.getProperty('NUMBER_OF_COOKED_FOOD_STALLS') || 'N/A';
      const photoUrl = event.feature.getProperty('PHOTOURL');

      const content = `
        <div style="font-family: sans-serif; max-width: 220px; color: #333;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold;">${name}</h3>
          ${
            photoUrl
              ? `<img src="${photoUrl}" alt="${name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;" />`
              : ''
          }
          <p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${address}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Cooked Food Stalls:</strong> ${stalls}</p>
        </div>
      `;

      infoWindow.setContent(content);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(data.getMap());
    });
  }, []);

  return <Data onLoad={onDataLoad} />;
};

export default HawkerCentresOverlay;