"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import RequireAuth from '../../components/RequireAuth';
import Header from '../../components/Header';
import { authedFetch, isAdmin } from '../../lib/auth';

const fetcher = (url: string) => authedFetch(url).then((r) => r.json());

export default function DriversPage() {
  const { data, mutate, isLoading } = useSWR('/api/drivers', fetcher);
  const [adminStatus, setAdminStatus] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: '',
    capacity: '0',
    homeAddress: '',
    homeAddressLatitude: '',
    homeAddressLongitude: '',
    latitude: '',
    longitude: '',
    zoneId: '',
  });

  async function toggleOnline(id: string, online: boolean) {
    await authedFetch(`/api/drivers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ online: !online })
    });
    mutate();
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    // Validate required fields
    if (!formData.name || !formData.phone || !formData.vehicleType) {
      setError('Please fill in all required fields (Name, Phone, Vehicle Type)');
      setFormLoading(false);
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        capacity: formData.capacity ? parseInt(formData.capacity) : 0,
      };

      // Add optional fields if provided
      if (formData.homeAddress) payload.homeAddress = formData.homeAddress;
      if (formData.homeAddressLatitude) payload.homeAddressLatitude = parseFloat(formData.homeAddressLatitude);
      if (formData.homeAddressLongitude) payload.homeAddressLongitude = parseFloat(formData.homeAddressLongitude);
      if (formData.latitude) payload.latitude = parseFloat(formData.latitude);
      if (formData.longitude) payload.longitude = parseFloat(formData.longitude);
      if (formData.zoneId) payload.zoneId = formData.zoneId;

      const response = await authedFetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create driver' }));
        throw new Error(errorData.message || 'Failed to create driver');
      }

      // Reset form and close
      setFormData({
        name: '',
        phone: '',
        vehicleType: '',
        capacity: '0',
        homeAddress: '',
        homeAddressLatitude: '',
        homeAddressLongitude: '',
        latitude: '',
        longitude: '',
        zoneId: '',
      });
      setShowForm(false);
      mutate(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to create driver');
      console.error('Create driver error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    setAdminStatus(isAdmin());
  }, []);

  return (
    <RequireAuth>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: 16, flex: 1 }}>
          {!adminStatus ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '400px',
              color: '#6b7280',
              fontSize: 16
            }}>
              Access restricted. Admin privileges required.
            </div>
          ) : (
            <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Drivers</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? '#6b7280' : '#2563eb',
              color: '#fff',
              border: 0,
              padding: '10px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {showForm ? 'Cancel' : '+ Add Driver'}
          </button>
        </div>

        {showForm && (
          <div style={{ 
            background: '#f9fafb', 
            padding: 20, 
            borderRadius: 8, 
            marginBottom: 24,
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Add New Driver</h2>
            
            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Driver name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Phone *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., +919876543210"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select vehicle type...</option>
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Current Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="any"
                    placeholder="e.g., 12.9716"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Current Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="any"
                    placeholder="e.g., 77.5946"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Home Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    placeholder="Driver's home address"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Home Address Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    name="homeAddressLatitude"
                    value={formData.homeAddressLatitude}
                    onChange={handleInputChange}
                    step="any"
                    placeholder="e.g., 12.9716"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Home Address Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    name="homeAddressLongitude"
                    value={formData.homeAddressLongitude}
                    onChange={handleInputChange}
                    step="any"
                    placeholder="e.g., 77.5946"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                    Zone ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="zoneId"
                    value={formData.zoneId}
                    onChange={handleInputChange}
                    placeholder="Zone identifier"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                  }}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    padding: '10px 20px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    background: formLoading ? '#9ca3af' : '#2563eb',
                    color: '#fff',
                    border: 0,
                    padding: '10px 20px',
                    borderRadius: 6,
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {formLoading ? 'Creating...' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Phone</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Vehicle</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Online</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((d: any) => (
                <tr key={d.id}>
                  <td style={{ padding: 8 }}>{d.name}</td>
                  <td style={{ padding: 8 }}>{d.phone}</td>
                  <td style={{ padding: 8 }}>{d.vehicleType}</td>
                  <td style={{ padding: 8 }}>{d.online ? 'Yes' : 'No'}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => toggleOnline(d.id, d.online)}
                      style={{
                        background: d.online ? '#ef4444' : '#16a34a',
                        color: '#fff',
                        border: 0,
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      {d.online ? 'Go Offline' : 'Go Online'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
            </>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}


