"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import RequireAuth from '../../components/RequireAuth';
import { authedFetch } from '../../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const TILES = process.env.NEXT_PUBLIC_OSM_TILES ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function LiveOps() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', { zoomControl: true }).setView([0, 0], 2);
      L.tileLayer(TILES, { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      mapRef.current = map;
    }

    let cancelled = false;
    async function poll() {
      try {
        const res = await authedFetch('/api/drivers?page=1&pageSize=200');
        const data = await res.json();
        if (cancelled || !mapRef.current) return;
        data.items?.forEach((d: any) => {
          if (typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return;
          const key = d.id;
          const icon = L.divIcon({
            html: `<div style="width:12px;height:12px;border-radius:12px;background:${d.online ? '#16a34a' : '#9ca3af'};border:2px solid white;"></div>`,
            className: ''
          });
          if (!markersRef.current[key]) {
            markersRef.current[key] = L.marker([d.latitude, d.longitude], { icon }).addTo(mapRef.current);
          } else {
            markersRef.current[key].setLatLng([d.latitude, d.longitude]);
            markersRef.current[key].setIcon(icon);
          }
        });
      } catch {}
    }
    const id = setInterval(poll, 5000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(id);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <RequireAuth>
      <main style={{ height: '100vh', width: '100vw' }}>
        <div id="map" style={{ height: '100%', width: '100%' }} />
      </main>
    </RequireAuth>
  );
}

