"use client";

// Map all possible order statuses from OpenAPI spec
const statusSteps = [
  { key: 'created', label: 'Created' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' }
];

// Legacy status mapping for backward compatibility
const legacyStatusMap: Record<string, string> = {
  'accepted': 'assigned'
};

export default function StatusTimeline({ status }: { status: string }) {
  // Normalize status (handle legacy statuses)
  const normalizedStatus = legacyStatusMap[status] || status;
  
  // Find the active index based on normalized status
  const activeIndex = Math.max(0, statusSteps.findIndex((s) => s.key === normalizedStatus));
  
  // Filter steps to show only up to the current status (or all if cancelled)
  const visibleSteps = normalizedStatus === 'cancelled' 
    ? statusSteps.filter(s => s.key === 'cancelled')
    : statusSteps.slice(0, Math.max(activeIndex + 1, 1));
  
  return (
    <div>
      <h3 style={{ margin: '16px 0 8px 0', fontSize: 16 }}>Status</h3>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {visibleSteps.map((s, idx) => {
          const isActive = s.key === normalizedStatus || idx <= activeIndex;
          return (
            <li key={s.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  marginRight: 8,
                  background: isActive ? (s.key === 'cancelled' ? '#ef4444' : '#16a34a') : '#e5e7eb'
                }}
              />
              <span style={{ color: isActive ? '#111827' : '#9ca3af' }}>{s.label}</span>
            </li>
          );
        })}
      </ol>
      {normalizedStatus && !statusSteps.find(s => s.key === normalizedStatus) && (
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
          Current: <strong>{normalizedStatus}</strong>
        </p>
      )}
    </div>
  );
}


