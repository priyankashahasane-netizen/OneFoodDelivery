"use client";

const steps = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
];

export default function StatusTimeline({ status }: { status: string }) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.key === status));
  return (
    <div>
      <h3 style={{ margin: '16px 0 8px 0', fontSize: 16 }}>Status</h3>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {steps.map((s, idx) => (
          <li key={s.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 10,
                marginRight: 8,
                background: idx <= activeIndex ? '#16a34a' : '#e5e7eb'
              }}
            />
            <span style={{ color: idx <= activeIndex ? '#111827' : '#9ca3af' }}>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}


