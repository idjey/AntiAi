'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to send reset code');
            }

            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to reset password');
            }

            setSuccessMsg('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />
            <div className="absolute inset-0 bg-grid opacity-20" />

            <div className="w-full max-w-md relative z-10">
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <svg className="w-5 h-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        antiai<span className="text-primary">.me</span>
                    </span>
                </Link>

                <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-card backdrop-blur-sm">
                    <h1 className="text-2xl font-bold text-center mb-2">
                        {step === 1 ? 'Reset your password' : 'Enter reset code'}
                    </h1>
                    <p className="text-text-secondary text-center text-sm mb-8">
                        {step === 1 ? 'Enter your email and we will send you a code' : 'Check your email for the 8-digit verification code'}
                    </p>

                    {successMsg && (
                        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm text-center">
                            {successMsg}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {!successMsg && step === 1 && (
                        <form className="space-y-4" onSubmit={handleSendCode}>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-2.5 mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mx-auto" />
                                ) : (
                                    'Send reset code'
                                )}
                            </button>
                        </form>
                    )}

                    {!successMsg && step === 2 && (
                        <form className="space-y-4" onSubmit={handleResetPassword}>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                    8-Digit Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono tracking-widest text-center"
                                    placeholder="12345678"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface-light border border-white/5 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-2.5 mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin mx-auto" />
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                            
                            <div className="text-center mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setStep(1)}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Didn't receive the code?
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-text-secondary">
                        Remember your password?{' '}
                        <Link href="/login" className="text-primary hover:text-primary-400 font-medium transition-colors">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
