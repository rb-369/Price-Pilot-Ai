import { useState } from 'react';
import { forgotPassword } from '../api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import finalLogo from '../assets/FINAL.svg';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword({ email });
            toast.success('Reset link generated!');
            setSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request password reset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-hidden">
            {/* Floating background orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="glass-card p-8 sm:p-10 w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-xl shadow-primary/25 animate-pulse-glow">
                        <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Reset Password</h1>
                    <p className="text-text-muted mt-2 text-sm">We'll help you recover access to your account</p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email Address</label>
                            <input 
                                type="email" 
                                className="input-field" 
                                placeholder="admin@ecom.ai"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-5 py-4">
                        <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/25 rounded-full flex items-center justify-center mx-auto text-primary-light">
                            <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                If an account exists for <span className="text-primary-light font-medium">{email}</span>, a password reset link has been dispatched.
                            </p>
                        </div>
                        <div className="pt-2 bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] rounded-xl p-3.5 text-xs text-text-muted leading-normal text-left">
                            <strong className="text-primary-light uppercase tracking-wider block mb-1 text-[10px]">Development Note:</strong>
                            No email server? The reset link has also been printed directly to the backend **server terminal log**! Copy it to proceed.
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <Link to="/login" className="text-sm text-primary-light font-semibold hover:text-primary transition-colors">
                        ← Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
