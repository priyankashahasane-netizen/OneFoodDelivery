"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';

type Position = { lat: number; lng: number; speed?: number | null; heading?: number | null; ts?: string };

export default function TrackingMap({ orderId, onPosition }: { orderId: string; onPosition?: (p: { driverId?: string; lat: number; lng: number; ts?: string }) => void }) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [pos, setPos] = useState<Position | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000', []);
  const tiles = useMemo(() => process.env.NEXT_PUBLIC_OSM_TILES ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', []);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', { zoomControl: true }).setView([0, 0], 3);
      L.tileLayer(tiles, { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      mapRef.current = map;
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tiles]);

  useEffect(() => {
    const es = new EventSource(`${apiBase}/api/track/${orderId}/sse`);
    const onPos = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setPos({ lat: data.lat, lng: data.lng, speed: data.speed, heading: data.heading, ts: data.ts });
        onPosition?.({ driverId: data.driverId, lat: data.lat, lng: data.lng, ts: data.ts });
      } catch {}
    };
    es.addEventListener('position', onPos);
    return () => {
      es.removeEventListener('position', onPos as any);
      es.close();
    };
  }, [apiBase, orderId]);

  useEffect(() => {
    if (!pos || !mapRef.current) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([pos.lat, pos.lng]).addTo(mapRef.current);
      mapRef.current.setView([pos.lat, pos.lng], 15);
    } else {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
    }
  }, [pos]);

  return <div id="map" style={{ height: '100%', width: '100%' }} />;
}

