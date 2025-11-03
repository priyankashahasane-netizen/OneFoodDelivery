import RequireAuth from '../../components/RequireAuth';

export default function ExceptionsPage() {
  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
        <h1>Exceptions</h1>
        <p>Exception monitoring coming soon (idle drivers, route deviation, geofence breach).</p>
      </main>
    </RequireAuth>
  );
}



