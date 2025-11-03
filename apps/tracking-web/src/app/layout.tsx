export const metadata = {
  title: 'Order Tracking',
  description: 'Live tracking for deliveries'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}


