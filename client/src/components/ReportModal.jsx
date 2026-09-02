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
    { id: 'low', label: 'Low', color: 'border-slate-300 text-slate-700 bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:bg-slate-800/40' },
    { id: 'medium', label: 'Medium', color: 'border-amber-400 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/10' },
    { id: 'high', label: 'High', color: 'border-orange-400 text-orange-700 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-500/10' },
    { id: 'critical', label: 'Critical', color: 'border-red-400 text-red-700 bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:bg-red-500/10' }
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0d1326] border border-slate-200 dark:border-red-500/20 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top indicator bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    aria-label="Close modal"
                >
                    <HiOutlineX size={20} />
                </button>

                {submitted ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 animate-scale-up">
                            <HiOutlineCheckCircle size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Report Logged!</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs mx-auto">
                            Our engineering team has received your report and relevant route diagnostics.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 mb-2">
                                <HiOutlineExclamationCircle size={14} />
                                Diagnostics &amp; Issue Tracker
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Report an Issue</h2>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Notice a bug or pricing data mismatch on this page? Let us know so we can fix it immediately.
                            </p>
                        </div>

                        {/* Issue Type */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                                                ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-500/15 dark:border-red-500/50 dark:text-red-300 font-semibold'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:bg-[#131b2e] dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Severity */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                                                ? `${s.color} ring-1 ring-offset-1 ring-current font-bold`
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-[#131b2e] dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Summary Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Brief summary of the issue..."
                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Detailed Description
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Steps to reproduce, expected behavior, or error details..."
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Route telemetry pill */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="truncate">Route Diagnostics: <strong className="font-mono text-slate-800 dark:text-slate-300">{location.pathname}</strong></span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500">Auto-Attached</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !title.trim() || !description.trim()}
                                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg shadow-md hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
