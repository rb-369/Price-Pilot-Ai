import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus,
    HiOutlineCube,
    HiOutlineScale,
    HiOutlineTrendingUp,
    HiOutlineBell,
    HiOutlineLightBulb,
    HiOutlineSparkles,
    HiOutlineDocumentText,
    HiOutlineCheck
} from 'react-icons/hi';

export default function MobileHeroCards({ onAddProduct, stats }) {
    const navigate = useNavigate();
    const [scratchpadText, setScratchpadText] = useState(() => {
        try {
            return localStorage.getItem('pricepilot_scratchpad') || '';
        } catch {
            return '';
        }
    });
    const [savedStatus, setSavedStatus] = useState(false);

    const handleScratchpadChange = (e) => {
        const val = e.target.value;
        setScratchpadText(val);
        try {
            localStorage.setItem('pricepilot_scratchpad', val);
            setSavedStatus(true);
            setTimeout(() => setSavedStatus(false), 1500);
        } catch {
            // ignore storage quota issues
        }
    };

    return (
        <div className="space-y-4 mb-6">
            {/* Top 2 Vibrant Action Cards (Green + Purple from user screenshot) */}
            <div className="grid grid-cols-2 gap-3">
                {/* 1. Vibrant Green Card: New Product */}
                <div
                    onClick={() => {
                        if (onAddProduct) onAddProduct();
                        else navigate('/dashboard/products');
                    }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 text-white shadow-lg shadow-emerald-900/20 active:scale-95 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group"
                >
                    {/* Card Title & Icon */}
                    <div className="flex items-center gap-1.5 z-10">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                            <HiOutlinePlus size={14} className="stroke-[3]" />
                        </span>
                        <span className="font-bold text-sm tracking-tight">New product</span>
                    </div>

                    {/* Graphic Preview Mockup (matches dark card preview in user screenshot) */}
                    <div className="absolute right-[-10px] bottom-[-15px] w-28 h-24 bg-slate-900/85 backdrop-blur-xs rounded-2xl p-2.5 shadow-2xl border border-white/10 transform -rotate-12 group-hover:-rotate-6 transition-transform pointer-events-none flex flex-col justify-between">
                        <div className="space-y-1">
                            <div className="w-14 h-2 bg-emerald-400/80 rounded-full" />
                            <div className="w-20 h-1.5 bg-slate-600/80 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400">
                            <span>SKU-01</span>
                            <span>₹999</span>
                        </div>
                    </div>

                    <div className="z-10 text-[11px] text-emerald-100 font-medium">
                        Add SKU or scan link
                    </div>
                </div>

                {/* 2. Vibrant Purple Card: AI Optimization / New Task */}
                <div
                    onClick={() => navigate('/dashboard/forecasts')}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 p-4 text-white shadow-lg shadow-purple-900/20 active:scale-95 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group"
                >
                    {/* Card Title & Icon */}
                    <div className="flex items-center gap-1.5 z-10">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                            <HiOutlinePlus size={14} className="stroke-[3]" />
                        </span>
                        <span className="font-bold text-sm tracking-tight">AI Forecast</span>
                    </div>

                    {/* Graphic Preview Mockup (matches purple card preview with checkmark in user screenshot) */}
                    <div className="absolute right-[-10px] bottom-[-15px] w-28 h-24 bg-slate-900/85 backdrop-blur-xs rounded-2xl p-2.5 shadow-2xl border border-white/10 transform rotate-6 group-hover:rotate-3 transition-transform pointer-events-none flex flex-col justify-between">
                        <div className="space-y-1">
                            <div className="w-16 h-2 bg-purple-400/80 rounded-full" />
                            <div className="w-12 h-1.5 bg-slate-600/80 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-[10px]">
                                ✓
                            </span>
                            <span className="text-[9px] font-bold text-purple-300">92% Acc</span>
                        </div>
                    </div>

                    <div className="z-10 text-[11px] text-purple-100 font-medium">
                        Predict demand &amp; stock
                    </div>
                </div>
            </div>

            {/* Quick Action Squircle Row (4 square action buttons like screenshot) */}
            <div className="grid grid-cols-4 gap-2.5">
                {/* 1. Recommendations */}
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/recommendations')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121929]/80 dark:bg-[#0f172a]/90 border border-slate-800/80 hover:border-indigo-500/40 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer group shadow-sm"
                >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <HiOutlineLightBulb size={20} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-slate-200">Re-price</span>
                </button>

                {/* 2. Catalog */}
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/products')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121929]/80 dark:bg-[#0f172a]/90 border border-slate-800/80 hover:border-indigo-500/40 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer group shadow-sm"
                >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <HiOutlineCube size={20} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-slate-200">Catalog</span>
                </button>

                {/* 3. Competitors */}
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/competitors')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121929]/80 dark:bg-[#0f172a]/90 border border-slate-800/80 hover:border-cyan-500/40 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer group shadow-sm"
                >
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <HiOutlineScale size={20} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-slate-200">Rivals</span>
                </button>

                {/* 4. Alerts */}
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/alerts')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121929]/80 dark:bg-[#0f172a]/90 border border-slate-800/80 hover:border-rose-500/40 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer group shadow-sm"
                >
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                        <HiOutlineBell size={20} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-slate-200">Alerts</span>
                </button>
            </div>

            {/* Scratch Pad Section (Direct match to reference image "Scratch Pad") */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Scratch Pad
                    </h2>
                    {savedStatus && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 animate-fade-in">
                            <HiOutlineCheck size={13} />
                            Saved
                        </span>
                    )}
                </div>

                <div className="rounded-2xl bg-[#121929]/90 dark:bg-[#0f172a] border border-slate-800/90 p-3.5 shadow-sm focus-within:border-indigo-500/50 transition-colors">
                    <textarea
                        value={scratchpadText}
                        onChange={handleScratchpadChange}
                        placeholder="Start writing pricing targets, supplier notes or reminders..."
                        rows={3}
                        className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-400 focus:outline-none resize-none leading-relaxed font-sans"
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                        <span>Auto-saved locally</span>
                        <span>{scratchpadText.length} chars</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
