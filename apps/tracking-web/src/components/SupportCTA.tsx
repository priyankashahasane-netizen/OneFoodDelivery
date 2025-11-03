"use client";

export default function SupportCTA() {
  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => {
          // Placeholder: integrate Twilio or backend support endpoint
          alert('Contacting support…');
        }}
        style={{
          width: '100%',
          height: 40,
          background: '#111827',
          color: '#fff',
          border: 0,
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Contact Support
      </button>
    </div>
  );
}


