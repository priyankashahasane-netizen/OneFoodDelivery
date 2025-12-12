"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import RequireAuth from '../../components/RequireAuth';
import Header from '../../components/Header';
import { authedFetch } from '../../lib/auth';

const fetcher = async (url: string) => {
  try {
    const response = await authedFetch(url);
    return await response.json();
  } catch (error: any) {
    console.error('Fetcher error:', error);
    throw error;
  }
};

type RestaurantForm = {
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  status: string;
  isVerified: boolean;
  cuisines: string;
  dietaryTags: string;
  logoUrl: string;
  bannerUrl: string;
  commissionRate: string;
  minOrderValue: string;
  maxDeliveryDistanceKm: string;
  payoutCycle: string;
  zoneId: string;
};

function RestaurantsPageContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: '' });

  const [formData, setFormData] = useState<RestaurantForm>({
    name: '',
    slug: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    status: 'active',
    isVerified: false,
    cuisines: '',
    dietaryTags: '',
    logoUrl: '',
    bannerUrl: '',
    commissionRate: '',
    minOrderValue: '',
    maxDeliveryDistanceKm: '',
    payoutCycle: 'weekly',
    zoneId: '',
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append('pageSize', '200');
    if (filters.status) params.append('status', filters.status);
    return params.toString();
  }, [filters]);

  const apiUrl = `/api/restaurants?${queryString}`;
  const { data, mutate, isLoading, error: fetchError } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const restaurants = useMemo(() => data?.items || data || [], [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    if (!formData.name || !formData.phone || !formData.address) {
      setError('Name, phone, and address are required.');
      setFormLoading(false);
      return;
    }

    // Auto-fill slug if not provided
    const slug = formData.slug || formData.name.trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const payload: any = {
      name: formData.name,
      slug,
      phone: formData.phone,
      email: formData.email || null,
      address: formData.address,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postalCode: formData.postalCode || null,
      status: formData.status || 'active',
      isVerified: formData.isVerified,
      payoutCycle: formData.payoutCycle || 'weekly',
      zoneId: formData.zoneId || null,
    };

    // Optional numeric fields
    if (formData.latitude) payload.latitude = parseFloat(formData.latitude);
    if (formData.longitude) payload.longitude = parseFloat(formData.longitude);
    if (formData.commissionRate) payload.commissionRate = parseFloat(formData.commissionRate);
    if (formData.minOrderValue) payload.minOrderValue = parseFloat(formData.minOrderValue);
    if (formData.maxDeliveryDistanceKm) payload.maxDeliveryDistanceKm = parseFloat(formData.maxDeliveryDistanceKm);

    // Optional arrays
    if (formData.cuisines) payload.cuisines = formData.cuisines.split(',').map((c) => c.trim()).filter(Boolean);
    if (formData.dietaryTags) payload.dietaryTags = formData.dietaryTags.split(',').map((c) => c.trim()).filter(Boolean);

    if (formData.logoUrl) payload.logoUrl = formData.logoUrl;
    if (formData.bannerUrl) payload.bannerUrl = formData.bannerUrl;

    try {
      const response = await authedFetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create restaurant' }));
        throw new Error(errorData.message || 'Failed to create restaurant');
      }

      setFormData({
        name: '',
        slug: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        status: 'active',
        isVerified: false,
        cuisines: '',
        dietaryTags: '',
        logoUrl: '',
        bannerUrl: '',
        commissionRate: '',
        minOrderValue: '',
        maxDeliveryDistanceKm: '',
        payoutCycle: 'weekly',
        zoneId: '',
      });
      setShowForm(false);
      mutate();
    } catch (err: any) {
      setError(err.message || 'Failed to create restaurant');
      console.error('Create restaurant error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowForm(true);
    }
  }, [searchParams]);

  return (
    <RequireAuth>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: 16, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, marginBottom: 4 }}>Restaurants</h1>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                Total: <span style={{ color: '#111827', fontWeight: 600 }}>{restaurants?.length || 0}</span>
              </div>
            </div>
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
              {showForm ? 'Cancel' : '+ Add Restaurant'}
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
              <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Add New Restaurant</h2>

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Restaurant name"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Slug</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="auto-generated if empty"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="Primary phone"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@email.com"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Street, area, city"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, minHeight: 60 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Postal code"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Latitude</label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="e.g., 19.0760"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Longitude</label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="e.g., 72.8777"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Zone ID</label>
                    <input
                      type="text"
                      name="zoneId"
                      value={formData.zoneId}
                      onChange={handleInputChange}
                      placeholder="Zone identifier"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#fff' }}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Payout Cycle</label>
                    <select
                      name="payoutCycle"
                      value={formData.payoutCycle}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#fff' }}
                    >
                      <option value="weekly">weekly</option>
                      <option value="biweekly">biweekly</option>
                      <option value="monthly">monthly</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Commission %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="commissionRate"
                      value={formData.commissionRate}
                      onChange={handleInputChange}
                      placeholder="e.g., 15"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Min Order Value</label>
                    <input
                      type="number"
                      step="0.01"
                      name="minOrderValue"
                      value={formData.minOrderValue}
                      onChange={handleInputChange}
                      placeholder="₹"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Max Delivery Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="maxDeliveryDistanceKm"
                      value={formData.maxDeliveryDistanceKm}
                      onChange={handleInputChange}
                      placeholder="e.g., 5"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Cuisines (comma separated)</label>
                    <input
                      type="text"
                      name="cuisines"
                      value={formData.cuisines}
                      onChange={handleInputChange}
                      placeholder="Indian, Chinese"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Dietary Tags (comma separated)</label>
                    <input
                      type="text"
                      name="dietaryTags"
                      value={formData.dietaryTags}
                      onChange={handleInputChange}
                      placeholder="Vegan, Halal"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Logo URL</label>
                    <input
                      type="text"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Banner URL</label>
                    <input
                      type="text"
                      name="bannerUrl"
                      value={formData.bannerUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="isVerified"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isVerified" style={{ fontSize: 14, fontWeight: 500 }}>Verified</label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 0,
                    padding: '12px 20px',
                    borderRadius: 8,
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    fontSize: 15,
                    fontWeight: 600,
                    alignSelf: 'flex-start',
                    opacity: formLoading ? 0.7 : 1,
                  }}
                >
                  {formLoading ? 'Saving...' : 'Save Restaurant'}
                </button>
              </form>
            </div>
          )}

          {isLoading ? (
            <p>Loading…</p>
          ) : fetchError ? (
            <div style={{ padding: 16, background: '#fee2e2', borderRadius: 8, color: '#991b1b' }}>
              <strong>Error loading restaurants:</strong> {fetchError.message || 'Unknown error'}
            </div>
          ) : restaurants?.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
              <p>No restaurants yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Name
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Phone
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Email
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      City
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Verified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r: any) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{r.phone || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{r.email || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{r.city || r.state || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827' }}>{r.status || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827' }}>
                        {r.isVerified ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <RequireAuth>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ padding: 16, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Loading...</div>
          </main>
        </div>
      </RequireAuth>
    }>
      <RestaurantsPageContent />
    </Suspense>
  );
}

