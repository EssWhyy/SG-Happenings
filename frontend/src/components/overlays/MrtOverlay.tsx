import React, { useCallback } from 'react';
import { Data } from '@react-google-maps/api';

const MRT_GEOJSON_URL = '/data/mrtlines.geojson';

export const MrtOverlay: React.FC = () => {
  const onDataLoad = useCallback((data: google.maps.Data) => {
    data.loadGeoJson(MRT_GEOJSON_URL);
    data.setStyle((feature: google.maps.Data.Feature): google.maps.Data.StyleOptions => {
      const rawColor = feature.getProperty('color');
      const strokeColor = typeof rawColor === 'string' ? rawColor : '#ff3366';

      return {
        strokeColor,
        strokeWeight: 4,
        strokeOpacity: 0.85,
      };
    });
  }, []);

  return <Data onLoad={onDataLoad} />;
};