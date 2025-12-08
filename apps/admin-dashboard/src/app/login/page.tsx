"use client";

import { useState } from 'react';
import { setToken, setAdminStatus } from '../../lib/auth';
import { requestOtp, loginWithPassword, loginWithOtp } from '../../lib/api';

type LoginMethod = 'password' | 'otp';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  
  // Password login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpRequesting, setOtpRequesting] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password login
  async function handlePasswordLogin() {
    setLoading(true);
    setError('');
    try {
      const data = await loginWithPassword(username, password);
      if (!data?.ok) {
        setError(data.message || 'Invalid credentials');
      } else {
        setToken(data.access_token);
        setAdminStatus(data.isAdmin ?? false);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  // Request OTP
  async function handleRequestOtp() {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    
    setOtpRequesting(true);
    setError('');
    try {
      const result = await requestOtp(phone);
      if (result.ok) {
        setOtpSent(true);
        setError('');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setOtpRequesting(false);
    }
  }

  // OTP login
  async function handleOtpLogin() {
    if (!phone || !otp) {
      setError('Please enter phone number and OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await loginWithOtp(phone, otp);
      if (!data?.ok) {
        setError(data.message || 'Login failed');
      } else {
        setToken(data.access_token);
        setAdminStatus(data.isAdmin ?? false);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'password') {
      handlePasswordLogin();
    } else {
      if (!otpSent) {
        handleRequestOtp();
      } else {
        handleOtpLogin();
      }
    }
  };

  return (
    <main style={{ 
      display: 'grid', 
      placeItems: 'center', 
      height: '100vh',
      background: '#f9fafb'
    }}>
      <div style={{ 
        width: 400, 
        background: '#ffffff',
        padding: 32,
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: '#111827' }}>
          Admin Login
        </h1>
        
        {/* Login Method Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 24,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password');
              setError('');
              setOtpSent(false);
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: loginMethod === 'password' ? '2px solid #3b82f6' : '2px solid transparent',
              color: loginMethod === 'password' ? '#3b82f6' : '#6b7280',
              fontWeight: loginMethod === 'password' ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('otp');
              setError('');
              setOtpSent(false);
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: loginMethod === 'otp' ? '2px solid #3b82f6' : '2px solid transparent',
              color: loginMethod === 'otp' ? '#3b82f6' : '#6b7280',
              fontWeight: loginMethod === 'otp' ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            OTP
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 16 }}>
            {loginMethod === 'password' ? (
              <>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontSize: 14, 
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontSize: 14, 
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontSize: 14, 
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={otpSent}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      opacity: otpSent ? 0.6 : 1,
                    }}
                  />
                </div>
                {otpSent && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontSize: 14, 
                      fontWeight: 500,
                      color: '#374151'
                    }}>
                      OTP
                    </label>
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <div style={{ 
                padding: '12px 16px', 
                background: '#fef2f2', 
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: 14
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpRequesting}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: loading || otpRequesting ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading || otpRequesting ? 'not-allowed' : 'pointer',
                height: 44,
              }}
            >
              {loading 
                ? 'Signing in…' 
                : otpRequesting 
                ? 'Sending OTP…' 
                : loginMethod === 'password' 
                ? 'Sign In' 
                : otpSent 
                ? 'Verify & Login' 
                : 'Send OTP'}
            </button>

            {loginMethod === 'otp' && otpSent && (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Change Phone Number
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}



