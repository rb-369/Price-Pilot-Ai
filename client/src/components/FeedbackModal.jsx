import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { submitFeedback } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineX, HiOutlineCheckCircle, HiOutlineStar } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const categories = [
    { id: 'pricing_accuracy', label: 'Pricing & Recommendations' },
    { id: 'ui_ux', label: 'Design & Navigation' },
    { id: 'feature_request', label: 'Feature Request' },
    { id: 'speed', label: 'Speed & Performance' },
    { id: 'general', label: 'General Experience' }
];

export default function FeedbackModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const location = useLocation();
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [category, setCategory] = useState('pricing_accuracy');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.error('Please provide a comment or suggestion');
            return;
        }

        setSubmitting(true);
        try {
            await submitFeedback({
                rating,
                category,
                comment: comment.trim(),
                pageUrl: location.pathname + location.search,
                name: user?.name,
                email: user?.email
            });
            setSubmitted(true);
            toast.success('Thank you for your feedback!');
            setTimeout(() => {
                setSubmitted(false);
                setComment('');
                setRating(5);
                onClose();
            }, 1800);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-lg rounded-2xl bg-[#0d1326] border border-indigo-500/20 shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                    aria-label="Close modal"
                >
                    <HiOutlineX size={20} />
                </button>

                {submitted ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-scale-up">
                            <HiOutlineCheckCircle size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Feedback Received!</h3>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            Thank you for helping us sharpen PricePilot AI. Your inputs go straight into our product roadmap.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                                User Feedback
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Share Your Experience</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                How can we make PricePilot AI more powerful for your store?
                            </p>
                        </div>

                        {/* Rating Stars */}
                        <div className="bg-[#131b2e] p-4 rounded-xl border border-slate-800 space-y-2">
                            <label className="block text-xs font-medium text-slate-300">
                                Overall Satisfaction Rating
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                                        aria-label={`${star} star`}
                                    >
                                        <HiOutlineStar 
                                            className={`w-7 h-7 transition-colors ${
                                                (hoverRating || rating) >= star 
                                                    ? 'text-amber-400 fill-amber-400' 
                                                    : 'text-slate-600'
                                            }`} 
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-xs font-semibold text-amber-400">
                                    {rating === 5 && 'Outstanding (5/5)'}
                                    {rating === 4 && 'Great (4/5)'}
                                    {rating === 3 && 'Average (3/5)'}
                                    {rating === 2 && 'Needs Work (2/5)'}
                                    {rating === 1 && 'Unsatisfactory (1/5)'}
                                </span>
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-300">
                                Feedback Topic
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-3 py-2 text-xs rounded-lg border text-left transition-all ${
                                            category === cat.id
                                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
                                                : 'bg-[#131b2e] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-slate-300">
                                Your Thoughts & Suggestions
                            </label>
                            <textarea
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What worked well, or what features would you like to see next?..."
                                className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !comment.trim()}
                                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {submitting ? 'Submitting...' : 'Send Feedback'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
