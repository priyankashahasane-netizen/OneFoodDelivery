"use client";

import { useState } from 'react';
import { setToken } from '../../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!data?.ok) {
        setError('Invalid credentials');
      } else {
        setToken(data.access_token);
        window.location.href = '/';
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div style={{ width: 320 }}>
        <h1>Admin Login</h1>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={login} disabled={loading} style={{ height: 36 }}>{loading ? 'Signing in…' : 'Sign In'}</button>
          {error ? <div style={{ color: 'red' }}>{error}</div> : null}
        </div>
      </div>
    </main>
  );
}



