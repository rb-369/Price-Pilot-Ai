import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import {
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineLightningBolt,
    HiOutlineTrendingUp,
    HiOutlineChartBar,
    HiOutlineCube,
    HiOutlineSparkles,
    HiOutlineAdjustments,
    HiOutlineArrowRight,
    HiOutlineCheckCircle
} from 'react-icons/hi';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';

const DEMO_PRODUCTS = [
    {
        id: 'demo-1',
        title: 'Sony WH-1000XM5 Wireless Headphones',
        category: 'Electronics & Audio',
        cogs: 18500,
        currentPrice: 26990,
        competitorPrice: 25490,
        elasticity: -1.85,
        inventory: 142,
        image: '🎧',
    },
    {
        id: 'demo-2',
        title: 'Pexpo Stainless Steel Vacuum Flask 1000ml',
        category: 'Home & Kitchen',
        cogs: 420,
        currentPrice: 849,
        competitorPrice: 799,
        elasticity: -1.35,
        inventory: 650,
        image: '🍶',
    },
    {
        id: 'demo-3',
        title: 'Running Performance Shoes Pro Edition',
        category: 'Footwear & Sports',
        cogs: 2100,
        currentPrice: 4499,
        competitorPrice: 4299,
        elasticity: -2.10,
        inventory: 88,
        image: '👟',
    },
];

const STRATEGY_PRESETS = [
    { id: 'max_profit', label: 'Max Profit Margin', desc: 'Optimizes price point where Margin × Demand Curve peaks' },
    { id: 'market_share', label: 'Capture Market Share', desc: 'Aggressively matches or undercuts top competitor' },
    { id: 'clearance', label: 'Inventory Clearance', desc: 'Drives high volume to clear stock quickly' },
    { id: 'premium', label: 'Brand Premium (+8%)', desc: 'Maximizes brand value perception and average order value' },
];

