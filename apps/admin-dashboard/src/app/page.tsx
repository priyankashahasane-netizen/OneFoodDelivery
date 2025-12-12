"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { clearToken, authedFetch, getToken, isAdmin } from '../lib/auth';
import DriverAppModal from '../components/DriverAppModal';

const fetcher = async (url: string) => {
  try {
    const response = await authedFetch(url);
    return await response.json();
  } catch (error: any) {
    console.error('Fetcher error:', error);
    throw error;
  }
};

export default function Home() {
  const router = useRouter();
  // Initialize to false to avoid hydration mismatch (localStorage not available on server)
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [adminStatus, setAdminStatus] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [location, setLocation] = useState('Mumbai');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [fareForm, setFareForm] = useState({
    pickupAddress: '',
    dropAddress: '',
    name: '',
    phoneNumber: '',
    userType: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDriverAppModal, setShowDriverAppModal] = useState(false);

  const cities = [
    'Ahmedabad', 'Bangalore', 'Chandigarh', 'Chennai', 'Coimbatore',
    'Delhi', 'Hyderabad', 'Indore', 'Jaipur', 'Kanpur',
    'Kochi', 'Kolkata', 'Lucknow', 'Ludhiana', 'Mumbai',
    'Nagpur', 'Nashik', 'Pune', 'Surat', 'Trivandrum', 'Vadodara'
  ];

  const driverAppDownloadUrl =
    process.env.NEXT_PUBLIC_DRIVER_APP_URL ??
    'https://play.google.com/store/apps/details?id=com.sixamtech.stack_food_delivery';

  // Check token only on client-side after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setHasToken(!!getToken());
    setAdminStatus(isAdmin());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-selector-container')) {
        setIsLocationDropdownOpen(false);
      }
    };

    if (isLocationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isLocationDropdownOpen]);

  // Fetch data for statistics
  // Backend caps pageSize at 200; stay within that limit.
  const ordersKey = hasToken ? '/api/orders?pageSize=200' : null;
  const driversKey = hasToken ? '/api/drivers?page=1&pageSize=200' : null;
  // Restaurants API is optional/absent right now; skip to avoid 404 spam
  const restaurantsKey = null;
  const recentOrdersKey = hasToken ? '/api/orders?pageSize=10&sort=createdAt:desc' : null;

  const { data: ordersData, isLoading: ordersLoading } = useSWR(ordersKey, fetcher);
  const { data: driversData, isLoading: driversLoading } = useSWR(driversKey, fetcher);
  const { data: restaurantsData, isLoading: restaurantsLoading, error: restaurantsError } = useSWR(restaurantsKey, fetcher, {
    onError: () => {}, // Silently handle errors for optional endpoints
  });
  const { data: recentOrdersData } = useSWR(recentOrdersKey, fetcher);

  // Calculate statistics
  const stats = useMemo(() => {
    const orders = ordersData?.items || ordersData || [];
    const drivers = driversData?.items || driversData || [];
    const restaurants = restaurantsData?.items || restaurantsData || [];
    const recentOrders = recentOrdersData?.items || recentOrdersData || [];

    // Debug logging
    console.log('[Dashboard Stats] Orders data:', {
      hasOrdersData: !!ordersData,
      ordersCount: Array.isArray(orders) ? orders.length : 0,
      ordersDataStructure: ordersData ? Object.keys(ordersData) : 'no data',
      sampleOrder: Array.isArray(orders) && orders.length > 0 ? orders[0] : null
    });

    const now = new Date();
    let startDate: Date;
    
    if (timeRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    const filteredOrders = Array.isArray(orders) ? orders.filter((o: any) => {
      const orderDate = new Date(o.createdAt || o.created_at || 0);
      const isValidDate = !isNaN(orderDate.getTime());
      if (!isValidDate) {
        console.warn('[Dashboard Stats] Invalid order date:', o.createdAt || o.created_at, 'for order:', o.id);
        return false;
      }
      return orderDate >= startDate;
    }) : [];

    // If no orders match the date filter, show all orders instead (for better UX)
    const ordersToUse = filteredOrders.length > 0 ? filteredOrders : (Array.isArray(orders) ? orders : []);

    console.log('[Dashboard Stats] Filtered orders:', {
      timeRange,
      startDate: startDate.toISOString(),
      totalOrders: Array.isArray(orders) ? orders.length : 0,
      filteredCount: filteredOrders.length,
      usingAllOrders: filteredOrders.length === 0 && Array.isArray(orders) && orders.length > 0
    });

    const totalOrders = ordersToUse.length;
    const pendingOrders = ordersToUse.filter((o: any) => 
      ['created', 'pending', 'assigned', 'accepted'].includes(o.status)
    ).length;
    const deliveredOrders = ordersToUse.filter((o: any) => 
      o.status === 'delivered'
    ).length;
    
    const totalRevenue = ordersToUse
      .filter((o: any) => o.status === 'delivered')
      .reduce((sum: number, o: any) => {
        const charge = parseFloat(o.deliveryCharge || o.delivery_charge || 0);
        return sum + (isNaN(charge) ? 0 : charge);
      }, 0);

    const onlineDrivers = Array.isArray(drivers) ? drivers.filter((d: any) => d.online).length : 0;
    const totalDrivers = Array.isArray(drivers) ? drivers.length : 0;
    // Count unique restaurants from orders if restaurants endpoint doesn't exist
    const totalRestaurants = Array.isArray(restaurants) && restaurants.length > 0 
      ? restaurants.length 
      : (Array.isArray(orders) 
          ? new Set(orders.map((o: any) => o.restaurantId || o.restaurant_id).filter(Boolean)).size 
          : 0);

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: totalRevenue.toFixed(2),
      onlineDrivers,
      totalDrivers,
      totalRestaurants,
      recentOrders: Array.isArray(recentOrders) ? recentOrders.slice(0, 5) : [],
    };
  }, [ordersData, driversData, restaurantsData, recentOrdersData, timeRange]);

  const handleLogout = () => {
    clearToken();
    setHasToken(false);
    router.push('/');
  };

  const handleFareFormChange = (field: string, value: string) => {
    setFareForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGetFareEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // TODO: Implement fare estimate API call
      // For now, redirect to create order page with pre-filled data
      const params = new URLSearchParams({
        pickup: fareForm.pickupAddress,
        drop: fareForm.dropAddress,
        name: fareForm.name,
        phone: fareForm.phoneNumber,
        userType: fareForm.userType,
      });
      router.push(`/orders/create?${params.toString()}`);
    } catch (error) {
      console.error('Error getting fare estimate:', error);
      alert('Failed to get fare estimate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      created: '#3b82f6',
      pending: '#f59e0b',
      assigned: '#8b5cf6',
      accepted: '#10b981',
      confirmed: '#10b981',
      processing: '#06b6d4',
      handover: '#6366f1',
      picked_up: '#8b5cf6',
      in_transit: '#3b82f6',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refund_requested: '#f59e0b',
      refunded: '#6b7280',
    };
    return statusColors[status] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Allow admins to see dashboard controls even when there are no orders yet.
  // If there are zero orders, we still surface the dashboard so they can start
  // onboarding drivers/restaurants instead of seeing an empty shell.
  const ordersList = ordersData?.items || ordersData || [];
  const hasOrders = Array.isArray(ordersList) && ordersList.length > 0;
  // Show dashboard for any logged-in user; adminStatus is best-effort
  const canShowAdminExperience = mounted && hasToken;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src="/oneCRM-logo.png"
            alt="OneCRM Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
            OneDelivery
          </h1>
        </div>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(!mounted || !hasToken) && (
            <>
              <Link 
                href="https://onebiz.cubeone.in/products/onedelivery"
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#111827',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                For Enterprise
              </Link>
              <button
                type="button"
                onClick={() => setShowDriverAppModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#111827',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Driver Partner
              </button>
            </>
          )}
          {canShowAdminExperience && (
            <>
              <button
                type="button"
                onClick={() => setShowDriverAppModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                Driver Partner
              </button>
              <Link 
                href="/orders"
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                Orders
              </Link>
              <Link 
                href="/restaurants"
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                Restaurants
              </Link>
              <Link 
                href="/drivers"
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                Drivers
              </Link>
            </>
          )}
          {mounted && hasToken ? (
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Logout
            </button>
          ) : (
            <Link 
              href="/login"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Login
            </Link>
          )}
        </nav>
        <DriverAppModal
          open={showDriverAppModal}
          downloadUrl={driverAppDownloadUrl}
          onClose={() => setShowDriverAppModal(false)}
        />
      </header>

      <main style={{ padding: 0, maxWidth: '1000%', margin: 0 }}>
          {/* Public Sections - Only visible when NOT logged in */}
          {/* Show public sections if: not mounted yet (initial render) OR mounted and no token */}
          {(!mounted || !hasToken) && (
            <>
          {/* Hero Section */}
          <section style={{
            position: 'relative',
            minHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: 'url(/website_background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}>
            {/* Dark Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
            }} />

            {/* Hero Content Container */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1200,
              width: '100%',
              padding: '0 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* Hero Text Content */}
              <div style={{
                textAlign: 'center',
                marginBottom: 60,
                marginTop: 'auto',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '40px 32px',
                borderRadius: 12,
                maxWidth: 1000,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                {/* Title */}
                <h1 style={{
                  margin: '0 0 16px 0',
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}>
                  OneDelivery - Last-Mile Delivery <br />Management Platform
                </h1>

                {/* Subtitle */}
                <p style={{
                  margin: '0 0 24px 0',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  color: '#ffffff',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  maxWidth: 900,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}>
                  Streamline your delivery operations with intelligent route optimization <br />and real-time fleet management
                </p>

              </div>

              {/* Location Selector and Fare Form */}
              <div id="fare-form-section" style={{
                width: '100%',
                marginBottom: 40,
              }}>
              {/* Location Selector */}
              <div style={{
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'flex-start',
              }}>
                <div className="location-selector-container" style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    style={{
                      background: '#ffffff',
                      padding: '12px 20px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      userSelect: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <span style={{ fontSize: 18 }}>📍</span>
                    <span style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{location}</span>
                    <span style={{ 
                      fontSize: 14, 
                      color: '#6b7280',
                      transform: isLocationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>▼</span>
                  </div>
                  
                  {/* Dropdown Menu */}
                  {isLocationDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 8,
                      background: '#ffffff',
                      borderRadius: 8,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      minWidth: 200,
                      maxHeight: 300,
                      overflowY: 'auto',
                      zIndex: 1000,
                      border: '1px solid #e5e7eb',
                    }}>
                      {cities.map((city) => (
                        <div
                          key={city}
                          onClick={() => {
                            setLocation(city);
                            setIsLocationDropdownOpen(false);
                          }}
                          style={{
                            padding: '12px 20px',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: location === city ? '#3b82f6' : '#111827',
                            fontWeight: location === city ? 600 : 400,
                            background: location === city ? '#eff6ff' : 'transparent',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (location !== city) {
                              e.currentTarget.style.background = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (location !== city) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fare Estimate Form */}
              <form onSubmit={handleGetFareEstimate} style={{
                background: '#ffffff',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-end',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flexWrap: 'wrap',
              }}>
                {/* Pickup Address */}
                <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#111827',
                  }}>
                    Pickup Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fareForm.pickupAddress}
                    onChange={(e) => handleFareFormChange('pickupAddress', e.target.value)}
                    placeholder="Enter Pickup Location"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      color: '#111827',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="form-divider" style={{
                  width: 1,
                  height: 60,
                  background: '#e5e7eb',
                  alignSelf: 'flex-end',
                  marginBottom: 8,
                }} />

                {/* Drop Address */}
                <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#111827',
                  }}>
                    Drop Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fareForm.dropAddress}
                    onChange={(e) => handleFareFormChange('dropAddress', e.target.value)}
                    placeholder="Enter Drop Location"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      color: '#111827',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="form-divider" style={{
                  width: 1,
                  height: 60,
                  background: '#e5e7eb',
                  alignSelf: 'flex-end',
                  marginBottom: 8,
                }} />

                {/* Name */}
                <div style={{ flex: '1 1 150px', minWidth: 150 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#111827',
                  }}>
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fareForm.name}
                    onChange={(e) => handleFareFormChange('name', e.target.value)}
                    placeholder="Enter Name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      color: '#111827',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="form-divider" style={{
                  width: 1,
                  height: 60,
                  background: '#e5e7eb',
                  alignSelf: 'flex-end',
                  marginBottom: 8,
                }} />

                {/* Phone Number */}
                <div style={{ flex: '1 1 150px', minWidth: 150 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#111827',
                  }}>
                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={fareForm.phoneNumber}
                    onChange={(e) => handleFareFormChange('phoneNumber', e.target.value)}
                    placeholder="Enter Mobile"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      color: '#111827',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="form-divider" style={{
                  width: 1,
                  height: 60,
                  background: '#e5e7eb',
                  alignSelf: 'flex-end',
                  marginBottom: 8,
                }} />

                {/* User Type */}
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#111827',
                  }}>
                    What best describes you? <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={fareForm.userType}
                    onChange={(e) => handleFareFormChange('userType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      color: fareForm.userType ? '#111827' : '#9ca3af',
                      background: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '40px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <option value="">Click To Choose</option>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                {/* Get Fare Estimate Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    opacity: isSubmitting ? 0.7 : 1,
                    height: 'fit-content',
                    alignSelf: 'flex-end',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.background = '#3b82f6';
                    }
                  }}
                >
                  Get Fare Estimate
                  <span style={{ fontSize: 18 }}>→</span>
                </button>
              </form>
              </div>
            </div>
          </section>

          {/* We Are Transforming Cities Section */}
          <section style={{
            background: '#ffffff',
            padding: '80px 24px',
            maxWidth: 1400,
            margin: '0 auto',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.5px',
              }}>
                WE ARE TRANSFORMING CITIES
              </h2>
              <p style={{
                margin: 0,
                fontSize: 'clamp(16px, 2vw, 18px)',
                color: '#4b5563',
                lineHeight: 1.7,
                maxWidth: 900,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                Our business is growing by the minute! We are now present in 21+ cities and have an extensive fleet base of more than 7.5L driver-partners! We have established ourselves as a trusted goods transportation service provider for big or small businesses, eCommerce merchants, supermarkets, Kirana store owners and many more for their business goods transportation services. Our loyal customers across 21+ cities serve as a testament of our top notch service and ever expanding presence.
              </p>
            </div>

            {/* Cities Horizontal Slider */}
            <style dangerouslySetInnerHTML={{__html: `
              .cities-slider::-webkit-scrollbar {
                height: 8px;
              }
              .cities-slider::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              .cities-slider::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .cities-slider::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}} />
            <div className="cities-slider" style={{
              display: 'flex',
              gap: 24,
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '20px 0',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
            }}>
              {/* Cities in horizontal row */}
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Ahmedabad"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>AHMEDABAD</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Bangalore"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>BANGALORE</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Chandigarh"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>CHANDIGARH</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Chennai"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>CHENNAI</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Coimbatore"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>COIMBATORE</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Hyderabad"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>HYDERABAD</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Delhi"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>DELHI</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Indore"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>INDORE</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Kanpur"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>KANPUR</p>
              </div>

              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Jaipur"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>JAIPUR</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Kochi"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>KOCHI</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Lucknow"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>LUCKNOW</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Kolkata"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>KOLKATA</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Ludhiana"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>LUDHIANA</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Mumbai"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>MUMBAI</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Nagpur"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>NAGPUR</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Nashik"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>NASHIK</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Pune"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>PUNE</p>
              </div>

              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Surat"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>SURAT</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Trivandrum"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>TRIVANDRUM</p>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, width: 160 }}>
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <Image
                    src="https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=400&fit=crop&auto=format&q=80"
                    alt="Vadodara"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>VADODARA</p>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section style={{
            background: '#f9fafb',
            padding: '80px 24px',
            maxWidth: 1400,
            margin: '0 auto',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{
                margin: 0,
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.5px',
              }}>
                Our Services
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 32,
            }}>
              {/* Feature 1 */}
              <div style={{
                background: '#ffffff',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  fontSize: 28,
                }}>
                  🗺️
                </div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Intelligent Route Optimization
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}>
                  Integration for multi-stop delivery sequencing, reducing delivery time
                </p>
              </div>

              {/* Feature 2 */}
              <div style={{
                background: '#ffffff',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  fontSize: 28,
                }}>
                  📍
                </div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Real-Time Tracking
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}>
                  Live GPS tracking with customer-facing web pages for transparency and better customer experience
                </p>
              </div>

              {/* Feature 3 */}
              <div style={{
                background: '#ffffff',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  fontSize: 28,
                }}>
                  📦
                </div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Multi-Order Stacking
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}>
                  Efficiently manage multiple concurrent deliveries with capacity constraints and dynamic route updates
                </p>
              </div>

              {/* Feature 4 */}
              <div style={{
                background: '#ffffff',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#fce7f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  fontSize: 28,
                }}>
                  📊
                </div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Comprehensive Admin Dashboard
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}>
                  Monitor fleet, handle exceptions, manage drivers, and access analytics from a single interface
                </p>
              </div>

              {/* Feature 5 */}
              <div style={{
                background: '#ffffff',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  fontSize: 28,
                }}>
                  🔗
                </div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Third-Party Integration
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}>
                  Seamless webhook ingestion from major platforms for automated order processing
                </p>
              </div>

              {/* Feature 6 */}
              <div style={{
                background: '#ffffff',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  fontSize: 28,
                }}>
                  ⚡
                </div>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Scalable Architecture
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 15,
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}>
                  Built with modern tech stack
                </p>
              </div>
            </div>
          </section>
          </>
          )}

          {/* Dashboard Content - Only visible when logged in as admin */}
          {canShowAdminExperience && (
          <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            <style dangerouslySetInnerHTML={{__html: `
              @media (max-width: 768px) {
                .form-divider {
                  display: none !important;
                }
                form > div {
                  flex: 1 1 100% !important;
                  min-width: 100% !important;
                }
                button[type="submit"] {
                  width: 100% !important;
                  justify-content: center !important;
                }
              }
            `}} />
            {/* Time Range Selector */}
          <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: timeRange === range ? '#111827' : '#ffffff',
                  color: timeRange === range ? '#ffffff' : '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (timeRange !== range) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (timeRange !== range) {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
            marginBottom: 32,
          }}>
            {/* Total Orders Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>
                    Total Orders
                  </p>
                  <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#111827' }}>
                    {ordersLoading ? '...' : stats.totalOrders}
                  </h2>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Pending</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>
                    {ordersLoading ? '...' : stats.pendingOrders}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Delivered</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#10b981' }}>
                    {ordersLoading ? '...' : stats.deliveredOrders}
                  </p>
                </div>
              </div>
            </div>

          

            {/* Drivers Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>
                    Drivers
                  </p>
                  <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#111827' }}>
                    {driversLoading ? '...' : stats.totalDrivers}
                  </h2>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Online</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#10b981' }}>
                    {driversLoading ? '...' : stats.onlineDrivers}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Offline</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#6b7280' }}>
                    {driversLoading ? '...' : stats.totalDrivers - stats.onlineDrivers}
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurants Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280', fontWeight: 500, marginBottom: 8 }}>
                    Restaurants
                  </p>
                  <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#111827' }}>
                    {restaurantsLoading ? '...' : stats.totalRestaurants}
                  </h2>
                </div>
              </div>
              <p style={{ margin: 0, marginTop: 16, fontSize: 12, color: '#6b7280' }}>
                Active restaurants
              </p>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: 20,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
                Recent Orders
              </h2>
              <Link
                href="/orders"
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#3b82f6',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                View All →
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Order Ref
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Payment
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Driver
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                        {ordersLoading ? 'Loading...' : 'No recent orders'}
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((order: any) => (
                      <tr key={order.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <Link
                            href={`/orders?ref=${order.ref || order.id}`}
                            style={{
                              color: '#3b82f6',
                              textDecoration: 'none',
                              fontWeight: 500,
                              fontSize: 14,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {order.ref || order.id}
                          </Link>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            background: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status),
                          }}>
                            {order.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                          {order.paymentType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>
                          {order.driverName || order.driver?.name || 'Unassigned'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#6b7280' }}>
                          {formatDate(order.createdAt || order.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#111827' }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}>
              <Link
                href="/orders/create"
                style={{
                  display: 'block',
                  padding: 20,
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  Create Order
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  Add a new order manually
                </p>
              </Link>

              <Link
                href="/drivers?create=1"
                style={{
                  display: 'block',
                  padding: 20,
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>🚲</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  Add Driver
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  Open driver form to onboard
                </p>
              </Link>

              <Link
                href="/restaurants"
                style={{
                  display: 'block',
                  padding: 20,
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>🍽️</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  Add Restaurant
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  Go to restaurant management
                </p>
              </Link>
            </div>
          </div>
          </div>
          )}
        </main>

      </div>
  );
}

