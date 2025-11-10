"use client";

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adm_token');
}

export function setToken(token: string) {
  localStorage.setItem('adm_token', token);
}

export function clearToken() {
  localStorage.removeItem('adm_token');
}

export async function authedFetch(input: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${base}${input}`, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    // Clone the response to read the body without consuming it
    const clonedRes = res.clone();
    const errorText = await clonedRes.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || `HTTP ${res.status}` };
    }
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res;
}



