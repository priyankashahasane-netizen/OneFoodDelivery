import TrackingMap from '../../../components/TrackingMap';
import StatusTimeline from '../../../components/StatusTimeline';
import SupportCTA from '../../../components/SupportCTA';
import EtaPanel from '../../../components/EtaPanel';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

async function getGeo() {
  try {
    const res = await fetch(`${API_BASE}/api/geo/ip`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getOrder(orderId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function TrackPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const [geo, order] = await Promise.all([getGeo(), getOrder(orderId)]);

  return (
    <ClientSidebarShell orderId={orderId} geo={geo} order={order} />
  );
}

"use client";
import { useState } from 'react';

function ClientSidebarShell({ orderId, geo, order }: { orderId: string; geo: any; order: any }) {
  const [driverId, setDriverId] = useState<string | undefined>(undefined);
  return (
    <main style={{ height: '100vh', width: '100vw', display: 'grid', gridTemplateColumns: '1fr 360px' }}>
      <TrackingMap orderId={orderId} onPosition={(p) => { if (p.driverId) setDriverId(p.driverId); }} />
      <aside style={{ padding: 16, borderLeft: '1px solid #eee', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Order #{orderId}</h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          {geo ? `${geo.city ?? ''} ${geo.country_code ?? ''} • ${geo.tz ?? ''}` : 'Personalizing…'}
        </p>
        <StatusTimeline status={order?.status ?? 'unknown'} />
        <div style={{ height: 12 }} />
        <EtaPanel driverId={driverId} tz={geo?.tz} countryCode={geo?.country_code} />
        <div style={{ height: 12 }} />
        <SupportCTA />
      </aside>
    </main>
  );
}

