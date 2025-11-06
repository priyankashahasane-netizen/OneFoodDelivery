"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '../../../components/RequireAuth';
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

  const [formData, setFormData] = useState({
    externalRef: '',
    pickupLat: '',
    pickupLng: '',
    pickupAddress: '',
    dropoffLat: '',
    dropoffLng: '',
    dropoffAddress: '',
    paymentType: 'cash_on_delivery' as 'cash_on_delivery' | 'prepaid' | 'partial',
    status: 'created',
    slaMinutes: '',
    zoneId: '',
    subscriptionId: '',
    cancellationSource: '',
    cancellationReason: '',
    trackingUrl: '',
    items: [] as OrderItem[],
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: '1', price: '' });

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
        zoneId: formData.zoneId || undefined,
        subscriptionId: formData.subscriptionId || undefined,
        cancellationSource: formData.cancellationSource || undefined,
        cancellationReason: formData.cancellationReason || undefined,
        trackingUrl: formData.trackingUrl || undefined,
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
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
                <option value="created">Created</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                SLA (Minutes, Optional)
              </label>
              <input
                type="number"
                name="slaMinutes"
                value={formData.slaMinutes}
                onChange={handleInputChange}
                placeholder="e.g., 45"
                min="1"
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Subscription ID (Optional)
              </label>
              <input
                type="text"
                name="subscriptionId"
                value={formData.subscriptionId}
                onChange={handleInputChange}
                placeholder="Subscription identifier"
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
                Tracking URL (Optional)
              </label>
              <input
                type="url"
                name="trackingUrl"
                value={formData.trackingUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/track/order-id"
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

          {/* Cancellation Information (Optional) */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Cancellation Information (Optional)</h2>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Cancellation Source (Optional)
              </label>
              <select
                name="cancellationSource"
                value={formData.cancellationSource}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value="">Select source...</option>
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                Cancellation Reason (Optional)
              </label>
              <textarea
                name="cancellationReason"
                value={formData.cancellationReason}
                onChange={(e) => setFormData(prev => ({ ...prev, cancellationReason: e.target.value }))}
                placeholder="Reason for cancellation"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Pickup Location *</h2>
            
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

