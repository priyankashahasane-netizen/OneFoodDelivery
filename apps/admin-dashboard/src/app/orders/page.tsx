"use client";

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import RequireAuth from '../../components/RequireAuth';
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

export default function OrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    paymentType: '',
    driverId: '',
    assigned: '',
  });

  // Build query string from filters
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    // Set high pageSize to get all orders
    params.append('pageSize', '10000');
    if (filters.status) params.append('status', filters.status);
    if (filters.paymentType) params.append('paymentType', filters.paymentType);
    if (filters.driverId) params.append('driverId', filters.driverId);
    if (filters.assigned !== '') {
      params.append('assigned', filters.assigned === 'assigned' ? 'true' : 'false');
    }
    return params.toString();
  }, [filters]);

  const apiUrl = `/api/orders?${queryString}`;
  const { data, mutate, isLoading, error } = useSWR(apiUrl, fetcher);
  
  // Fetch total count without filters for display
  const { data: totalData } = useSWR('/api/orders?pageSize=1', fetcher);
  const { data: drivers } = useSWR('/api/drivers?page=1&pageSize=100', fetcher);

  // Predefined lists for filters - all possible order statuses
  // Note: Backend handles both 'cancelled' and 'canceled' spellings automatically
  const orderStatuses = [
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
    'cancelled', // Backend will match both 'cancelled' and 'canceled'
    'refund_requested',
    'refunded',
    'refund_request_canceled'
  ];

  const paymentTypes = [
    'cash_on_delivery',
    'prepaid',
    'partial'
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      paymentType: '',
      driverId: '',
      assigned: '',
    });
  };

  async function assign(orderId: string, driverId?: string) {
    const selectedDriverId = driverId || prompt('Enter Driver ID to assign');
    if (!selectedDriverId) return;
    try {
      await authedFetch(`/api/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriverId })
      });
      mutate();
    } catch (error) {
      alert('Failed to assign order. Please try again.');
      console.error('Assign error:', error);
    }
  }

  async function unassign(orderId: string) {
    if (!confirm('Are you sure you want to unassign this order?')) return;
    try {
      await authedFetch(`/api/orders/${orderId}/unassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      mutate();
    } catch (error) {
      alert('Failed to unassign order. Please try again.');
      console.error('Unassign error:', error);
    }
  }

  async function deleteOrder(orderId: string) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    try {
      await authedFetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      mutate();
    } catch (error) {
      alert('Failed to delete order. Please try again.');
      console.error('Delete error:', error);
    }
  }

  const handleQuickAssign = (orderId: string, driverId: string) => {
    if (driverId) {
      assign(orderId, driverId);
    }
  };

  // Get total orders count (from unfiltered query) and filtered count
  const totalOrders = totalData?.total ?? data?.total ?? 0;
  const filteredCount = data?.items?.length ?? 0;
  const hasActiveFilters = filters.status || filters.paymentType || filters.driverId || filters.assigned !== '';

  return (
    <RequireAuth>
      <main style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: 4 }}>Orders</h1>
            <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
              Total Orders: <span style={{ color: '#111827', fontWeight: 600 }}>{totalOrders}</span>
              {hasActiveFilters && (
                <span style={{ marginLeft: 12 }}>
                  | Filtered: <span style={{ color: '#111827', fontWeight: 600 }}>{filteredCount}</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/orders/create')}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 0,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            + Create Order
          </button>
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
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            alignItems: 'end'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                {orderStatuses.map((status: string) => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Payment Type</label>
              <select
                value={filters.paymentType}
                onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #d1d5db', 
                  fontSize: 14,
                  width: '100%',
                  background: '#fff'
                }}
              >
                <option value="">All Payment Types</option>
                {paymentTypes.map((type: string) => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Driver</label>
              <select
                value={filters.driverId}
                onChange={(e) => handleFilterChange('driverId', e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #d1d5db', 
                  fontSize: 14,
                  width: '100%',
                  background: '#fff'
                }}
              >
                <option value="">All Drivers</option>
                {drivers?.items?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.online ? '(online)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Assignment</label>
              <select
                value={filters.assigned}
                onChange={(e) => handleFilterChange('assigned', e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #d1d5db', 
                  fontSize: 14,
                  width: '100%',
                  background: '#fff'
                }}
              >
                <option value="">All Orders</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
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
          <pre style={{ marginTop: 8, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <>
          {hasActiveFilters && (
            <div style={{ marginBottom: 12, fontSize: 14, color: '#6b7280', padding: '8px 12px', background: '#f3f4f6', borderRadius: 6 }}>
              Showing {filteredCount} of {totalOrders} orders {hasActiveFilters && '(filtered)'}
            </div>
          )}
          {!data?.items || data.items.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
              <p>No orders found.</p>
              {data && <pre style={{ marginTop: 8, fontSize: 12, textAlign: 'left', background: '#f3f4f6', padding: 12, borderRadius: 4, overflow: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Ref</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Status</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Payment</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Pickup</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Dropoff</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Driver</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151', minWidth: 300 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 14, color: '#111827' }}>
                        {o.externalRef || o.id.substring(0, 8)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        display: 'inline-block',
                        background: o.status === 'delivered' ? '#d1fae5' : 
                                    o.status === 'cancelled' || o.status === 'canceled' ? '#fee2e2' :
                                    o.status === 'assigned' ? '#dbeafe' :
                                    o.status === 'accepted' ? '#dcfce7' :
                                    o.status === 'picked_up' ? '#fef3c7' :
                                    '#f3f4f6',
                        color: o.status === 'delivered' ? '#065f46' :
                               o.status === 'cancelled' || o.status === 'canceled' ? '#991b1b' :
                               o.status === 'assigned' ? '#1e40af' :
                               o.status === 'accepted' ? '#166534' :
                               o.status === 'picked_up' ? '#92400e' :
                               '#374151'
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 14, color: '#111827' }}>
                        {o.paymentType || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle', maxWidth: 200 }}>
                      <span style={{ fontSize: 13, color: '#111827', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.pickup?.address || `${o.pickup?.lat?.toFixed(4)}, ${o.pickup?.lng?.toFixed(4)}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle', maxWidth: 200 }}>
                      <span style={{ fontSize: 13, color: '#111827', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.dropoff?.address || `${o.dropoff?.lat?.toFixed(4)}, ${o.dropoff?.lng?.toFixed(4)}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      {o.driver?.name || o.driverId ? (
                        <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>
                          {o.driver?.name || 'Driver ID: ' + o.driverId?.substring(0, 8)}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: 6, 
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                        whiteSpace: 'nowrap'
                      }}>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleQuickAssign(o.id, e.target.value);
                              e.target.value = ''; // Reset selection
                            }
                          }}
                          style={{ 
                            padding: '6px 10px', 
                            borderRadius: 4, 
                            border: '1px solid #d1d5db', 
                            fontSize: 12,
                            background: '#fff',
                            cursor: 'pointer',
                            minWidth: 140
                          }}
                        >
                          <option value="">{o.driverId ? 'Reassign driver…' : 'Assign driver…'}</option>
                          {drivers?.items?.map((d: any) => (
                            <option key={d.id} value={d.id}>
                              {d.name} {d.online ? '(online)' : ''}
                            </option>
                          ))}
                        </select>
                        {o.driverId && (
                          <button
                            onClick={() => unassign(o.id)}
                            style={{ 
                              background: '#f59e0b', 
                              color: '#fff', 
                              border: 0, 
                              padding: '6px 12px', 
                              borderRadius: 4, 
                              cursor: 'pointer', 
                              fontSize: 12,
                              fontWeight: 500,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Unassign
                          </button>
                        )}
                        <button
                          onClick={() => deleteOrder(o.id)}
                          style={{ 
                            background: '#dc2626', 
                            color: '#fff', 
                            border: 0, 
                            padding: '6px 12px', 
                            borderRadius: 4, 
                            cursor: 'pointer', 
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Delete
                        </button>
                        {o.trackingUrl && (
                          <a
                            href={o.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#2563eb', 
                              fontSize: 12, 
                              textDecoration: 'none',
                              fontWeight: 500,
                              padding: '6px 8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Track
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </main>
    </RequireAuth>
  );
}

