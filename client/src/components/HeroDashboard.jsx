import { useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineTrendingUp, HiOutlineShieldCheck, HiOutlineChip } from 'react-icons/hi';

const MotionDiv = motion.div;

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
        tagColor: 'text-[#9E6F28] dark:text-[#A17A3A]', // Warm brass amber
        text: 'Volume boost: Undercutting competitor (₹1,349) increases checkout velocity by +28%.',
      };
    }
    if (price > 1450) {
      return {
        tag: 'Premium Margin Capture',
        tagColor: 'text-[#A85A3C]', // Terracotta accent
        text: 'Max profit per unit: High product rating sustains ₹' + price.toLocaleString('en-IN') + ' with minimal demand decay.',
      };
    }
    return {
      tag: 'Optimal Profit Frontier',
      tagColor: 'text-[#3B6E4E] dark:text-[#5F806B]', // Warm forest sage
      text: 'Peak equilibrium: ₹1,299 maximizes total net profit (₹' + totalProfit.toLocaleString('en-IN') + ') at 35.3% margin.',
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
      {/* Subtle Warm Atmosphere Shadow */}
      <div className="absolute -inset-1 bg-[#CBB8A7]/30 dark:bg-[#A85A3C]/10 blur-2xl rounded-3xl pointer-events-none" />

      {/* Floating Live Telemetry Badge (Top Left) */}
      <MotionDiv
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="hidden sm:flex absolute -top-5 left-4 z-30 items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6F0] dark:bg-[#2D211B] border border-[#DFD3C4] dark:border-[#4A3930] shadow-md text-[#3E2E25] dark:text-[#F0EEE6]"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#487355] dark:bg-[#5F806B] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#487355] dark:bg-[#5F806B]"></span>
        </span>
        <span className="text-xs font-semibold tracking-wide">Live Elasticity: e = -1.85</span>
      </MotionDiv>

      {/* Floating Status Pill (Top Right) */}
      <MotionDiv
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="hidden sm:flex absolute -top-5 right-4 z-30 items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF6F0] dark:bg-[#2D211B] border border-[#DFD3C4] dark:border-[#4A3930] shadow-md text-[#3E2E25] dark:text-[#F0EEE6] text-xs font-medium"
      >
        <HiOutlineChip className="w-3.5 h-3.5 text-[#A85A3C]" />
        <span>Gemini XAI Active</span>
      </MotionDiv>

      {/* Main Terminal Window (Container: #EFE8DF light / #241812 dark) */}
      <MotionDiv
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full rounded-3xl bg-[#EFE8DF] dark:bg-[#241812] border border-[#DFD3C4] dark:border-[#4A3930] shadow-[0_20px_50px_rgba(100,75,55,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Terminal Header (#E6DDD2 light / #2D211B dark) */}
        <div className="px-5 py-3.5 border-b border-[#DFD3C4] dark:border-[#4A3930] flex items-center justify-between bg-[#E6DDD2] dark:bg-[#2D211B]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#CDBFB0] dark:bg-[#5C473C]" />
            <div className="w-3 h-3 rounded-full bg-[#BAAB9A] dark:bg-[#4A3930]" />
            <div className="w-3 h-3 rounded-full bg-[#9E8B79] dark:bg-[#3D2A20]" />
            <span className="ml-2 text-xs font-mono text-[#7A695C] dark:text-[#A99D91] tracking-wider">pricepilot.simulator.v1</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#3E2E25] dark:text-[#F0EEE6] bg-[#FAF6F0] dark:bg-[#241812] px-2.5 py-1 rounded-lg border border-[#DFD3C4] dark:border-[#4A3930] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#487355] dark:bg-[#5F806B]"></span>
            <span>Real-Time Sync</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Top KPI Metrics Row (Cards: #FAF6F0 light / #30251F dark) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Projected Revenue */}
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#30251F] border border-[#E4D9CC] dark:border-[#4A3930] flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-medium text-[#7C6B5E] dark:text-[#A99D91] uppercase tracking-wider">Proj. Revenue</span>
              <span className="text-lg sm:text-xl font-bold text-[#2E2018] dark:text-[#F0EEE6] font-mono tracking-tight mt-1">
                ₹{projectedRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-[#3B6E4E] dark:text-[#5F806B] flex items-center gap-0.5 mt-1 font-semibold">
                <HiOutlineTrendingUp className="w-3 h-3 text-[#3B6E4E] dark:text-[#5F806B]" />
                {estimatedUnits} units/wk
              </span>
            </div>

            {/* Profit Margin */}
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#30251F] border border-[#E4D9CC] dark:border-[#4A3930] flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-medium text-[#7C6B5E] dark:text-[#A99D91] uppercase tracking-wider">Net Margin</span>
              <span className="text-lg sm:text-xl font-bold text-[#3B6E4E] dark:text-[#5F806B] font-mono tracking-tight mt-1">
                {marginPct}%
              </span>
              <span className="text-[10px] text-[#7C6B5E] dark:text-[#A99D91] mt-1 font-mono font-medium">
                +₹{unitMargin.toLocaleString('en-IN')}/unit
              </span>
            </div>

            {/* Stock Health Gauge */}
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-[#30251F] border border-[#E4D9CC] dark:border-[#4A3930] flex flex-col justify-between items-center text-center shadow-sm">
              <span className="text-[11px] font-medium text-[#7C6B5E] dark:text-[#A99D91] uppercase tracking-wider">Stock Risk</span>
              <div className="flex items-center gap-1.5 mt-1">
                <HiOutlineShieldCheck className="w-5 h-5 text-[#3B6E4E] dark:text-[#5F806B]" />
                <span className="text-sm font-bold text-[#2E2018] dark:text-[#F0EEE6]">Optimal</span>
              </div>
              <span className="text-[10px] text-[#7C6B5E] dark:text-[#A99D91] mt-1">28 days cover</span>
            </div>
          </div>

          {/* Interactive Price Slider & Scenario Controls (Card: #FAF6F0 light / #30251F dark) */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] dark:bg-[#30251F] border border-[#E4D9CC] dark:border-[#4A3930] space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#2E2018] dark:text-[#F0EEE6]">Simulate Target Price:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#2E2018] dark:bg-[#241812] text-[#FAF6F0] dark:text-[#F0EEE6] font-mono font-bold text-sm border border-[#48352A] dark:border-[#4A3930]">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Scenario Preset Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScenarioPreset('volume')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${scenario === 'volume'
                      ? 'bg-[#A85A3C] text-white font-semibold shadow-sm'
                      : 'text-[#7C6B5E] dark:text-[#A99D91] hover:text-[#2E2018] dark:hover:text-[#F0EEE6] hover:bg-[#8C6D58]/10 dark:hover:bg-white/5'
                    }`}
                >
                  Max Vol
                </button>
                <button
                  type="button"
                  onClick={() => handleScenarioPreset('profit')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${scenario === 'profit'
                      ? 'bg-[#A85A3C] text-white font-semibold shadow-sm'
                      : 'text-[#7C6B5E] dark:text-[#A99D91] hover:text-[#2E2018] dark:hover:text-[#F0EEE6] hover:bg-[#8C6D58]/10 dark:hover:bg-white/5'
                    }`}
                >
                  Max Margin
                </button>
                <button
                  type="button"
                  onClick={() => handleScenarioPreset('defend')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${scenario === 'defend'
                      ? 'bg-[#A85A3C] text-white font-semibold shadow-sm'
                      : 'text-[#7C6B5E] dark:text-[#A99D91] hover:text-[#2E2018] dark:hover:text-[#F0EEE6] hover:bg-[#8C6D58]/10 dark:hover:bg-white/5'
                    }`}
                >
                  Defend
                </button>
              </div>
            </div>

            {/* Slider Input (Terracotta Accent: #A85A3C) */}
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
                className="w-full h-2 bg-[#E4D9CC] dark:bg-[#4A3930] rounded-lg appearance-none cursor-pointer accent-[#A85A3C]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#7C6B5E] dark:text-[#A99D91]">
                <span>Cost: ₹{cogs}</span>
                <span className="text-[#A85A3C] font-semibold">Current: ₹{price}</span>
                <span>Comp: ₹{competitorPrice}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Elasticity Graph Preview (Card: #FAF6F0 light / #30251F dark) */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] dark:bg-[#30251F] border border-[#E4D9CC] dark:border-[#4A3930] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#2E2018] dark:text-[#F0EEE6] flex items-center gap-1.5">
                <HiOutlineLightningBolt className="w-3.5 h-3.5 text-[#A85A3C]" />
                Dynamic Profit vs. Demand Curve
              </span>
              <span className="text-[11px] font-mono text-[#7C6B5E] dark:text-[#A99D91]">Confidence: 95% (P10-P90)</span>
            </div>

            <div className="w-full h-16 relative overflow-hidden">
              <svg viewBox="0 0 400 80" className="w-full h-full preserve-aspect-ratio-none">
                <defs>
                  <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(168, 90, 60, 0.22)" />
                    <stop offset="100%" stopColor="rgba(168, 90, 60, 0.02)" />
                  </linearGradient>
                </defs>

                {/* Secondary / Reference Line */}
                <path
                  d="M0,65 Q100,55 200,45 T400,30"
                  fill="none"
                  stroke="#C5B5A5"
                  className="stroke-[#C5B5A5] dark:stroke-[#5A453A]"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Main Curve Area (Warm Terracotta Tint) */}
                <path
                  d="M0,60 Q80,45 180,20 T400,35 L400,80 L0,80 Z"
                  fill="url(#heroAreaGradient)"
                />

                {/* Main Graph Line (Terracotta Accent: #A85A3C) */}
                <path
                  d="M0,60 Q80,45 180,20 T400,35"
                  fill="none"
                  stroke="#A85A3C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Active Indicator Point */}
                <circle
                  cx={Math.min(380, Math.max(20, ((price - 950) / 800) * 400))}
                  cy={25 + Math.sin(((price - 950) / 800) * Math.PI) * -15}
                  r="5"
                  className="fill-[#A85A3C] stroke-[#FAF6F0] dark:stroke-[#30251F] stroke-2 drop-shadow-[0_0_6px_rgba(168,90,60,0.4)]"
                />
              </svg>
            </div>
          </div>

          {/* Gemini XAI Live Audit Pill (#E6DDD2 light / #2D211B dark) */}
          <div className="p-3.5 rounded-xl border border-[#DFD3C4] dark:border-[#4A3930] bg-[#E6DDD2] dark:bg-[#2D211B] flex items-start gap-2.5 transition-all">
            <HiOutlineChip className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#A85A3C]" />
            <div className="text-xs leading-relaxed">
              <span className={`font-bold block mb-0.5 ${xai.tagColor}`}>{xai.tag}</span>
              <span className="text-[#5C4C40] dark:text-[#A99D91]">{xai.text}</span>
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
});

export default HeroDashboard;
