"use client";

import useSWR from 'swr';
import RequireAuth from '../../components/RequireAuth';
import { authedFetch } from '../../lib/auth';

const fetcher = (url: string) => authedFetch(url).then((r) => r.json());

export default function OrdersPage() {
  const { data, mutate, isLoading } = useSWR('/api/orders', fetcher);
  const { data: drivers } = useSWR('/api/drivers?page=1&pageSize=100', fetcher);

  async function assign(orderId: string, driverId?: string) {
    const selectedDriverId = driverId || prompt('Enter Driver ID to assign');
    if (!selectedDriverId) return;
    try {
      await authedFetch(`/api/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriverId })
      });
      mutate();
    } catch (error) {
      alert('Failed to assign order. Please try again.');
      console.error('Assign error:', error);
    }
  }

  const handleQuickAssign = (orderId: string, driverId: string) => {
    if (driverId) {
      assign(orderId, driverId);
    }
  };

  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
        <h1>Orders</h1>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Ref</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Payment</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Pickup</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Dropoff</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Driver</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((o: any) => (
              <tr key={o.id}>
                <td style={{ padding: 8 }}>
                  {o.externalRef || o.id.substring(0, 8)}
                </td>
                <td style={{ padding: 8 }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    background: o.status === 'delivered' ? '#d1fae5' : 
                                o.status === 'cancelled' ? '#fee2e2' :
                                o.status === 'assigned' ? '#dbeafe' :
                                o.status === 'picked_up' ? '#fef3c7' :
                                '#f3f4f6',
                    color: o.status === 'delivered' ? '#065f46' :
                           o.status === 'cancelled' ? '#991b1b' :
                           o.status === 'assigned' ? '#1e40af' :
                           o.status === 'picked_up' ? '#92400e' :
                           '#374151'
                  }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{o.paymentType || 'N/A'}</td>
                <td style={{ padding: 8, maxWidth: 200, fontSize: 12 }}>
                  {o.pickup?.address || `${o.pickup?.lat?.toFixed(4)}, ${o.pickup?.lng?.toFixed(4)}`}
                </td>
                <td style={{ padding: 8, maxWidth: 200, fontSize: 12 }}>
                  {o.dropoff?.address || `${o.dropoff?.lat?.toFixed(4)}, ${o.dropoff?.lng?.toFixed(4)}`}
                </td>
                <td style={{ padding: 8 }}>
                  {o.driver?.name || o.driverId ? (
                    <span style={{ fontSize: 12 }}>
                      {o.driver?.name || 'Driver ID: ' + o.driverId?.substring(0, 8)}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>Unassigned</span>
                  )}
                </td>
                <td style={{ padding: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleQuickAssign(o.id, e.target.value);
                        e.target.value = ''; // Reset selection
                      }
                    }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                  >
                    <option value="">Assign driver…</option>
                    {drivers?.items?.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.online ? '(online)' : ''}
                      </option>
                    ))}
                  </select>
                  {o.driverId && (
                    <button
                      onClick={() => assign(o.id)}
                      style={{ background: '#2563eb', color: '#fff', border: 0, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Reassign
                    </button>
                  )}
                  {o.trackingUrl && (
                    <a
                      href={o.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', fontSize: 12, textDecoration: 'none' }}
                    >
                      Track
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </main>
    </RequireAuth>
  );
}

