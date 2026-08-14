import { useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineTrendingUp, HiOutlineShieldCheck, HiOutlineChip } from 'react-icons/hi';

const HeroDashboard = memo(function HeroDashboard() {
  const reduceMotion = useReducedMotion();
  const [price, setPrice] = useState(1299);
  const [scenario, setScenario] = useState('profit'); // 'profit' | 'volume' | 'defend'
  const cogs = 840;
  const competitorPrice = 1349;

  // Elasticity calculations (e = -1.85)
  const baseUnits = 145;
  const priceRatio = price / 1299;
  const estimatedUnits = Math.round(baseUnits * Math.pow(priceRatio, -1.85));
  const projectedRevenue = price * estimatedUnits;
  const unitMargin = price - cogs;
  const marginPct = ((unitMargin / price) * 100).toFixed(1);
  const totalProfit = unitMargin * estimatedUnits;

  // Dynamic XAI Insight based on slider
  const getXAIExplanation = () => {
    if (price < 1150) {
      return {
        tag: 'Market Share Capture',
        text: 'Volume boost: Undercutting competitor (₹1,349) increases checkout velocity by +28%.',
        color: 'text-sky-800 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
      };
    }
    if (price > 1450) {
      return {
        tag: 'Premium Margin Capture',
        text: 'Max profit per unit: High product rating sustains ₹' + price.toLocaleString('en-IN') + ' with minimal demand decay.',
        color: 'text-purple-800 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
      };
    }
    return {
      tag: 'Optimal Profit Frontier',
      text: 'Peak equilibrium: ₹1,299 maximizes total net profit (₹' + totalProfit.toLocaleString('en-IN') + ') at 35.3% margin.',
      color: 'text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    };
  };

  const xai = getXAIExplanation();

  const handleScenarioPreset = (type) => {
    setScenario(type);
    if (type === 'profit') setPrice(1299);
    if (type === 'volume') setPrice(1120);
    if (type === 'defend') setPrice(1329);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto select-none">
      {/* Ambient Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10 dark:from-indigo-500/20 dark:via-sky-500/15 dark:to-emerald-500/20 blur-2xl rounded-3xl pointer-events-none opacity-90 dark:opacity-100" />

      {/* Floating Live Telemetry Badge (Top Left) */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="hidden sm:flex absolute -top-5 left-4 z-30 items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#070b14]/95 border border-slate-200/90 dark:border-white/10 backdrop-blur-xl shadow-lg dark:shadow-xl text-slate-800 dark:text-white"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold tracking-wide">Live Elasticity: e = -1.85</span>
      </motion.div>

      {/* Floating Status Pill (Top Right) */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="hidden sm:flex absolute -top-5 right-4 z-30 items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#070b14]/95 border border-indigo-200 dark:border-indigo-500/30 backdrop-blur-xl shadow-lg dark:shadow-xl text-indigo-700 dark:text-indigo-300 text-xs font-medium"
      >
        <HiOutlineChip className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span>Gemini XAI Active</span>
      </motion.div>

      {/* Main Terminal Window */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full rounded-3xl bg-white/95 dark:bg-[#0B1120]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/90 dark:bg-black/40">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wider">pricepilot.simulator.v1</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-300/60 dark:border-white/5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            <span>Real-Time Sync</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Projected Revenue */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proj. Revenue</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
                ₹{projectedRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1 font-semibold">
                <HiOutlineTrendingUp className="w-3 h-3" />
                {estimatedUnits} units/wk
              </span>
            </div>

            {/* Profit Margin */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Margin</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-1">
                {marginPct}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">
                +₹{unitMargin.toLocaleString('en-IN')}/unit
              </span>
            </div>

            {/* Stock Health Gauge */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex flex-col justify-between items-center text-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Risk</span>
              <div className="flex items-center gap-1.5 mt-1">
                <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Optimal</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">28 days cover</span>
            </div>
          </div>

          {/* Interactive Price Slider & Scenario Controls */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Simulate Target Price:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm border border-indigo-200 dark:border-indigo-500/30">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Scenario Preset Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScenarioPreset('volume')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    scenario === 'volume' 
                      ? 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
                >
                  Max Vol
                </button>
                <button
                  type="button"
                  onClick={() => handleScenarioPreset('profit')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    scenario === 'profit' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
                >
                  Max Margin
                </button>
                <button
                  type="button"
                  onClick={() => handleScenarioPreset('defend')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    scenario === 'defend' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
                >
                  Defend
                </button>
              </div>
            </div>

            {/* Slider Input */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="950"
                max="1750"
                step="10"
                value={price}
                onChange={(e) => {
                  setPrice(Number(e.target.value));
                  setScenario('custom');
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span>Cost: ₹{cogs}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Current: ₹{price}</span>
                <span>Comp: ₹{competitorPrice}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Elasticity Graph Preview */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HiOutlineLightningBolt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Dynamic Profit vs. Demand Curve
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Confidence: 95% (P10-P90)</span>
            </div>

            <div className="w-full h-16 relative overflow-hidden">
              <svg viewBox="0 0 400 80" className="w-full h-full preserve-aspect-ratio-none">
                <defs>
                  <linearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(99, 102, 241, 0.25)" />
                    <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                  </linearGradient>
                </defs>

                {/* Benchmark Line */}
                <path
                  d="M0,65 Q100,55 200,45 T400,30"
                  fill="none"
                  stroke="rgba(100, 116, 139, 0.25)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Main Curve Area */}
                <path
                  d="M0,60 Q80,45 180,20 T400,35 L400,80 L0,80 Z"
                  fill="url(#heroAreaGradient)"
                />

                {/* Main Curve Stroke */}
                <path
                  d="M0,60 Q80,45 180,20 T400,35"
                  fill="none"
                  stroke="url(#heroGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Active Indicator Point */}
                <circle
                  cx={Math.min(380, Math.max(20, ((price - 950) / 800) * 400))}
                  cy={25 + Math.sin(((price - 950) / 800) * Math.PI) * -15}
                  r="5"
                  className="fill-emerald-500 dark:fill-emerald-400 stroke-white stroke-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                />
              </svg>
            </div>
          </div>

          {/* Gemini XAI Live Audit Pill */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${xai.color}`}>
            <HiOutlineChip className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block mb-0.5">{xai.tag}</span>
              <span className="opacity-95">{xai.text}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default HeroDashboard;
