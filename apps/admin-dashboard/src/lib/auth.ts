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
  }
  return res;
}



