"use client";

import { useEffect, useMemo, useState } from 'react';

type RoutePlan = { etaPerStop?: string[] | null; totalDistanceKm?: number };

export default function EtaPanel({ driverId, tz, countryCode }: { driverId?: string; tz?: string; countryCode?: string }) {
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000', []);
  const isMiles = useMemo(() => ['US', 'GB'].includes(countryCode ?? ''), [countryCode]);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;
    async function fetchPlan() {
      try {
        const res = await fetch(`${apiBase}/api/routes/driver/${driverId}/latest`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPlan(data);
      } catch {}
    }
    fetchPlan();
    const id = setInterval(fetchPlan, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [apiBase, driverId]);

  if (!driverId) return null;

  const eta = plan?.etaPerStop?.[0];
  let etaDisplay = '—';
  if (eta) {
    try {
      const date = new Date(eta);
      etaDisplay = tz ? date.toLocaleTimeString(undefined, { timeZone: tz, hour: '2-digit', minute: '2-digit' }) : date.toLocaleTimeString();
    } catch {}
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>ETA</h3>
      <div style={{ padding: 8, background: '#f3f4f6', borderRadius: 8 }}>Next stop: {etaDisplay}</div>
      <div style={{ marginTop: 6, color: '#6b7280' }}>
        Distance: {(() => {
          const km = plan?.totalDistanceKm ?? 0;
          if (isMiles) {
            const mi = km * 0.621371;
            return `${mi.toFixed(1)} mi`;
          }
          return `${km.toFixed(1)} km`;
        })()}
      </div>
    </div>
  );
}


