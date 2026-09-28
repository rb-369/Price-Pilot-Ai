import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { submitReport } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineX, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const reportTypes = [
    { id: 'bug', label: 'Bug / Broken UI' },
    { id: 'data_error', label: 'Incorrect Price / Data' },
    { id: 'ui_issue', label: 'Layout / Display Glitch' },
    { id: 'performance', label: 'Slow Loading / Timeout' },
    { id: 'other', label: 'Other Issue' }
];

const severityLevels = [
    { id: 'low', label: 'Low', color: 'border-border text-text-muted bg-surface' },
    { id: 'medium', label: 'Medium', color: 'border-warning/30 text-warning bg-warning/10' },
    { id: 'high', label: 'High', color: 'border-warning/50 text-warning bg-warning/15' },
    { id: 'critical', label: 'Critical', color: 'border-danger/40 text-danger bg-danger/10' }
];

export default function ReportModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const location = useLocation();
    const [type, setType] = useState('bug');
    const [severity, setSeverity] = useState('medium');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            toast.error('Please fill out all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const systemInfo = {
                userAgent: navigator.userAgent,
                screenResolution: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: new Date().toISOString()
            };

            await submitReport({
                type,
                severity,
                title: title.trim(),
                description: description.trim(),
                pageUrl: location.pathname + location.search,
                systemInfo,
                name: user?.name,
                email: user?.email
            });
            setSubmitted(true);
            toast.success('Report submitted successfully');
            setTimeout(() => {
                setSubmitted(false);
                setTitle('');
                setDescription('');
                onClose();
            }, 1800);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="relative w-full max-w-lg rounded-2xl bg-[#F7F3EB] dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#594239] shadow-2xl p-6 sm:p-8 text-text overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top indicator bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danger via-warning to-primary" />

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-lighter transition-colors"
                    aria-label="Close modal"
                >
                    <HiOutlineX size={20} />
                </button>

                {submitted ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success animate-scale-up">
                            <HiOutlineCheckCircle size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-text tracking-tight">Report Logged!</h3>
                        <p className="text-text-muted text-sm max-w-xs mx-auto">
                            Our engineering team has received your report and relevant route diagnostics.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-danger/10 text-danger border border-danger/20 mb-2">
                                <HiOutlineExclamationCircle size={14} />
                                Diagnostics &amp; Issue Tracker
                            </div>
                            <h2 className="text-xl font-bold text-text tracking-tight">Report an Issue</h2>
                            <p className="text-xs text-text-muted mt-1">
                                Notice a bug or pricing data mismatch on this page? Let us know so we can fix it immediately.
                            </p>
                        </div>

                        {/* Issue Type */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text">
                                Issue Category
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {reportTypes.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setType(t.id)}
                                        className={`px-3 py-2 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                                            type === t.id
                                                ? 'bg-danger/10 border-danger/40 text-danger font-semibold'
                                                : 'bg-surface border-border text-text-muted hover:border-danger/30 hover:text-text'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Severity */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text">
                                Severity Level
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {severityLevels.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setSeverity(s.id)}
                                        className={`px-2.5 py-1.5 text-xs text-center rounded-lg border font-medium transition-all cursor-pointer ${
                                            severity === s.id
                                                ? `${s.color} ring-1 ring-current font-bold`
                                                : 'bg-surface border-border text-text-muted hover:border-border/80'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text">
                                Summary Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Brief summary of the issue..."
                                className="w-full px-3.5 py-2 bg-[#FBF8F1] dark:bg-[#382821] border border-[#D8D0C0] dark:border-[#594239] rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text">
                                Detailed Description
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Steps to reproduce, expected behavior, or error details..."
                                className="w-full px-3.5 py-2.5 bg-[#FBF8F1] dark:bg-[#382821] border border-[#D8D0C0] dark:border-[#594239] rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Route telemetry pill */}
                        <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between text-[11px] text-text-muted">
                            <span className="truncate">Route Diagnostics: <strong className="font-mono text-text">{location.pathname}</strong></span>
                            <span className="text-[10px] text-text-muted">Auto-Attached</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary py-2 px-4 text-xs font-medium cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !title.trim() || !description.trim()}
                                className="btn-primary py-2 px-5 text-xs font-semibold cursor-pointer"
                            >
                                {submitting ? 'Submitting...' : 'Submit Issue Report'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
