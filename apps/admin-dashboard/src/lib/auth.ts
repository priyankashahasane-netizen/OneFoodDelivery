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
  localStorage.removeItem('is_admin');
}

/**
 * Decode JWT token to get payload (without verification)
 */
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check cached value first
  const cached = localStorage.getItem('is_admin');
  if (cached !== null) {
    return cached === 'true';
  }
  
  // Decode token to check isAdmin flag
  const token = getToken();
  if (!token) return false;
  
  const payload = decodeJwtPayload(token);
  const adminStatus = payload?.isAdmin ?? false;
  
  // Cache the result
  localStorage.setItem('is_admin', adminStatus.toString());
  
  return adminStatus;
}

/**
 * Set admin status (called after login)
 */
export function setAdminStatus(isAdmin: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('is_admin', isAdmin.toString());
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



