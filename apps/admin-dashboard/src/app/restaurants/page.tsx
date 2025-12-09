"use client";

import { useState, useMemo } from 'react';
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

export default function RestaurantsPage() {
  const [filters, setFilters] = useState({
    status: '',
  });
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>({});

  // Build query string from filters - focus on restaurant-relevant statuses
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    // Keep within backend pageSize limit
    params.append('pageSize', '200');
    if (filters.status) params.append('status', filters.status);
    return params.toString();
  }, [filters]);

  const apiUrl = `/api/orders?${queryString}`;
  const { data, mutate, isLoading, error } = useSWR(apiUrl, fetcher);

  // Restaurant-relevant statuses
  const restaurantStatuses = [
    'created',
    'accepted',
    'confirmed',
    'processing',
    'handover',
    'picked_up',
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '' });
  };

  async function updateStatus(orderId: string, newStatus: string) {
    // Optimistically update UI
    setPendingStatuses(prev => ({ ...prev, [orderId]: newStatus }));
    try {
      await authedFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // Clear pending state and refetch
      setPendingStatuses(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      mutate();
    } catch (error) {
      // Revert on error
      setPendingStatuses(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      alert('Failed to update order status. Please try again.');
      console.error('Update status error:', error);
    }
  }

  // Filter orders to show only restaurant-relevant ones (exclude delivered, cancelled, etc.)
  const restaurantOrders = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((o: any) => 
      restaurantStatuses.includes(o.status?.toLowerCase()) || 
      !o.status || 
      o.status === 'pending'
    );
  }, [data?.items]);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed') return '#166534'; // green
    if (s === 'processing') return '#92400e'; // amber
    if (s === 'handover') return '#1e40af'; // blue
    if (s === 'picked_up') return '#7c3aed'; // purple
    if (s === 'accepted') return '#059669'; // emerald
    return '#6b7280'; // gray
  };

  const getStatusBadgeStyle = (status: string) => {
    const color = getStatusColor(status);
    return {
      padding: '4px 12px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      background: color,
      display: 'inline-block',
    };
  };

  return (
    <RequireAuth>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: 16, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: 4 }}>Restaurant Orders</h1>
            <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
              Active Orders: <span style={{ color: '#111827', fontWeight: 600 }}>{restaurantOrders.length}</span>
            </div>
          </div>
        </div>
        
        {/* Filters Section */}
        <div style={{ 
          background: '#f9fafb', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: 16,
            alignItems: 'end'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #d1d5db', 
                  fontSize: 14,
                  width: '100%',
                  background: '#fff'
                }}
              >
                <option value="">All Statuses</option>
                {restaurantStatuses.map((status: string) => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                height: 'fit-content'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {isLoading ? (
          <p>Loading…</p>
        ) : error ? (
          <div style={{ padding: 16, background: '#fee2e2', borderRadius: 8, color: '#991b1b' }}>
            <strong>Error loading orders:</strong> {error.message || 'Unknown error'}
          </div>
        ) : (
          <>
            {restaurantOrders.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                <p>No active orders found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {restaurantOrders.map((order: any) => {
                  const currentStatus = pendingStatuses[order.id] || order.status || 'created';
                  const isPending = !!pendingStatuses[order.id];
                  
                  return (
                    <div
                      key={order.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: 20,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
                              Order {order.externalRef || order.id.substring(0, 8)}
                            </h3>
                            <span style={getStatusBadgeStyle(currentStatus)}>
                              {currentStatus.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {isPending && (
                              <span style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                                Updating...
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                            <div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Pickup Location</div>
                              <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
                                {order.pickup?.address || `${order.pickup?.lat?.toFixed(4)}, ${order.pickup?.lng?.toFixed(4)}`}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Delivery Location</div>
                              <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
                                {order.dropoff?.address || `${order.dropoff?.lat?.toFixed(4)}, ${order.dropoff?.lng?.toFixed(4)}`}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Payment Type</div>
                              <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
                                {order.paymentType || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Created At</div>
                              <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 8, 
                        flexWrap: 'wrap',
                        paddingTop: 16,
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        {currentStatus === 'created' || currentStatus === 'accepted' || currentStatus === 'pending' ? (
                          <button
                            onClick={() => updateStatus(order.id, 'confirmed')}
                            disabled={isPending}
                            style={{
                              background: '#166534',
                              color: '#fff',
                              border: 0,
                              padding: '10px 20px',
                              borderRadius: 6,
                              cursor: isPending ? 'not-allowed' : 'pointer',
                              fontSize: 14,
                              fontWeight: 600,
                              opacity: isPending ? 0.6 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            ✓ Confirm Order
                          </button>
                        ) : null}

                        {currentStatus === 'confirmed' ? (
                          <button
                            onClick={() => updateStatus(order.id, 'processing')}
                            disabled={isPending}
                            style={{
                              background: '#92400e',
                              color: '#fff',
                              border: 0,
                              padding: '10px 20px',
                              borderRadius: 6,
                              cursor: isPending ? 'not-allowed' : 'pointer',
                              fontSize: 14,
                              fontWeight: 600,
                              opacity: isPending ? 0.6 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            🍳 Mark as Cooking
                          </button>
                        ) : null}

                        {currentStatus === 'processing' ? (
                          <button
                            onClick={() => updateStatus(order.id, 'handover')}
                            disabled={isPending}
                            style={{
                              background: '#1e40af',
                              color: '#fff',
                              border: 0,
                              padding: '10px 20px',
                              borderRadius: 6,
                              cursor: isPending ? 'not-allowed' : 'pointer',
                              fontSize: 14,
                              fontWeight: 600,
                              opacity: isPending ? 0.6 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            📦 Ready for Handover
                          </button>
                        ) : null}

                        {currentStatus === 'handover' && (
                          <div style={{ 
                            padding: '10px 16px', 
                            background: '#dbeafe', 
                            borderRadius: 6,
                            color: '#1e40af',
                            fontSize: 14,
                            fontWeight: 500
                          }}>
                            ✓ Order ready - waiting for driver pickup
                          </div>
                        )}

                        {currentStatus === 'picked_up' && (
                          <div style={{ 
                            padding: '10px 16px', 
                            background: '#ede9fe', 
                            borderRadius: 6,
                            color: '#7c3aed',
                            fontSize: 14,
                            fontWeight: 500
                          }}>
                            ✓ Order picked up by driver
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        </main>
      </div>
    </RequireAuth>
  );
}

