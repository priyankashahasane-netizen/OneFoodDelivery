"use client";

import useSWR from 'swr';
import RequireAuth from '../../components/RequireAuth';
import { authedFetch } from '../../lib/auth';

const fetcher = (url: string) => authedFetch(url).then((r) => r.json());

export default function DriversPage() {
  const { data, mutate, isLoading } = useSWR('/api/drivers', fetcher);

  async function toggleOnline(id: string, online: boolean) {
    await authedFetch(`/api/drivers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ online: !online })
    });
    mutate();
  }

  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
      <h1>Drivers</h1>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Phone</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Vehicle</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Online</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((d: any) => (
              <tr key={d.id}>
                <td style={{ padding: 8 }}>{d.name}</td>
                <td style={{ padding: 8 }}>{d.phone}</td>
                <td style={{ padding: 8 }}>{d.vehicleType}</td>
                <td style={{ padding: 8 }}>{d.online ? 'Yes' : 'No'}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => toggleOnline(d.id, d.online)}
                    style={{
                      background: d.online ? '#ef4444' : '#16a34a',
                      color: '#fff',
                      border: 0,
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    {d.online ? 'Go Offline' : 'Go Online'}
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


