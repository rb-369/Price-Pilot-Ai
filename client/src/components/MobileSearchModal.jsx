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
    { label: 'Products Catalog', path: '/dashboard/products', icon: HiOutlineCube, color: 'text-indigo-400' },
    { label: 'AI Recommendations', path: '/dashboard/recommendations', icon: HiOutlineLightBulb, color: 'text-amber-400' },
    { label: 'Demand Forecasts', path: '/dashboard/forecasts', icon: HiOutlineTrendingUp, color: 'text-emerald-400' },
    { label: 'Competitor Intel', path: '/dashboard/competitors', icon: HiOutlineScale, color: 'text-cyan-400' },
    { label: 'Alerts & Incidents', path: '/dashboard/alerts', icon: HiOutlineBell, color: 'text-rose-400' },
    { label: 'A/B Price Tests', path: '/dashboard/ab-tests', icon: HiOutlineBeaker, color: 'text-purple-400' },
    { label: 'Store Settings', path: '/dashboard/settings', icon: HiOutlineCog, color: 'text-slate-400' },
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
        <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/80 backdrop-blur-md animate-fade-in">
            {/* Backdrop click to dismiss */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Dialog Card */}
            <div className="relative z-10 w-full max-w-xl mx-auto mt-3 sm:mt-12 p-3 sm:p-5 flex flex-col max-h-[92vh]">
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Top Search Input Row */}
                    <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                            <HiOutlineSearch size={18} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Find any product, forecast or alert..."
                            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                            >
                                <HiOutlineX size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                        >
                            Esc
                        </button>
                    </div>

                    {/* Results Container */}
                    <div className="overflow-y-auto p-4 space-y-4 max-h-[60vh] custom-scrollbar">
                        {/* Matching Products */}
                        {query.trim() && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Products ({filteredProducts.length})
                                </p>
                                {filteredProducts.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {filteredProducts.map((p) => (
                                            <div
                                                key={p._id}
                                                onClick={() => handleSelectProduct(p)}
                                                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all flex items-center justify-between cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                        <HiOutlineCube size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                                                            {p.shortName || p.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                            <span className="font-mono text-slate-500">{p.sku}</span>
                                                            <span>•</span>
                                                            <span className="text-emerald-400 font-semibold">{formatCurrency(p.currentPrice)}</span>
                                                            <span>•</span>
                                                            <span>{p.stockLevel} in stock</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <HiOutlineArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 py-1">No products found matching "{query}".</p>
                                )}
                            </div>
                        )}

                        {/* Quick AI Prompt Trigger */}
                        {query.trim() && (
                            <div
                                onClick={() => handleAskAICopilot(`Search query analysis: ${query}. What recommendations or insights do you have?`)}
                                className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/5 border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:border-indigo-500/60 transition-all"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <HiOutlineSparkles size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Ask AI Copilot about "{query}"</p>
                                        <p className="text-[11px] text-slate-400">Analyze elasticity, demand signals, and margin targets</p>
                                    </div>
                                </div>
                                <span className="text-xs text-indigo-400 font-semibold">Run →</span>
                            </div>
                        )}

                        {/* Navigation Destinations */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                                            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                                        >
                                            <Icon className={`${r.color} shrink-0`} size={17} />
                                            <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate">
                                                {r.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Tip */}
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Tap any result to navigate</span>
                        <span className="font-mono">PricePilot AI Mobile</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
