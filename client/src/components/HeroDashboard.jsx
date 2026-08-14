import { motion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineTrendingUp, HiOutlineShieldCheck } from 'react-icons/hi';
import { useState, useEffect } from 'react';

export default function HeroDashboard() {
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    // Animate revenue counter
    const duration = 2000;
    const target = 124500;
    const interval = 20;
    const steps = duration / interval;
    const increment = target / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setRevenue(target);
        clearInterval(timer);
      } else {
        setRevenue(Math.floor(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto mt-12 lg:mt-0 lg:ml-auto select-none pointer-events-none">
      {/* Background Aura */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full transform -translate-y-12"></div>

      {/* Floating Badges */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -left-16 top-12 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span className="text-sm font-semibold text-white">+24% Revenue</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -right-8 top-12 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2"
      >
        <HiOutlineTrendingUp className="text-indigo-400 w-4 h-4" />
        <span className="text-sm font-semibold text-white">Demand ↑</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute -left-6 bottom-27 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2"
      >
        <HiOutlineShieldCheck className="text-emerald-400 w-4 h-4" />
        <span className="text-sm font-semibold text-white">Stock Healthy</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute -right-6 bottom-8 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2"
      >
        <HiOutlineLightningBolt className="text-purple-400 w-4 h-4" />
        <span className="text-sm font-semibold text-white">AI Prediction</span>
      </motion.div>

      {/* Main Dashboard Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        className="relative z-10 w-full rounded-[2rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.3)] overflow-hidden"
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
        ></div>

        {/* Top Navigation Bar */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            <HiOutlineLightningBolt className="w-3 h-3 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300">AI Insights Active</span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6 relative z-10">

          {/* Top Row: Revenue & Progress */}
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-white/5 p-5">
              <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Projected Revenue</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                ₹{revenue.toLocaleString()}
              </h3>
              <div className="mt-4 h-12 w-full flex items-end gap-1">
                {/* Mini Bar Chart */}
                {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className={`flex-1 rounded-t-sm ${i === 6 ? 'bg-indigo-500' : 'bg-slate-700'}`}
                  ></motion.div>
                ))}
              </div>
            </div>

            <div className="w-36 bg-slate-800/50 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-slate-400 font-medium mb-2 uppercase tracking-wider">Inventory Health</p>
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                  <motion.circle
                    cx="32" cy="32" r="28"
                    stroke="#818cf8"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="175"
                    initial={{ strokeDashoffset: 175 }}
                    animate={{ strokeDashoffset: 175 - (175 * 0.85) }}
                    transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">85%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Chart Card */}
          <div className="w-full bg-slate-800/50 rounded-2xl border border-white/5 p-5">
            <div className="flex justify-between items-center mb-8 relative z-20">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Dynamic Pricing Forecast</p>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded shadow-sm">+12.5% Margin</span>
            </div>

            {/* Animated SVG Line Chart */}
            <div className="w-full h-24 relative overflow-hidden -mt-4">
              <svg viewBox="0 0 400 100" className="w-full h-full preserve-aspect-ratio-none">
                {/* Background Line */}
                <path
                  d="M0,80 Q50,70 100,50 T200,60 T300,20 T400,30"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3"
                />

                {/* AI Optimized Line */}
                <motion.path
                  d="M0,60 Q50,50 100,30 T200,40 T300,10 T400,15"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
                />

                {/* Fill Gradient */}
                <motion.path
                  d="M0,60 Q50,50 100,30 T200,40 T300,10 T400,15 L400,100 L0,100 Z"
                  fill="url(#fillGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 1 }}
                />

                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                  <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(129, 140, 248, 0.2)" />
                    <stop offset="100%" stopColor="rgba(129, 140, 248, 0)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Data points */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2, duration: 0.3 }}
                className="absolute top-2 right-12 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-purple-500"
              ></motion.div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
