"use client";

import { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

type LatLng = { lat: number; lng: number };

type MapPickerProps = {
  value?: LatLng;
  onSelect: (coords: LatLng) => void;
  height?: number;
};

const defaultCenter: LatLng = { lat: 12.9716, lng: 77.5946 }; // Bengaluru as sensible default

export function MapPicker({ value, onSelect, height = 320 }: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-picker',
    googleMapsApiKey: apiKey ?? '',
    libraries: ['places'],
  });

  const center = useMemo<LatLng>(() => {
    if (value && !Number.isNaN(value.lat) && !Number.isNaN(value.lng)) {
      return value;
    }
    return defaultCenter;
  }, [value]);

  if (!apiKey) {
    return (
      <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8 }}>
        Google Maps API key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map picking.
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8 }}>
        Failed to load Google Maps. Please check your API key and network.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: 12, background: '#f3f4f6', color: '#4b5563', borderRadius: 8 }}>
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height,
        borderRadius: 8,
        overflow: 'hidden',
      }}
      center={center}
      zoom={value ? 15 : 12}
      onClick={(e) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat !== undefined && lng !== undefined) {
          onSelect({ lat, lng });
        }
      }}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {value && <Marker position={value} />}
    </GoogleMap>
  );
}

export default MapPicker;
