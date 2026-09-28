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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F7F3EB] dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#594239] shadow-2xl p-5 sm:p-8 text-text"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-copper to-accent" />

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
                        <h3 className="text-xl font-bold text-text tracking-tight">Feedback Received!</h3>
                        <p className="text-text-muted text-sm max-w-xs mx-auto">
                            Thank you for helping us sharpen PricePilot AI. Your inputs go straight into our product roadmap.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-2">
                                User Feedback
                            </div>
                            <h2 className="text-xl font-bold text-text tracking-tight">Share Your Experience</h2>
                            <p className="text-xs text-text-muted mt-1">
                                How can we make PricePilot AI more powerful for your store?
                            </p>
                        </div>

                        {/* Rating Stars */}
                        <div className="bg-surface p-4 rounded-xl border border-border space-y-2">
                            <label className="block text-xs font-medium text-text">
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
                                        className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                                        aria-label={`${star} star`}
                                    >
                                        <HiOutlineStar 
                                            className={`w-7 h-7 transition-colors ${
                                                (hoverRating || rating) >= star 
                                                    ? 'text-amber-500 fill-amber-500' 
                                                    : 'text-border'
                                            }`} 
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-xs font-semibold text-warning">
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
                            <label className="block text-xs font-medium text-text">
                                Feedback Topic
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-3 py-2 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                                            category === cat.id
                                                ? 'bg-primary/15 border-primary text-primary font-semibold shadow-sm'
                                                : 'bg-surface border-border text-text-muted hover:border-primary/40 hover:text-text'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-text">
                                Your Thoughts &amp; Suggestions
                            </label>
                            <textarea
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What worked well, or what features would you like to see next?..."
                                className="w-full px-3.5 py-2.5 bg-[#FBF8F1] dark:bg-[#382821] border border-[#D8D0C0] dark:border-[#594239] rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                required
                            />
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
                                disabled={submitting || !comment.trim()}
                                className="btn-primary py-2 px-5 text-xs font-semibold cursor-pointer"
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
