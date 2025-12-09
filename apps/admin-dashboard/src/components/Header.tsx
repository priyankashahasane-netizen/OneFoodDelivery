"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { clearToken, getToken, isAdmin } from '../lib/auth';
import DriverAppModal from './DriverAppModal';

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [adminStatus, setAdminStatus] = useState(false);
  const [showDriverAppModal, setShowDriverAppModal] = useState(false);

  const driverAppDownloadUrl =
    process.env.NEXT_PUBLIC_DRIVER_APP_URL ??
    'https://play.google.com/store/apps/details?id=com.sixamtech.stack_food_delivery';

  useEffect(() => {
    setMounted(true);
    setHasToken(!!getToken());
    setAdminStatus(isAdmin());
  }, []);

  const handleLogout = () => {
    clearToken();
    setHasToken(false);
    router.push('/login');
  };

  const handleDriverPartnerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowDriverAppModal(true);
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <Image
            src="/oneCRM-logo.png"
            alt="OneCRM Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
            One Delivery
          </h1>
        </Link>
      </div>
      <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {(!mounted || !hasToken) && (
          <>
            <Link 
              href="/enterprise"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#111827',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              For Enterprise
            </Link>
            <button
              type="button"
              onClick={handleDriverPartnerClick}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#111827',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.2s',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Driver Partner
            </button>
          </>
        )}
        {mounted && hasToken && (
          <>
            <button
              type="button"
              onClick={handleDriverPartnerClick}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
            >
              Driver Partner
            </button>
            <Link 
              href="/live-ops"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
            >
              Live Ops
            </Link>
            <Link 
              href="/orders"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
            >
              Orders
            </Link>
            <Link 
              href="/restaurants"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
            >
              Restaurants
            </Link>
            <Link 
              href="/drivers"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
            >
              Drivers
            </Link>
          </>
        )}
        {mounted && hasToken ? (
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Logout
          </button>
        ) : (
          <Link 
            href="/login"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Login
          </Link>
        )}
      </nav>
      <DriverAppModal
        open={showDriverAppModal}
        downloadUrl={driverAppDownloadUrl}
        onClose={() => setShowDriverAppModal(false)}
      />
    </header>
  );
}
