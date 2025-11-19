"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '../components/RequireAuth';
import { clearToken } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/live-ops">Live Ops</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/restaurants">Restaurants</Link>
          <Link href="/drivers">Drivers</Link>
          <span style={{ flex: 1 }} />
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </main>
    </RequireAuth>
  );
}

