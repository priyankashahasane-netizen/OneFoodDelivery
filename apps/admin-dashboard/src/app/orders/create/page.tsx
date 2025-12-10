"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '../../../components/RequireAuth';
import MapPicker from '../../../components/MapPicker';
import { authedFetch } from '../../../lib/auth';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<{ id: string; name?: string; online?: boolean }[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState<string | null>(null);

  const statusOptions = [
    'created',
    'pending',
    'assigned',
    'accepted',
    'confirmed',
    'processing',
    'handover',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled',
    'refund_requested',
    'refunded',
    'refund_request_cancelled'
  ] as const;

  const orderTypeOptions = ['regular', 'subscription'] as const;

  const [formData, setFormData] = useState({
    externalRef: '',
    pickupLat: '',
    pickupLng: '',
    pickupAddress: '',
    dropoffLat: '',
    dropoffLng: '',
    dropoffAddress: '',
    paymentType: 'cash_on_delivery' as 'cash_on_delivery' | 'prepaid' | 'partial',
    status: 'created' as typeof statusOptions[number],
    slaMinutes: '',
    deliveryCharge: '',
    orderType: 'regular' as typeof orderTypeOptions[number],
    driverId: '',
    assignedAt: '',
    deliveredAt: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    adminId: '',
    items: [] as OrderItem[],
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: '1', price: '' });

  const haversineDistanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const aVal = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (!newItem.name || !newItem.price) {
      alert('Please fill in item name and price');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: newItem.name,
        quantity: parseInt(newItem.quantity) || 1,
        price: parseFloat(newItem.price) || 0,
      }]
    }));
    setNewItem({ name: '', quantity: '1', price: '' });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate required fields
    if (!formData.pickupLat || !formData.pickupLng || !formData.dropoffLat || !formData.dropoffLng) {
      setError('Please provide both pickup and dropoff coordinates');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        externalRef: formData.externalRef || undefined,
        pickup: {
          lat: parseFloat(formData.pickupLat),
          lng: parseFloat(formData.pickupLng),
          address: formData.pickupAddress || undefined,
        },
        dropoff: {
          lat: parseFloat(formData.dropoffLat),
          lng: parseFloat(formData.dropoffLng),
          address: formData.dropoffAddress || undefined,
        },
        paymentType: formData.paymentType,
        status: formData.status,
        items: formData.items.length > 0 ? formData.items : undefined,
        slaSeconds: formData.slaMinutes ? parseInt(formData.slaMinutes) * 60 : undefined,
        deliveryCharge: formData.deliveryCharge ? parseFloat(formData.deliveryCharge) : undefined,
        orderType: formData.orderType || undefined,
        driverId: formData.driverId || undefined,
        assignedAt: formData.assignedAt ? new Date(formData.assignedAt).toISOString() : undefined,
        deliveredAt: formData.deliveredAt ? new Date(formData.deliveredAt).toISOString() : undefined,
        customerName: formData.customerName || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerEmail: formData.customerEmail || undefined,
        adminId: formData.adminId || undefined,
      };

      const response = await authedFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create order' }));
        throw new Error(errorData.message || 'Failed to create order');
      }

      const order = await response.json();
      router.push(`/orders?created=${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      console.error('Create order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickupCoords = (() => {
    const lat = parseFloat(formData.pickupLat);
    const lng = parseFloat(formData.pickupLng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    return undefined;
  })();

  const dropoffCoords = (() => {
    const lat = parseFloat(formData.dropoffLat);
    const lng = parseFloat(formData.dropoffLng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    return undefined;
  })();

  const showAssignmentSection = formData.orderType !== 'regular';

  const loadDrivers = async () => {
    if (driversLoading) return;
    setDriversLoading(true);
    setDriversError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await authedFetch('/api/drivers?page=1&pageSize=100', {
        signal: controller.signal,
      });
      const data = await res.json();
      setDrivers(data?.items ?? []);
    } catch (err: any) {
      const message =
        err?.name === 'AbortError'
          ? 'Timed out loading drivers. Please retry.'
          : err?.message || 'Failed to load drivers';
      setDriversError(message);
    } finally {
      clearTimeout(timeout);
      setDriversLoading(false);
    }
  };

  useEffect(() => {
    if (!showAssignmentSection || drivers.length > 0) return;
    loadDrivers();
  }, [showAssignmentSection, drivers.length]);

  // Auto-calculate SLA minutes from distance between pickup and dropoff.
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      if (formData.slaMinutes !== '') {
        setFormData((prev) => ({ ...prev, slaMinutes: '' }));
      }
      return;
    }

    const distanceKm = haversineDistanceKm(pickupCoords, dropoffCoords);
    // Assume ~30 km/h average speed => ~2 minutes per km, add 5-min buffer.
    const computedMinutes = Math.max(5, Math.ceil(distanceKm * 2 + 5));
    if (formData.slaMinutes !== computedMinutes.toString()) {
      setFormData((prev) => ({ ...prev, slaMinutes: computedMinutes.toString() }));
    }
  }, [pickupCoords, dropoffCoords, formData.slaMinutes]);

  return (
    <RequireAuth>
      <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0 }}>Create Order</h1>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic Information */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Basic Information</h2>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                External Reference (Optional)
              </label>
              <input
                type="text"
                name="externalRef"
                value={formData.externalRef}
                onChange={handleInputChange}
                placeholder="e.g., ZOMATO-12345"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>
                  Order Type
                </label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  {orderTypeOptions.map((type) => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Payment Type *
              </label>
              <select
                name="paymentType"
                value={formData.paymentType}
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
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="prepaid">Prepaid</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                SLA (Minutes, Auto)
              </label>
              <input
                type="number"
                name="slaMinutes"
                value={formData.slaMinutes}
                readOnly
                placeholder="Will auto-calc after setting pickup & dropoff"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Auto-calculated from map distance (includes small buffer).
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Delivery Charge (₹) (Optional)
              </label>
              <input
                type="number"
                name="deliveryCharge"
                value={formData.deliveryCharge}
                onChange={handleInputChange}
                placeholder="e.g., 50.00"
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                This amount will be credited to the driver's wallet when the order is delivered.
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Pickup Location *</h2>

            <div style={{ marginBottom: 12 }}>
              <MapPicker
                value={pickupCoords}
                onSelect={({ lat, lng }: { lat: number; lng: number }) => {
                  setFormData((prev) => ({
                    ...prev,
                    pickupLat: lat.toString(),
                    pickupLng: lng.toString(),
                  }));
                }}
                height={280}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                Tap on the map to set pickup coordinates.
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Latitude *
              </label>
              <input
                type="number"
                name="pickupLat"
                value={formData.pickupLat}
                onChange={handleInputChange}
                step="any"
                required
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Longitude *
              </label>
              <input
                type="number"
                name="pickupLng"
                value={formData.pickupLng}
                onChange={handleInputChange}
                step="any"
                required
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Address (Optional)
              </label>
              <input
                type="text"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleInputChange}
                placeholder="e.g., Pizza Hut, MG Road, Bengaluru"
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

          {/* Dropoff Location */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Dropoff Location *</h2>

            <div style={{ marginBottom: 12 }}>
              <MapPicker
                value={dropoffCoords}
                onSelect={({ lat, lng }: { lat: number; lng: number }) => {
                  setFormData((prev) => ({
                    ...prev,
                    dropoffLat: lat.toString(),
                    dropoffLng: lng.toString(),
                  }));
                }}
                height={280}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                Tap on the map to set dropoff coordinates.
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Latitude *
              </label>
              <input
                type="number"
                name="dropoffLat"
                value={formData.dropoffLat}
                onChange={handleInputChange}
                step="any"
                required
                placeholder="e.g., 12.9558"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Longitude *
              </label>
              <input
                type="number"
                name="dropoffLng"
                value={formData.dropoffLng}
                onChange={handleInputChange}
                step="any"
                required
                placeholder="e.g., 77.6077"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Address (Optional)
              </label>
              <input
                type="text"
                name="dropoffAddress"
                value={formData.dropoffAddress}
                onChange={handleInputChange}
                placeholder="e.g., Prestige Tech Park, Bengaluru"
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

          {/* Customer Details */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Customer Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Customer name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="e.g., 9876543210"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
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
          </div>

          {showAssignmentSection && (
            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
              <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Assignment & Admin (Optional)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>Driver</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <select
                      name="driverId"
                      value={formData.driverId}
                      onChange={handleInputChange}
                      disabled={driversLoading}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14,
                        background: driversLoading ? '#f3f4f6' : '#fff',
                      }}
                    >
                      <option value="">{driversLoading ? 'Loading drivers…' : 'Select driver (optional)'}</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || 'Unnamed'} {d.online ? '(online)' : ''}
                        </option>
                      ))}
                    </select>
                    {driversError && (
                      <div style={{ fontSize: 12, color: '#b91c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span>{driversError}</span>
                        <button
                          type="button"
                          onClick={loadDrivers}
                          style={{
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            borderRadius: 4,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>Assigned At</label>
                  <input
                    type="datetime-local"
                    name="assignedAt"
                    value={formData.assignedAt}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>Delivered At</label>
                  <input
                    type="datetime-local"
                    name="deliveredAt"
                    value={formData.deliveredAt}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>Admin ID</label>
                  <input
                    type="text"
                    name="adminId"
                    value={formData.adminId}
                    onChange={handleInputChange}
                    placeholder="Admin identifier"
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
            </div>
          )}

          {/* Order Items */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Order Items (Optional)</h2>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  flex: 2,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <input
                type="number"
                placeholder="Quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                min="1"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                step="0.01"
                min="0"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={addItem}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 0,
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Add
              </button>
            </div>

            {formData.items.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #d1d5db', fontSize: 14 }}>Item</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #d1d5db', fontSize: 14 }}>Quantity</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #d1d5db', fontSize: 14 }}>Price</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #d1d5db', fontSize: 14 }}>Total</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #d1d5db', fontSize: 14 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: 8, fontSize: 14 }}>{item.name}</td>
                        <td style={{ padding: 8, fontSize: 14 }}>{item.quantity}</td>
                        <td style={{ padding: 8, fontSize: 14 }}>₹{item.price.toFixed(2)}</td>
                        <td style={{ padding: 8, fontSize: 14 }}>₹{(item.quantity * item.price).toFixed(2)}</td>
                        <td style={{ padding: 8 }}>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 0,
                              padding: '4px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.back()}
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
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : '#2563eb',
                color: '#fff',
                border: 0,
                padding: '10px 20px',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </main>
    </RequireAuth>
  );
}

