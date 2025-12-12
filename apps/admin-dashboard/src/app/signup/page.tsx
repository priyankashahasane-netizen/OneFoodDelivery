"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!firstName || !lastName || !email || !mobile || !password || !passwordConfirmation) {
      setError('All fields are required');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Mobile validation (should be 10 digits, optionally with country code)
    const mobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
    const cleanMobile = mobile.replace(/\s+/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      setError('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      // Format mobile number for CubeOne (91<mobile>)
      let formattedMobile = cleanMobile;
      if (formattedMobile.startsWith('+91')) {
        formattedMobile = formattedMobile.substring(1);
      } else if (!formattedMobile.startsWith('91')) {
        formattedMobile = `91${formattedMobile}`;
      }

      const result = await signup({
        email,
        mobile: formattedMobile,
        password,
        password_confirmation: passwordConfirmation,
        first_name: firstName,
        last_name: lastName,
      });

      if (result?.ok || result?.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result?.message || result?.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ 
      display: 'grid', 
      placeItems: 'center', 
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: 500, 
        background: '#ffffff',
        padding: 32,
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 700, color: '#111827' }}>
          Admin Sign Up
        </h1>
        <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#6b7280' }}>
          Create a new admin account
        </p>
        
        {success && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#f0fdf4', 
            border: '1px solid #86efac',
            borderRadius: 8,
            color: '#166534',
            fontSize: 14,
            marginBottom: 24
          }}>
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 14, 
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading || success}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: (loading || success) ? 0.6 : 1,
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
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading || success}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    opacity: (loading || success) ? 0.6 : 1,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontSize: 14, 
                fontWeight: 500,
                color: '#374151'
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: (loading || success) ? 0.6 : 1,
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
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="Enter mobile number (e.g., 9876543210)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                disabled={loading || success}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: (loading || success) ? 0.6 : 1,
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
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: (loading || success) ? 0.6 : 1,
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
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                disabled={loading || success}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: (loading || success) ? 0.6 : 1,
                }}
              />
            </div>

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
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: (loading || success) ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: (loading || success) ? 'not-allowed' : 'pointer',
                height: 44,
              }}
            >
              {loading ? 'Creating Account…' : success ? 'Account Created!' : 'Sign Up'}
            </button>

            <div style={{ 
              textAlign: 'center', 
              marginTop: 8,
              fontSize: 14,
              color: '#6b7280'
            }}>
              Already have an account?{' '}
              <a 
                href="/login" 
                style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                Sign In
              </a>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

