import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sendOtp } from '../api';

export default function LoginPhone() {
    const { theme } = useTheme();
    const finalLogo = theme === 'dark' ? newDarkLogo : newLightLogo;
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { loginWithPhone } = useAuth();
    // TODO: Replace with your actual backend/OTP provider call
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendOtp({ phone });
            toast.success('OTP sent!');
            setOtpSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // TODO: Replace with your actual backend OTP verification call
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginWithPhone(phone, otp);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-x-hidden overflow-y-auto">
            {/* Floating orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="glass-card p-8 sm:p-10 w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 p-2.5 rounded-2xl overflow-hidden mb-5 shadow-xl shadow-primary/25 animate-pulse-glow">
                        <img src={finalLogo} alt="PricePilot AI" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text tracking-tight">Sign In with Phone</h1>
                    <p className="text-text-muted mt-2 text-sm">
                        {otpSent ? 'Enter the code we sent you' : 'We’ll text you a one-time code'}
                    </p>
                </div>

                {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="e.g. +91 1234567890"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                autoComplete="tel"
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
                                'Send OTP'
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="input-field tracking-widest text-center"
                                placeholder="••••••"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
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
                                'Verify & Sign In'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="w-full text-center text-xs text-text-muted hover:text-primary transition-colors"
                        >
                            Change phone number
                        </button>
                    </form>
                )}

                <p className="text-center text-text-muted text-sm mt-6">
                    Prefer email?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">
                        Sign in with email
                    </Link>
                </p>
            </div>
        </div>
    );
}