import React, { useCallback } from 'react';
import { Data } from '@react-google-maps/api';

const SPORTS_FACILITIES_GEOJSON_URL = '/data/sports-facilities.geojson';

export const SportsFacilitiesOverlay: React.FC = () => {
  const onDataLoad = useCallback((data: google.maps.Data) => {
    // 1. Fetch GeoJSON from local URL/endpoint
    data.loadGeoJson(SPORTS_FACILITIES_GEOJSON_URL);

    // 2. Custom icon for sports facilities
    data.setStyle(() => ({
      icon: {
        url: 'https://cdn-icons-png.flaticon.com/512/857/857418.png',
        scaledSize: new google.maps.Size(28, 28),
      },
    }));

    // 3. InfoWindow event handling
    const infoWindow = new google.maps.InfoWindow();

    data.addListener('click', (event: google.maps.Data.MouseEvent) => {
      const venue = event.feature.getProperty('VENUE') || 'Sports Facility';
      const block = event.feature.getProperty('ADDRESSBLOCKHOUSENUMBER') || '';
      const street = event.feature.getProperty('ADDRESSSTREETNAME') || '';
      const postal = event.feature.getProperty('POSTAL_CODE') ? `Singapore ${event.feature.getProperty('POSTAL_CODE')}` : '';
      const detailsUrl = event.feature.getProperty('DETAILS');

      const fullAddress = [block, street, postal].filter(Boolean).join(' ');

      const content = `
        <div style="font-family: sans-serif; max-width: 220px; color: #333;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #1a73e8;">${venue}</h3>
          ${fullAddress ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${fullAddress}</p>` : ''}
          ${
            detailsUrl
              ? `<div style="margin-top: 8px;">
                  <a href="${detailsUrl}" target="_blank" rel="noopener noreferrer" style="padding: 4px 8px; background-color: #1a73e8; color: #fff; text-decoration: none; border-radius: 4px; font-size: 11px;">Book / Info</a>
                </div>`
              : ''
          }
        </div>
      `;

      infoWindow.setContent(content);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(data.getMap());
    });
  }, []);

  return <Data onLoad={onDataLoad} />;
};

export default SportsFacilitiesOverlay;