import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import {
    HiOutlineSearch,
    HiOutlineX,
    HiOutlineCube,
    HiOutlineTrendingUp,
    HiOutlineScale,
    HiOutlineLightBulb,
    HiOutlineBell,
    HiOutlineBeaker,
    HiOutlineCog,
    HiOutlineSparkles,
    HiOutlineArrowRight
} from 'react-icons/hi';

const QUICK_ROUTES = [
    { label: 'Products Catalog', path: '/dashboard/products', icon: HiOutlineCube, color: 'text-primary' },
    { label: 'AI Recommendations', path: '/dashboard/recommendations', icon: HiOutlineLightBulb, color: 'text-[#A17A3A] dark:text-[#E8B052]' },
    { label: 'Demand Forecasts', path: '/dashboard/forecasts', icon: HiOutlineTrendingUp, color: 'text-[#33714A] dark:text-[#78B08B]' },
    { label: 'Competitor Intel', path: '/dashboard/competitors', icon: HiOutlineScale, color: 'text-[#B8734F] dark:text-[#C97B59]' },
    { label: 'Alerts & Incidents', path: '/dashboard/alerts', icon: HiOutlineBell, color: 'text-danger' },
    { label: 'A/B Price Tests', path: '/dashboard/ab-tests', icon: HiOutlineBeaker, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Store Settings', path: '/dashboard/settings', icon: HiOutlineCog, color: 'text-text-muted' },
];

export default function MobileSearchModal({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 100);
            if (products.length === 0) {
                setLoading(true);
                getProducts()
                    .then(res => setProducts(res.data.data || res.data || []))
                    .catch(() => {})
                    .finally(() => setLoading(false));
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredProducts = query.trim()
        ? products.filter(p =>
            p.name?.toLowerCase().includes(query.toLowerCase()) ||
            p.sku?.toLowerCase().includes(query.toLowerCase()) ||
            p.category?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6)
        : [];

    const filteredRoutes = query.trim()
        ? QUICK_ROUTES.filter(r => r.label.toLowerCase().includes(query.toLowerCase()))
        : QUICK_ROUTES.slice(0, 4);

    const handleSelectRoute = (path) => {
        navigate(path);
        onClose();
    };

    const handleSelectProduct = (product) => {
        navigate('/dashboard/products');
        onClose();
    };

    const handleAskAICopilot = (prompt) => {
        onClose();
        window.dispatchEvent(new CustomEvent('open_explain_with_ai', {
            detail: {
                title: 'Search Query',
                prompt: prompt || `Analyze catalog insights for: ${query}`,
                autoSubmit: true
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-[#241812]/70 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
            {/* Backdrop click to dismiss */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Dialog Card */}
            <div className="relative z-10 w-full max-w-xl mx-auto mt-4 sm:mt-16 p-3 sm:p-5 flex flex-col max-h-[90vh]">
                <div className="bg-[#FBF8F1] dark:bg-[#271C16] border border-[#D8D0C0] dark:border-[#4D372E] rounded-3xl shadow-[0_25px_60px_rgba(60,35,20,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col text-text transition-colors">
                    {/* Top Search Input Row */}
                    <div className="p-3.5 border-b border-[#D8D0C0] dark:border-[#4D372E] bg-[#F7F3EB]/90 dark:bg-[#211610]/80 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <HiOutlineSearch size={18} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find any product, forecast or alert..."
                            className="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none font-medium"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="p-1.5 text-text-muted hover:text-text rounded-lg transition-colors cursor-pointer"
                                title="Clear"
                            >
                                <HiOutlineX size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-2.5 py-1 rounded-xl bg-[#EDE8DD] hover:bg-[#E2DCCE] dark:bg-[#382821] dark:hover:bg-[#463229] border border-[#D8D0C0] dark:border-[#594239] text-xs font-semibold text-text-secondary hover:text-text transition-colors cursor-pointer"
                        >
                            Esc
                        </button>
                    </div>

                    {/* Results Container */}
                    <div className="overflow-y-auto p-4 space-y-4 max-h-[60vh] custom-scrollbar">
                        {/* Matching Products */}
                        {query.trim() && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                                    Products ({filteredProducts.length})
                                </p>
                                {filteredProducts.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {filteredProducts.map((p) => (
                                            <div
                                                key={p._id}
                                                onClick={() => handleSelectProduct(p)}
                                                className="p-2.5 rounded-xl bg-white dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#4D372E] hover:border-primary/50 hover:bg-[#FAF7F2] dark:hover:bg-[#382821] transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-[#F0EEE6] dark:bg-[#271C16] border border-[#E4DCD0] dark:border-[#4D372E] flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0">
                                                        <HiOutlineCube size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-text group-hover:text-primary truncate">
                                                            {p.shortName || p.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted">
                                                            <span className="font-mono text-text-secondary">{p.sku}</span>
                                                            <span>•</span>
                                                            <span className="text-success font-semibold">{formatCurrency(p.currentPrice)}</span>
                                                            <span>•</span>
                                                            <span>{p.stockLevel} in stock</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <HiOutlineArrowRight size={14} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-text-muted py-1">No products found matching "{query}".</p>
                                )}
                            </div>
                        )}

                        {/* Quick AI Prompt Trigger */}
                        {query.trim() && (
                            <div
                                onClick={() => handleAskAICopilot(`Search query analysis: ${query}. What recommendations or insights do you have?`)}
                                className="p-3 rounded-2xl bg-gradient-to-r from-primary/15 via-brass/10 to-primary/5 border border-primary/30 flex items-center justify-between cursor-pointer hover:border-primary/60 hover:from-primary/20 transition-all group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                        <HiOutlineSparkles size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">Ask AI Copilot about "{query}"</p>
                                        <p className="text-[11px] text-text-muted">Analyze elasticity, demand signals, and margin targets</p>
                                    </div>
                                </div>
                                <span className="text-xs text-primary font-semibold group-hover:translate-x-0.5 transition-transform">Run →</span>
                            </div>
                        )}

                        {/* Navigation Destinations */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                                Jump to Destination
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {filteredRoutes.map((r) => {
                                    const Icon = r.icon;
                                    return (
                                        <button
                                            key={r.path}
                                            type="button"
                                            onClick={() => handleSelectRoute(r.path)}
                                            className="p-2.5 rounded-xl bg-white dark:bg-[#30231D] border border-[#D8D0C0] dark:border-[#4D372E] hover:border-primary/40 hover:bg-[#FAF7F2] dark:hover:bg-[#382821] text-left transition-all flex items-center gap-2.5 cursor-pointer group shadow-2xs"
                                        >
                                            <Icon className={`${r.color} shrink-0`} size={17} />
                                            <span className="text-xs font-semibold text-text-secondary group-hover:text-text truncate">
                                                {r.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Tip */}
                    <div className="p-3 bg-[#F0EEE6] dark:bg-[#211610] border-t border-[#D8D0C0] dark:border-[#4D372E] flex items-center justify-between text-[11px] text-text-muted">
                        <span>Tap any result to navigate</span>
                        <span className="font-mono text-text-muted">PricePilot AI Search</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
