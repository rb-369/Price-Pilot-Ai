import { useState, useEffect } from 'react';
import { 
    HiOutlineSparkles, 
    HiOutlineLightBulb, 
    HiOutlineChip, 
    HiOutlineClock,
    HiOutlineInformationCircle
} from 'react-icons/hi';

const AI_TIPS = [
    {
        tag: 'Margin Lift',
        tip: 'Dynamic pricing against competitor stockouts yields an average +14.2% margin expansion without hurting conversion.',
    },
    {
        tag: 'Risk-Free Testing',
        tip: 'Model price changes, COGS adjustments, and competitor reactions before publishing using the What-If Simulator.',
    },
    {
        tag: 'Hard Guardrails',
        tip: 'PricePilot will never recommend a price below your specified Unit Base Cost (COGS). Your floor is strictly protected.',
    },
    {
        tag: 'Chat Shortcuts',
        tip: 'Type @product-name or /simulate in the Ask AI Copilot for instant SKU analysis and price sensitivity breakdown.',
    },
    {
        tag: 'Demand Signals',
        tip: 'Google Trends search intensity and regional weather spikes automatically recalibrate price elasticity models.',
    },
    {
        tag: 'Executive PDF',
        tip: 'Need to brief stakeholders? Download board-ready PDF pricing audit reports directly from the Recommendations page.',
    },
    {
        tag: 'Competitor Stance',
        tip: 'Set your competitor model to "Aggressive" or "Follower" to test how rival retailers will respond to your discounts.',
    },
    {
        tag: 'A/B Testing',
        tip: 'Run statistical split-tests on pricing strategies to measure real-world conversion lift before rolling out catalog-wide.',
    },
];

const STAGES = [
    { at: 0, text: 'Connecting to PricePilot AI engine...' },
    { at: 3, text: 'Ingesting competitor catalog prices & demand signals...' },
    { at: 7, text: 'Computing Bayesian demand elasticity curve...' },
    { at: 12, text: 'Synthesizing strategic reasoning with Gemini LLM...' },
    { at: 18, text: 'Waking up sleeping cloud instance... (Render cold start)' },
    { at: 28, text: 'Finalizing profit-maximizing guardrails & formatting...' },
];

/**
 * AILoadingState Component
 * 
 * Provides engaging, dynamic loading states with:
 * - Real-time stage progression ("Connecting" -> "Computing elasticity" -> "Synthesizing")
 * - Rotating PricePilot Pro Tips (rotates every 4.5 seconds with smooth animation)
 * - Live elapsed time counter so users know the system is active and not frozen
 * - Cold-start awareness message for sleeping cloud instances
 * 
 * Variants:
 * - 'chat': Compact bubble for ChatWidget / Chat page
 * - 'banner': Full-width card for Recommendations, Forecasts, and Simulator
 * - 'inline': Minimal inline bar for quick widgets
 */
