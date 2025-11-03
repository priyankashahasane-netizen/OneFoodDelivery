import Link from 'next/link';
import RequireAuth from '../components/RequireAuth';
import { clearToken } from '../lib/auth';

export default function Home() {
  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/live-ops">Live Ops</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/drivers">Drivers</Link>
          <span style={{ flex: 1 }} />
          <button onClick={() => { clearToken(); location.href = '/login'; }}>Logout</button>
        </nav>
      </main>
    </RequireAuth>
  );
}

