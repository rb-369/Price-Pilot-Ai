import { useLocation, Link } from 'react-router-dom';
import WhatIfSimulator from '../components/WhatIfSimulator';
import AskAIButton from '../components/AskAIButton';
import ExplainWithAITag from '../components/ExplainWithAITag';
import { HiOutlineAdjustments, HiOutlineLightBulb, HiOutlineCube } from 'react-icons/hi';

export default function Simulator() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-slide-up stagger-1">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Predictive AI
            </span>
            <span className="text-xs text-text-muted">High-Precision Microeconomic Modeling</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text flex items-center gap-3 flex-wrap">
            <span>What-If Price Simulator</span>
            <ExplainWithAITag title="Explain with AI" contextData={{ type: 'what_if_simulator' }} />
            <AskAIButton
              variant="chip"
              label="Ask Copilot"
              prompt="What are optimal price points and profit margins for my catalog products in the What-If Simulator?"
            />
          </h1>
          <p className="text-text-muted text-sm mt-1.5 flex items-center gap-2">
            <HiOutlineAdjustments className="w-4 h-4 text-primary" />
            Simulate price adjustments, demand elasticity, competitor reactions, and revenue outcomes before committing changes live.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard/recommendations" className="btn-secondary text-xs flex items-center gap-1.5">
            <HiOutlineLightBulb className="w-4 h-4 text-primary" />
            AI Recommendations
          </Link>
          <Link to="/dashboard/products" className="btn-secondary text-xs flex items-center gap-1.5">
            <HiOutlineCube className="w-4 h-4 text-primary" />
            View Products
          </Link>
        </div>
      </div>

      {/* ── Main Simulator Engine ── */}
      <WhatIfSimulator />
    </div>
  );
}