export default function Demo() {
    const { theme, toggleTheme } = useTheme();
    const { formatCurrency } = useCurrency();
    const logoIcon = theme === 'dark' ? newDarkLogo : newLightLogo;

    const [selectedProduct, setSelectedProduct] = useState(DEMO_PRODUCTS[0]);
    const [simulatedPrice, setSimulatedPrice] = useState(selectedProduct.currentPrice);
    const [selectedStrategy, setSelectedStrategy] = useState('max_profit');
    const [competitorStance, setCompetitorStance] = useState('neutral'); // neutral, aggressive, follower

    // Simulator Calculations
    const priceDiffPct = ((simulatedPrice - selectedProduct.currentPrice) / selectedProduct.currentPrice);
    const estimatedDemandMultiplier = Math.max(0.2, 1 + (selectedProduct.elasticity * priceDiffPct));
    const baseWeeklyUnits = 45;
    const projectedUnits = Math.round(baseWeeklyUnits * estimatedDemandMultiplier);
    const unitMargin = simulatedPrice - selectedProduct.cogs;
    const marginPct = ((unitMargin / simulatedPrice) * 100).toFixed(1);
    const projectedRevenue = projectedUnits * simulatedPrice;
    const projectedProfit = projectedUnits * unitMargin;

    const applyPreset = (presetId) => {
        setSelectedStrategy(presetId);
        if (presetId === 'max_profit') {
            setSimulatedPrice(Math.round(selectedProduct.cogs * 1.45));
        } else if (presetId === 'market_share') {
            setSimulatedPrice(Math.round(selectedProduct.competitorPrice * 0.98));
        } else if (presetId === 'clearance') {
            setSimulatedPrice(Math.round(selectedProduct.cogs * 1.15));
        } else if (presetId === 'premium') {
            setSimulatedPrice(Math.round(selectedProduct.competitorPrice * 1.08));
        }
    };

    const handleSelectProduct = (prod) => {
        setSelectedProduct(prod);
        setSimulatedPrice(prod.currentPrice);
        setSelectedStrategy('max_profit');
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col text-text transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <img src={logoIcon} alt="PricePilot AI Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-text">PricePilot AI</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Interactive Sandbox
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-lighter transition-colors border border-border/40"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <HiOutlineSun className="w-5 h-5 text-amber-400" /> : <HiOutlineMoon className="w-5 h-5 text-primary" />}
                        </button>
                        <Link to="/register" className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shadow-md">
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </header>

            {/* Sandbox Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                    <HiOutlineSparkles className="w-4 h-4" />
                    Live Algorithm Sandbox
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-text tracking-tight mb-3">
                    AI What-If Price Simulator
                </h1>
                <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto">
                    Test our dynamic elasticity algorithms in real-time. Pick a sample product, adjust the price slider, and observe the instant impact on profit margins, projected volume, and revenue.
                </p>
            </div>

            {/* Main Interactive Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Product Selection & Scenario Controls (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* 1. Pick Sample Product */}
                    <div className="glass-card p-6 rounded-2xl border border-border/60">
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                            1. Select Sample Product Catalog Item
                        </label>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {DEMO_PRODUCTS.map((prod) => {
                                const isSelected = selectedProduct.id === prod.id;
                                return (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => handleSelectProduct(prod)}
                                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'border-primary bg-primary/15 ring-2 ring-primary/25 shadow-lg shadow-primary/10'
                                                : 'border-border/60 bg-surface hover:border-border'
                                        }`}
                                    >
                                        <div className="text-2xl mb-2">{prod.image}</div>
                                        <div className="font-bold text-xs text-text line-clamp-2 mb-1">{prod.title}</div>
                                        <div className="text-[11px] text-text-muted">{formatCurrency(prod.currentPrice)}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Scenario Presets */}
                    <div className="glass-card p-6 rounded-2xl border border-border/60">
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                            2. Choose Pricing Strategy Preset
                        </label>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {STRATEGY_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyPreset(preset.id)}
                                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                        selectedStrategy === preset.id
                                            ? 'border-primary bg-primary/15 ring-2 ring-primary/20'
                                            : 'border-border/60 bg-surface hover:border-border'
                                    }`}
                                >
                                    <div className="font-bold text-xs text-text flex items-center justify-between">
                                        <span>{preset.label}</span>
                                        {selectedStrategy === preset.id && <HiOutlineCheckCircle className="w-4 h-4 text-primary" />}
                                    </div>
                                    <p className="text-[11px] text-text-muted mt-1 leading-snug">{preset.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Interactive Price Slider */}
                    <div className="glass-card p-6 rounded-2xl border border-border/60 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                                    3. Simulated Price Point
                                </label>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Current Catalog Price: <span className="font-bold text-text">{formatCurrency(selectedProduct.currentPrice)}</span>
                                </p>
                            </div>
                            <div className="text-2xl font-extrabold text-primary bg-primary/10 px-4 py-1.5 rounded-xl border border-primary/20">
                                {formatCurrency(simulatedPrice)}
                            </div>
                        </div>

                        <input
                            type="range"
                            min={Math.round(selectedProduct.cogs * 1.05)}
                            max={Math.round(selectedProduct.currentPrice * 1.6)}
                            value={simulatedPrice}
                            onChange={(e) => {
                                setSimulatedPrice(Number(e.target.value));
                                setSelectedStrategy('custom');
                            }}
                            className="w-full accent-primary cursor-pointer h-2 bg-surface-lighter rounded-lg"
                        />

                        <div className="flex justify-between text-[11px] text-text-muted font-medium pt-1">
                            <span>COGS Floor: {formatCurrency(selectedProduct.cogs)}</span>
                            <span>Competitor: {formatCurrency(selectedProduct.competitorPrice)}</span>
                            <span>Max Ceiling: {formatCurrency(Math.round(selectedProduct.currentPrice * 1.6))}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Real-Time Projected Outcomes & Economics (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-primary/30 shadow-2xl space-y-6 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border/40 pb-4">
                            <h3 className="font-bold text-lg text-text flex items-center gap-2">
                                <HiOutlineTrendingUp className="w-5 h-5 text-success" />
                                Projected Economic Impact
                            </h3>
                            <span className="text-xs font-semibold text-text-muted">7-Day Horizon</span>
                        </div>

                        {/* Metric Highlights */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-surface/70 border border-border/60">
                                <span className="text-[11px] uppercase font-bold text-text-muted">Unit Margin</span>
                                <div className="text-xl font-extrabold text-text mt-1">{formatCurrency(unitMargin)}</div>
                                <span className={`text-[11px] font-bold ${Number(marginPct) >= 20 ? 'text-success' : 'text-warning'}`}>
                                    {marginPct}% profit margin
                                </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-surface/70 border border-border/60">
                                <span className="text-[11px] uppercase font-bold text-text-muted">Sales Velocity</span>
                                <div className="text-xl font-extrabold text-text mt-1">{projectedUnits} units</div>
                                <span className={`text-[11px] font-bold ${projectedUnits >= baseWeeklyUnits ? 'text-success' : 'text-danger'}`}>
                                    {projectedUnits >= baseWeeklyUnits ? '▲' : '▼'} {Math.abs(Math.round((projectedUnits - baseWeeklyUnits) / baseWeeklyUnits * 100))}% vs baseline
                                </span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                            <div className="flex justify-between text-xs text-text-muted">
                                <span>Estimated Weekly Gross Revenue</span>
                                <span className="font-bold text-text">{formatCurrency(projectedRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-primary/10">
                                <span className="text-primary-light">Projected Net Gross Profit</span>
                                <span className="text-success text-base">{formatCurrency(projectedProfit)}</span>
                            </div>
                        </div>

                        {/* AI Elasticity Explainer */}
                        <div className="text-xs text-text-muted bg-surface-lighter/40 p-4 rounded-2xl border border-border/40 space-y-1.5 leading-relaxed">
                            <div className="font-bold text-text flex items-center gap-1.5 text-xs text-primary">
                                <HiOutlineSparkles className="w-4 h-4" />
                                Model Insights: Elasticity {selectedProduct.elasticity}
                            </div>
                            <p>
                                Based on real-time competitor tracking ({formatCurrency(selectedProduct.competitorPrice)}) and price elasticity, this simulation predicts that a {priceDiffPct >= 0 ? `+${(priceDiffPct * 100).toFixed(1)}%` : `${(priceDiffPct * 100).toFixed(1)}%`} change will yield <strong>{projectedUnits} weekly sales</strong> with <strong>{formatCurrency(projectedProfit)} total profit</strong>.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="pt-2">
                            <Link
                                to="/register"
                                className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 shadow-xl shadow-primary/25 group"
                            >
                                Connect Your Store to Launch AI Repricing
                                <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
