'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_URL;

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${base}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${base}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid OTP');
      }
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to reset password');
      }
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">MIS-ILSMS</h1>
          <p className="text-muted-foreground mt-1">Reset Your Password</p>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s
                      ? 'bg-primary text-primary-foreground'
                      : ['otp', 'password'].includes(step) && s === 'email'
                      ? 'bg-primary/30 text-primary'
                      : step === 'password' && s === 'otp'
                      ? 'bg-primary/30 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your email address and we&apos;ll send you an OTP to reset your password.
              </p>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="your@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                An OTP has been sent to <strong>{email}</strong>. Check the server console logs for the OTP (email service is currently disabled).
              </p>
              <label className="block text-sm font-medium mb-1">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 border rounded-md bg-background text-center text-lg tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* Step 3: Enter New Password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new password for your account.
              </p>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Repeat new password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Password Reset Successful!</h2>
            <p className="text-muted-foreground text-sm">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 text-center"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
