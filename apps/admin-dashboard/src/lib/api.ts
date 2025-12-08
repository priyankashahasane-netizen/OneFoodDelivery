"use client";

import { authedFetch } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

/**
 * Request OTP from backend (which proxies to CubeOne)
 */
export async function requestOtp(phone: string) {
  const res = await fetch(`${API_BASE}/api/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return await res.json();
}

/**
 * Admin login with password
 */
export async function loginWithPassword(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  return data;
}

/**
 * Admin login with OTP
 */
export async function loginWithOtp(phone: string, otp: string, accessToken?: string) {
  const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, access_token: accessToken }),
  });
  const data = await res.json();
  return data;
}
