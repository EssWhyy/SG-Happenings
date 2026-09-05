import React, { useCallback } from 'react';
import { Data } from '@react-google-maps/api';

const DISTRICT_GEOJSON_URL = '/data/district.geojson';

export const DistrictOverlay: React.FC = () => {
  const onDataLoad = useCallback((data: google.maps.Data) => {
    data.loadGeoJson(DISTRICT_GEOJSON_URL);

    data.setStyle((feature: google.maps.Data.Feature): google.maps.Data.StyleOptions => {
      // Extract properties with fallbacks to match your GeoJSON structure
      const rawStrokeWidth = feature.getProperty('stroke-width');
      const rawStrokeOpacity = feature.getProperty('stroke-opacity');

      const strokeColor = '#30169664';
      const strokeWeight = typeof rawStrokeWidth === 'number' ? rawStrokeWidth : 3;
      const strokeOpacity = typeof rawStrokeOpacity === 'number' ? rawStrokeOpacity : 1;

      return {
        strokeColor,
        strokeWeight,
        strokeOpacity,
      };
    });
  }, []);

  return <Data onLoad={onDataLoad} />;
};

export default DistrictOverlay