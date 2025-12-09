"use client";

import type { MouseEvent } from 'react';

type DriverAppModalProps = {
  open: boolean;
  downloadUrl: string;
  onClose: () => void;
};

export default function DriverAppModal({ open, downloadUrl, onClose }: DriverAppModalProps) {
  if (!open) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 24,
          width: 'min(420px, 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close download dialog"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            borderRadius: 8,
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontSize: 14,
            color: '#111827',
          }}
        >
          X
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: 0.4, color: '#6b7280', fontWeight: 600 }}>
              DRIVER PARTNER
            </p>
            <h2 style={{ margin: '4px 0 0 0', fontSize: 22, color: '#111827' }}>
              Download the Driver Mobile App
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: 14, lineHeight: 1.5 }}>
              Install the latest driver app to start accepting orders and tracking deliveries on the go.
            </p>
          </div>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              background: '#2563eb',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
              border: '1px solid #1d4ed8',
            }}
          >
            Download Mobile App
          </a>

          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            Having trouble? Reach out to support for an installation link.
          </p>
        </div>
      </div>
    </div>
  );
}