export default function AILoadingState({ 
    variant = 'chat', 
    title = 'AI Generation in Progress', 
    subtitle,
    className = '' 
}) {
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * AI_TIPS.length));
    const [fadeTip, setFadeTip] = useState(true);

    // Track elapsed time
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Rotate tips every 4.5 seconds
    useEffect(() => {
        const tipInterval = setInterval(() => {
            setFadeTip(false);
            setTimeout(() => {
                setTipIndex(prev => (prev + 1) % AI_TIPS.length);
                setFadeTip(true);
            }, 250);
        }, 4500);
        return () => clearInterval(tipInterval);
    }, []);

    // Determine current processing stage
    const currentStage = STAGES.slice().reverse().find(s => secondsElapsed >= s.at)?.text || STAGES[0].text;
    const currentTip = AI_TIPS[tipIndex];
    const isSleepingWarning = secondsElapsed >= 18;

    // ── Variant: Compact Chat Bubble ──
    if (variant === 'chat') {
        return (
            <div className={`flex flex-col items-start gap-2 animate-in fade-in duration-300 max-w-lg ${className}`}>
                <div className="bg-slate-900/90 dark:bg-slate-900/90 bg-white/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl rounded-tl-sm p-4 shadow-xl shadow-indigo-500/10 text-xs w-full transition-all">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            <span className="font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <HiOutlineSparkles className="w-3.5 h-3.5 animate-pulse" />
                                PricePilot AI
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
                            <HiOutlineClock className="w-3 h-3" />
                            <span>{secondsElapsed}s</span>
                        </div>
                    </div>

                    {/* Dynamic Stage Text */}
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium mb-3">
                        <div className="flex space-x-1 shrink-0">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_6px_rgba(99,102,241,0.6)]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_6px_rgba(99,102,241,0.6)]" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_6px_rgba(99,102,241,0.6)]" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="truncate">{currentStage}</span>
                    </div>

                    {/* Cold start notice if taking over 18 seconds */}
                    {isSleepingWarning && (
                        <div className="mb-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-1.5 leading-snug">
                            <HiOutlineInformationCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                            <span>
                                <strong>Cold Start:</strong> Free-tier cloud containers take ~30s to boot on first request. Subsequent queries will be near-instantaneous!
                            </span>
                        </div>
                    )}

                    {/* Rotating Pro Tip */}
                    <div className="bg-indigo-50/70 dark:bg-white/5 rounded-xl p-2.5 border border-indigo-100 dark:border-white/5 text-[11px]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300 uppercase text-[9px] tracking-wider">
                                <HiOutlineLightBulb className="w-3 h-3 text-amber-500" />
                                Pro Tip • {currentTip.tag}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">rotating tips</span>
                        </div>
                        <p className={`text-slate-600 dark:text-slate-300 leading-relaxed transition-opacity duration-300 ${fadeTip ? 'opacity-100' : 'opacity-0'}`}>
                            {currentTip.tip}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Variant: Full-width Banner / Card for Recommendations, Forecasts, Simulator ──
    return (
        <div className={`w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/15 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 text-white ${className}`}>
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <HiOutlineChip className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                                {title}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                                    AI Active
                                </span>
                            </h3>
                            <p className="text-xs text-slate-300">
                                {subtitle || 'Analyzing price sensitivity, inventory constraints, and competitive elasticities...'}
                            </p>
                        </div>
                    </div>

                    {/* Timer Badge */}
                    <div className="flex items-center self-start sm:self-auto gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-200">
                        <HiOutlineClock className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>Elapsed: {secondsElapsed}s</span>
                    </div>
                </div>

                {/* Animated Processing Stage Bar */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            Current Step: {currentStage}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                            {Math.min(95, Math.max(10, secondsElapsed * 8))}% complete
                        </span>
                    </div>
                    {/* Progress Track */}
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-accent transition-all duration-700 rounded-full relative"
                            style={{ width: `${Math.min(96, Math.max(12, secondsElapsed * 8))}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Cold Start Banner if taking over 18 seconds */}
                {isSleepingWarning && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                        <HiOutlineInformationCircle className="w-5 h-5 shrink-0 text-amber-400" />
                        <div>
                            <strong>Cloud Spin-up in Progress:</strong> The Python AI microservice is waking up from idle sleep on Render. Please hold on — this only happens on the first request.
                        </div>
                    </div>
                )}

                {/* Rotating Tip Footer */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <HiOutlineLightBulb className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
                                PricePilot Pro Tip • {currentTip.tag}
                            </span>
                            <p className={`text-xs text-slate-200 transition-opacity duration-300 ${fadeTip ? 'opacity-100' : 'opacity-0'}`}>
                                {currentTip.tip}
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 self-end sm:self-center">
                        Tip {tipIndex + 1}/{AI_TIPS.length}
                    </span>
                </div>
            </div>
        </div>
    );
}
