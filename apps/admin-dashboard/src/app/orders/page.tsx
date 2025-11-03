"use client";

import useSWR from 'swr';
import RequireAuth from '../../components/RequireAuth';
import { authedFetch } from '../../lib/auth';

const fetcher = (url: string) => authedFetch(url).then((r) => r.json());

export default function OrdersPage() {
  const { data, mutate, isLoading } = useSWR('/api/orders', fetcher);
  const { data: drivers } = useSWR('/api/drivers?page=1&pageSize=100', fetcher);

  async function assign(orderId: string) {
    const driverId = prompt('Enter Driver ID to assign');
    if (!driverId) return;
    await authedFetch('/api/deliveries/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, driverId })
    });
    mutate();
  }

  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
        <h1>Orders</h1>
        <div style={{ margin: '8px 0' }}>
          <label>Quick assign: </label>
          <select id="assign-driver">
            <option value="">Pick driver…</option>
            {drivers?.items?.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} {d.online ? '(online)' : ''}</option>
            ))}
          </select>
        </div>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Payment</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((o: any) => (
              <tr key={o.id}>
                <td style={{ padding: 8 }}>{o.id}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
                <td style={{ padding: 8 }}>{o.paymentType}</td>
                <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => assign(o.id)}
                    style={{ background: '#111827', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => assign(o.id)}
                    style={{ background: '#2563eb', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Reassign
                  </button>
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

