import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: '#ffffff',
        color: '#0f172a',
        padding: '48px 24px 32px',
        marginTop: 'auto',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 32,
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 22, fontWeight: 700 }}>OneDelivery</h2>
          <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#475569' }}>
            Intelligent last-mile delivery platform for modern operations.
          </p>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Company</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', fontSize: 14 }}>
            {['About Us', 'Careers', 'Blog'].map((label) => (
              <li key={label} style={{ marginBottom: 10 }}>
                <Link href="#" style={{ color: '#0f172a', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', fontSize: 14 }}>
            {['API Integrations', 'Packers & Movers', 'Two Wheelers'].map((label) => (
              <li key={label} style={{ marginBottom: 10 }}>
                <Link href="#" style={{ color: '#0f172a', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Support</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', fontSize: 14 }}>
            {[
              'Contact Us',
              'Privacy Policy',
              'Terms of Service',
              'Driver Partner Terms',
              'Insurance FAQs',
              'Zero Tolerance Policy',
            ].map((label) => (
              <li key={label} style={{ marginBottom: 10 }}>
                <Link href="#" style={{ color: '#0f172a', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div
        style={{
          maxWidth: 1400,
          margin: '32px auto 0',
          borderTop: '1px solid #e2e8f0',
          paddingTop: 12,
          fontSize: 12,
          color: '#475569',
        }}
      >
        © {year} One Delivery. All rights reserved.
      </div>
    </footer>
  );
}

