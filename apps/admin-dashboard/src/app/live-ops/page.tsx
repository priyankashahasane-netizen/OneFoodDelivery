"use client";

import { useEffect, useRef, useState } from 'react';
import RequireAuth from '../../components/RequireAuth';
import Header from '../../components/Header';
import { authedFetch, isAdmin } from '../../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const TILES = process.env.NEXT_PUBLIC_OSM_TILES ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Force dynamic rendering to prevent SSR issues with Leaflet
export const dynamic = 'force-dynamic';

export default function LiveOps() {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [isClient, setIsClient] = useState(false);
  const [adminStatus, setAdminStatus] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setAdminStatus(isAdmin());
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    let cancelled = false;
    let pollIntervalId: NodeJS.Timeout | null = null;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      if (!mapRef.current) {
        const map = L.default.map('map', { zoomControl: true }).setView([0, 0], 2);
        L.default.tileLayer(TILES, { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
        mapRef.current = map;
      }

      async function poll() {
        try {
          const res = await authedFetch('/api/drivers?page=1&pageSize=200');
          const data = await res.json();
          if (cancelled || !mapRef.current) return;
          const map = mapRef.current; // Store reference to avoid null check issues
          data.items?.forEach((d: any) => {
            if (typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return;
            const key = d.id;
            const icon = L.default.divIcon({
              html: `<div style="width:12px;height:12px;border-radius:12px;background:${d.online ? '#16a34a' : '#9ca3af'};border:2px solid white;"></div>`,
              className: ''
            });
            if (!markersRef.current[key]) {
              markersRef.current[key] = L.default.marker([d.latitude, d.longitude], { icon }).addTo(map);
            } else {
              markersRef.current[key].setLatLng([d.latitude, d.longitude]);
              markersRef.current[key].setIcon(icon);
            }
          });
        } catch {}
      }
      pollIntervalId = setInterval(poll, 5000);
      poll();
    });

    return () => {
      cancelled = true;
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient]);

  return (
    <RequireAuth>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <main style={{ flex: 1, width: '100vw', overflow: 'hidden' }}>
          {adminStatus ? (
            <div id="map" style={{ height: '100%', width: '100%' }} />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#6b7280',
              fontSize: 16
            }}>
              Access restricted. Admin privileges required.
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

