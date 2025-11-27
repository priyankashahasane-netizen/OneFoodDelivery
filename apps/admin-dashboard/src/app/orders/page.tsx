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
    orderType: '',
  });
  const [pendingOrderTypes, setPendingOrderTypes] = useState<Record<string, 'regular' | 'subscription'>>({});
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>({});
  const [pendingDeliveryCharges, setPendingDeliveryCharges] = useState<Record<string, string>>({});
  const [editingDeliveryCharge, setEditingDeliveryCharge] = useState<Record<string, boolean>>({});
  const [isBulkResetting, setIsBulkResetting] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [isBulkUnassigning, setIsBulkUnassigning] = useState(false);

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
    if (filters.orderType) params.append('orderType', filters.orderType);
    return params.toString();
  }, [filters]);

  const apiUrl = `/api/orders?${queryString}`;
  const { data, mutate, isLoading, error } = useSWR(apiUrl, fetcher);
  
  // Fetch total count without filters for display
  const { data: totalData } = useSWR('/api/orders?pageSize=1', fetcher);
  const { data: drivers } = useSWR('/api/drivers?page=1&pageSize=100', fetcher);

  // Predefined lists for filters - all possible order statuses
  // Note: Backend handles both 'cancelled' and 'cancelled' spellings automatically
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
    'cancelled', // Backend will match both 'cancelled' and 'cancelled'
    'refund_requested',
    'refunded',
    'refund_request_cancelled'
  ];

  const paymentTypes = [
    'cash_on_delivery',
    'prepaid',
    'partial'
  ];

  const orderTypes = [
    'regular',
    'subscription'
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
      orderType: '',
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

  async function updateStatus(orderId: string, newStatus: string) {
    const previousStatus = data?.items?.find((o: any) => o.id === orderId)?.status;
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

  async function updateDeliveryCharge(orderId: string, deliveryCharge: number) {
    try {
      // Get the current order to preserve other fields
      const currentOrder = data?.items?.find((o: any) => o.id === orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Include all required fields for the DTO validation
      await authedFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: currentOrder.pickup || { lat: 0, lng: 0 },
          dropoff: currentOrder.dropoff || { lat: 0, lng: 0 },
          paymentType: currentOrder.paymentType || 'cash_on_delivery',
          status: currentOrder.status || 'created',
          deliveryCharge: deliveryCharge,
        })
      });
      mutate();
      setEditingDeliveryCharge(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error) {
      alert('Failed to update delivery charge. Please try again.');
      console.error('Update delivery charge error:', error);
      setEditingDeliveryCharge(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    }
  }

  const handleQuickAssign = (orderId: string, driverId: string) => {
    if (driverId) {
      assign(orderId, driverId);
    }
  };

  async function bulkResetStatusToCreated() {
    if (!confirm('Are you sure you want to set all orders status to "created"? This will affect all orders in the system.')) {
      return;
    }
    
    setIsBulkResetting(true);
    try {
      const response = await authedFetch('/api/orders/bulk/reset-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      alert(`Success: ${result.message}`);
      mutate();
    } catch (error) {
      alert('Failed to reset order statuses. Please try again.');
      console.error('Bulk reset error:', error);
    } finally {
      setIsBulkResetting(false);
    }
  }

  async function bulkAssignToDemoDriver() {
    if (!confirm('Are you sure you want to assign all orders to the demo driver? This will affect all orders in the system.')) {
      return;
    }
    
    setIsBulkAssigning(true);
    try {
      const response = await authedFetch('/api/orders/bulk/assign-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      alert(`Success: ${result.message}`);
      mutate();
    } catch (error) {
      alert('Failed to assign orders to demo driver. Please try again.');
      console.error('Bulk assign error:', error);
    } finally {
      setIsBulkAssigning(false);
    }
  }

  async function bulkUnassignAll() {
    if (!confirm('Are you sure you want to unassign all orders? This will remove driver assignments from all orders in the system.')) {
      return;
    }
    
    setIsBulkUnassigning(true);
    try {
      const response = await authedFetch('/api/orders/bulk/unassign-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      alert(`Success: ${result.message}`);
      mutate();
    } catch (error) {
      alert('Failed to unassign orders. Please try again.');
      console.error('Bulk unassign error:', error);
    } finally {
      setIsBulkUnassigning(false);
    }
  }

  // Get total orders count (from unfiltered query) and filtered count
  const totalOrders = totalData?.total ?? data?.total ?? 0;
  const filteredCount = data?.items?.length ?? 0;
  const hasActiveFilters = filters.status || filters.paymentType || filters.driverId || filters.assigned !== '' || filters.orderType !== '';

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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={bulkResetStatusToCreated}
              disabled={isBulkResetting}
              style={{
                background: isBulkResetting ? '#9ca3af' : '#10b981',
                color: '#fff',
                border: 0,
                padding: '8px 16px',
                borderRadius: 6,
                cursor: isBulkResetting ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: isBulkResetting ? 0.6 : 1,
              }}
            >
              {isBulkResetting ? 'Resetting...' : 'Reset All to Created'}
            </button>
            <button
              onClick={bulkAssignToDemoDriver}
              disabled={isBulkAssigning}
              style={{
                background: isBulkAssigning ? '#9ca3af' : '#f59e0b',
                color: '#fff',
                border: 0,
                padding: '8px 16px',
                borderRadius: 6,
                cursor: isBulkAssigning ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: isBulkAssigning ? 0.6 : 1,
              }}
            >
              {isBulkAssigning ? 'Assigning...' : 'Assign All to Demo Driver'}
            </button>
            <button
              onClick={bulkUnassignAll}
              disabled={isBulkUnassigning}
              style={{
                background: isBulkUnassigning ? '#9ca3af' : '#ef4444',
                color: '#fff',
                border: 0,
                padding: '8px 16px',
                borderRadius: 6,
                cursor: isBulkUnassigning ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: isBulkUnassigning ? 0.6 : 1,
              }}
            >
              {isBulkUnassigning ? 'Unassigning...' : 'Unassign All'}
            </button>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Order Type</label>
              <select
                value={filters.orderType}
                onChange={(e) => handleFilterChange('orderType', e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #d1d5db', 
                  fontSize: 14,
                  width: '100%',
                  background: '#fff'
                }}
              >
                <option value="">All Order Types</option>
                {orderTypes.map((type: string) => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
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
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner {
              animation: spin 1s linear infinite;
            }
          `}} />
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '60px 20px',
            minHeight: '400px'
          }}>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
            }} />
            <p style={{ 
              marginTop: '16px', 
              fontSize: '14px', 
              color: '#6b7280',
              fontWeight: 500
            }}>
              {filters.assigned === 'assigned' ? 'Loading assigned orders...' : 'Loading orders...'}
            </p>
          </div>
        </>
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
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Order Type</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Payment</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Delivery Charge</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Pickup</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Dropoff</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Driver</th>
                    <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Assigned At</th>
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
                      <select
                        value={pendingStatuses[o.id] || o.status || 'pending'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await updateStatus(o.id, newStatus);
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          border: '1px solid #d1d5db', 
                          fontSize: 12,
                          background: '#fff',
                          cursor: 'pointer',
                          minWidth: 120,
                          fontWeight: 500,
                          color: (pendingStatuses[o.id] || o.status) === 'delivered' ? '#065f46' :
                                 (pendingStatuses[o.id] || o.status) === 'cancelled' || (pendingStatuses[o.id] || o.status) === 'cancelled' ? '#991b1b' :
                                 (pendingStatuses[o.id] || o.status) === 'assigned' ? '#1e40af' :
                                 (pendingStatuses[o.id] || o.status) === 'accepted' ? '#166534' :
                                 (pendingStatuses[o.id] || o.status) === 'picked_up' ? '#92400e' :
                                 '#374151'
                        }}
                      >
                        {orderStatuses.map((status: string) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <select
                        value={pendingOrderTypes[o.id] || o.orderType || 'regular'}
                        onChange={async (e) => {
                          const newOrderType = e.target.value as 'regular' | 'subscription';
                          const previousValue = o.orderType || 'regular';
                          // Optimistically update UI
                          setPendingOrderTypes(prev => ({ ...prev, [o.id]: newOrderType }));
                          try {
                            await authedFetch(`/api/orders/${o.id}/order-type`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderType: newOrderType })
                            });
                            // Clear pending state and refetch
                            setPendingOrderTypes(prev => {
                              const updated = { ...prev };
                              delete updated[o.id];
                              return updated;
                            });
                            mutate();
                          } catch (error) {
                            // Revert on error
                            setPendingOrderTypes(prev => {
                              const updated = { ...prev };
                              delete updated[o.id];
                              return updated;
                            });
                            alert('Failed to update order type. Please try again.');
                            console.error('Update order type error:', error);
                          }
                        }}
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          border: '1px solid #d1d5db', 
                          fontSize: 12,
                          background: '#fff',
                          cursor: 'pointer',
                          minWidth: 100
                        }}
                      >
                        <option value="regular">Regular</option>
                        <option value="subscription">Subscription</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 14, color: '#111827' }}>
                        {o.paymentType || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                      {editingDeliveryCharge[o.id] ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={o.deliveryCharge || 0}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateDeliveryCharge(o.id, value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseFloat((e.target as HTMLInputElement).value) || 0;
                                updateDeliveryCharge(o.id, value);
                              } else if (e.key === 'Escape') {
                                setEditingDeliveryCharge(prev => {
                                  const updated = { ...prev };
                                  delete updated[o.id];
                                  return updated;
                                });
                              }
                            }}
                            autoFocus
                            style={{
                              width: 80,
                              padding: '4px 8px',
                              border: '1px solid #2563eb',
                              borderRadius: 4,
                              fontSize: 13,
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingDeliveryCharge(prev => ({ ...prev, [o.id]: true }))}
                          style={{
                            fontSize: 14,
                            color: '#111827',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid transparent',
                            display: 'inline-block',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                          title="Click to edit delivery charge"
                        >
                          ₹{parseFloat((o.deliveryCharge || 0).toString()).toFixed(2)}
                        </div>
                      )}
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
                      {o.assignedAt ? (
                        <span style={{ fontSize: 13, color: '#111827' }}>
                          {new Date(o.assignedAt).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>
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

