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
import { useState, useEffect } from 'react';

function ClientSidebarShell({ orderId, geo, order }: { orderId: string; geo: any; order: any }) {
  // Get driverId from order object if available, otherwise from tracking position
  const [driverIdFromTracking, setDriverIdFromTracking] = useState<string | undefined>(undefined);
  const driverId = order?.driverId || order?.driver?.id || driverIdFromTracking;
  
  useEffect(() => {
    // If order has driverId, use it immediately
    if (order?.driverId || order?.driver?.id) {
      setDriverIdFromTracking(order.driverId || order.driver?.id);
    }
  }, [order]);

  return (
    <main style={{ height: '100vh', width: '100vw', display: 'grid', gridTemplateColumns: '1fr 360px' }}>
      <TrackingMap orderId={orderId} onPosition={(p) => { if (p.driverId) setDriverIdFromTracking(p.driverId); }} />
      <aside style={{ padding: 16, borderLeft: '1px solid #eee', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Order {order?.externalRef ? `#${order.externalRef}` : `#${orderId.substring(0, 8)}`}
        </h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          {geo ? `${geo.city ?? ''} ${geo.country_code ?? ''} • ${geo.tz ?? ''}` : 'Personalizing…'}
        </p>
        {order?.driver?.name && (
          <p style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
            Driver: <strong>{order.driver.name}</strong>
          </p>
        )}
        <StatusTimeline status={order?.status ?? 'unknown'} />
        <div style={{ height: 12 }} />
        <EtaPanel driverId={driverId} tz={geo?.tz} countryCode={geo?.country_code} />
        {order?.pickup?.address && (
          <>
            <div style={{ height: 12 }} />
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Pickup</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{order.pickup.address}</p>
            </div>
          </>
        )}
        {order?.dropoff?.address && (
          <>
            <div style={{ height: 12 }} />
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Delivery</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{order.dropoff.address}</p>
            </div>
          </>
        )}
        <div style={{ height: 12 }} />
        <SupportCTA />
      </aside>
    </main>
  );
}

