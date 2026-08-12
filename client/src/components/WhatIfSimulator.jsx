import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProducts, runSimulation, commitSimulationPrice } from '../api';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
    HiOutlineAdjustments, HiOutlineLightningBolt, HiOutlineCheckCircle,
    HiOutlineExclamation, HiOutlineTrendingUp, HiOutlineTrendingDown,
    HiOutlineCurrencyDollar, HiOutlineCube, HiOutlineScale,
    HiOutlineRefresh, HiOutlineInformationCircle, HiOutlineSparkles
} from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';
import ExplainWithAITag from './ExplainWithAITag';

export default function WhatIfSimulator({ initialProductId = null, onPriceCommitted = null }) {
    const { formatCurrency } = useCurrency();
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'advanced'

    // Simulation Input Parameters
    const [targetPrice, setTargetPrice] = useState(100);
    const [cogs, setCogs] = useState(60);
    const [competitorStrategy, setCompetitorStrategy] = useState('neutral');
    const [demandMultiplier, setDemandMultiplier] = useState(1.0);
    const [timeHorizonDays, setTimeHorizonDays] = useState(30);

    // Simulation State
    const [simulation, setSimulation] = useState(null);
    const [simulating, setSimulating] = useState(false);
    const [error, setError] = useState(null);

    // Commit Modal State
    const [showCommitModal, setShowCommitModal] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [syncChannels, setSyncChannels] = useState({ shopify: true, amazon: true, flipkart: true });

    // Fetch product list for dropdown
    useEffect(() => {
        setLoadingProducts(true);
        getProducts(1, 100)
            .then(res => {
                const list = res.data?.data || res.data || [];
                setProducts(list);
                if (list.length > 0 && !selectedProductId) {
                    setSelectedProductId(list[0]._id);
                }
            })
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));
    }, []);

    // Active product data
    const activeProduct = useMemo(() => {
        return products.find(p => p._id === selectedProductId) || null;
    }, [products, selectedProductId]);

    // When active product changes, sync base price & cogs
    useEffect(() => {
        if (activeProduct) {
            setTargetPrice(activeProduct.currentPrice || 100);
            setCogs(activeProduct.baseCost || Math.round((activeProduct.currentPrice || 100) * 0.6));
        }
    }, [activeProduct]);

    // Run simulation via API — MUST be defined before any useEffect that references it
    const handleRunSimulation = useCallback(async (customParams = null) => {
        setSimulating(true);
        setError(null);
        try {
            const payload = customParams || {
                productId: selectedProductId || null,
                targetPrice: Number(targetPrice),
                cogs: Number(cogs),
                competitorStrategy,
                demandMultiplier: Number(demandMultiplier),
                timeHorizonDays: Number(timeHorizonDays)
            };
            const res = await runSimulation(payload);
            setSimulation(res.data);
        } catch (err) {
            console.error('Simulation error:', err);
            setError('Failed to run simulation. Please try again.');
        } finally {
            setSimulating(false);
        }
    }, [selectedProductId, targetPrice, cogs, competitorStrategy, demandMultiplier, timeHorizonDays]);

    // Listen for launch_what_if_simulator events from AI Chat Assistant
    useEffect(() => {
        const handleLaunch = (e) => {
            const { productQuery, priceChange: newPrice } = e.detail || {};
            let matched = null;
            if (productQuery && products.length > 0) {
                const q = String(productQuery).toLowerCase().trim();
                matched = products.find(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
            }
            const pId = matched ? matched._id : selectedProductId;
            if (matched) {
                setSelectedProductId(matched._id);
            }

            let parsedPrice = targetPrice;
            if (newPrice) {
                const numericPrice = parseFloat(String(newPrice).replace(/[^0-9.]/g, ''));
                if (numericPrice && !isNaN(numericPrice)) {
                    parsedPrice = numericPrice;
                    setTargetPrice(numericPrice);
                }
            }

            // Scroll to simulator section
            const elem = document.getElementById('what-if-simulator-section');
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Trigger simulation
            setTimeout(() => {
                handleRunSimulation({
                    productId: pId || null,
                    targetPrice: Number(parsedPrice),
                    cogs: matched ? (matched.baseCost || Math.round(matched.currentPrice * 0.6)) : cogs,
                    competitorStrategy,
                    demandMultiplier,
                    timeHorizonDays
                });
            }, 250);
        };

        window.addEventListener('launch_what_if_simulator', handleLaunch);
        return () => window.removeEventListener('launch_what_if_simulator', handleLaunch);
    }, [products, selectedProductId, cogs, competitorStrategy, demandMultiplier, timeHorizonDays, targetPrice, handleRunSimulation]);

    // Initial run when active product changes
    useEffect(() => {
        if (selectedProductId) {
            handleRunSimulation();
        }
    }, [selectedProductId]);

    // Apply Scenario Presets
    const applyPreset = (presetKey) => {
        if (!simulation?.presets?.[presetKey]) return;
        const preset = simulation.presets[presetKey];
        const newTarget = preset.targetPrice || targetPrice;
        const newCogs = preset.cogs || cogs;
        const newStance = preset.competitorStrategy || competitorStrategy;
        const newMult = preset.demandMultiplier || demandMultiplier;

        if (preset.targetPrice) setTargetPrice(preset.targetPrice);
        if (preset.cogs) setCogs(preset.cogs);
        if (preset.competitorStrategy) setCompetitorStrategy(preset.competitorStrategy);
        if (preset.demandMultiplier) setDemandMultiplier(preset.demandMultiplier);

        toast.success(`Applied "${preset.name}" scenario`);

        // Run simulation immediately with preset params
        handleRunSimulation({
            productId: selectedProductId || null,
            targetPrice: Number(newTarget),
            cogs: Number(newCogs),
            competitorStrategy: newStance,
            demandMultiplier: Number(newMult),
            timeHorizonDays: Number(timeHorizonDays)
        });
    };

    // Commit Price Change
    const handleCommitPrice = async () => {
        if (!selectedProductId) {
            toast.error('Select an existing product to commit price change');
            return;
        }
        setCommitting(true);
        try {
            const res = await commitSimulationPrice({
                productId: selectedProductId,
                newPrice: Number(targetPrice),
                cogs: Number(cogs),
                simulationParams: {
                    expectedRevenueUplift: simulation?.deltas?.revenueUplift,
                    expectedProfitUplift: simulation?.deltas?.profitUplift,
                    competitorStrategy,
                    demandMultiplier,
                    timeHorizonDays
                }
            });
            toast.success(`Price committed! Updated ${res.data.product?.name || 'Product'} to ${formatCurrency(targetPrice)}`);
            setShowCommitModal(false);
            if (onPriceCommitted) onPriceCommitted(res.data);
            getProducts(1, 100).then(r => setProducts(r.data?.data || r.data || []));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to commit price change');
        } finally {
            setCommitting(false);
        }
    };

    const sim = simulation?.simulated;
    const base = simulation?.baseline;
    const deltas = simulation?.deltas;
    const opt = simulation?.optimalPricePoint;
    const comps = simulation?.competitorSummary;
    const verdict = simulation?.aiVerdict;

    return (
        <div className="glass-card p-6 border border-primary/20 space-y-6 animate-slide-up" id="what-if-simulator-section">
            {/* Simulator Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <HiOutlineSparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text flex items-center gap-2">
                            AI What-If Price Simulator
                            <ExplainWithAITag title="Explain with AI" contextData={{ type: 'simulator', simulation }} />
                        </h2>
                        <p className="text-xs text-text-muted">
                            Model demand elasticity, profit margins, and competitor response risk before committing price changes.
                        </p>
                    </div>
                </div>

                {/* Mode Toggle & Product Selector */}
                <div className="flex items-center gap-3">
                    {/* Simple vs Advanced View Toggle */}
                    <div className="bg-surface/80 p-1 rounded-xl border border-border flex items-center gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('simple')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${viewMode === 'simple' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'}`}
                        >
                            Simple View
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('advanced')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${viewMode === 'advanced' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'}`}
                        >
                            Advanced View
                        </button>
                    </div>

                    <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        disabled={loadingProducts}
                        className="bg-surface border border-border text-xs font-medium text-text rounded-xl px-3 py-2 focus:outline-none focus:border-primary cursor-pointer shadow-inner min-w-[200px]"
                    >
                        <option value="">-- Sandbox Mode (Custom) --</option>
                        {products.map(p => (
                            <option key={p._id} value={p._id}>
                                {p.name} ({formatCurrency(p.currentPrice)})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* AI Executive Summary & Verdict Banner */}
            {verdict && (
                <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    verdict.type === 'positive'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : verdict.type === 'negative'
                        ? 'bg-danger/10 border-danger/30'
                        : 'bg-warning/10 border-warning/30'
                }`}>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                verdict.type === 'positive'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : verdict.type === 'negative'
                                    ? 'bg-danger/20 text-danger border border-danger/40'
                                    : 'bg-warning/20 text-warning border border-warning/40'
                            }`}>
                                {verdict.label}
                            </span>
                            <span className="text-xs text-text-muted font-medium">AI Decision Summary</span>
                        </div>
                        <p className="text-sm font-semibold text-text leading-snug">
                            {verdict.summary}
                        </p>
                    </div>
                    <ExplainWithAITag
                        title="Why this decision?"
                        contextData={{ type: 'simulator_verdict', verdict, product: activeProduct?.name || 'Product', targetPrice }}
                    />
                </div>
            )}

            {/* Quick Presets Bar */}
            {simulation?.presets && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <HiOutlineLightningBolt className="text-warning" /> Scenario Presets:
                    </span>
                    <button
                        onClick={() => applyPreset('maximize_margin')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                        <HiOutlineTrendingUp className="w-3.5 h-3.5" /> Max Profit Margin (P* = {formatCurrency(opt?.price || 0)})
                    </button>
                    <button
                        onClick={() => applyPreset('market_growth')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
                    >
                        <HiOutlineCube className="w-3.5 h-3.5" /> Market Share Growth
                    </button>
                    <button
                        onClick={() => applyPreset('defend_undercut')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 transition-all flex items-center gap-1.5"
                    >
                        <HiOutlineScale className="w-3.5 h-3.5" /> Defend Undercut
                    </button>
                    <button
                        onClick={() => applyPreset('inflation_passthrough')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
                    >
                        <HiOutlineCurrencyDollar className="w-3.5 h-3.5" /> Inflation Pass-Through
                    </button>
                </div>
            )}

            {/* Main Grid: Control Desk & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Panel: Simulation Controls (5 cols) */}
                <div className="lg:col-span-5 space-y-5 bg-surface/40 p-5 rounded-2xl border border-border/40">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                        <HiOutlineAdjustments className="w-4 h-4 text-primary" /> Simulation Controls
                    </h3>

                    {/* Target Price Slider & Inputs */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <label className="font-semibold text-text">Proposed Target Price:</label>
                            <span className="text-base font-bold text-primary">{formatCurrency(targetPrice)}</span>
                        </div>
                        <input
                            type="range"
                            min={Math.max(1, Math.round(cogs * 1.01))}
                            max={Math.round((base?.price || targetPrice || 100) * 2.5)}
                            step={1}
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(Number(e.target.value))}
                            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={() => setTargetPrice(Math.round((base?.price || targetPrice) * 0.9))}
                                className="px-2 py-1 bg-surface border border-border rounded-md text-[11px] font-medium text-text-muted hover:text-text"
                            >
                                -10%
                            </button>
                            <button
                                onClick={() => setTargetPrice(Math.round((base?.price || targetPrice) * 0.95))}
                                className="px-2 py-1 bg-surface border border-border rounded-md text-[11px] font-medium text-text-muted hover:text-text"
                            >
                                -5%
                            </button>
                            <button
                                onClick={() => setTargetPrice(base?.price || targetPrice)}
                                className="px-2 py-1 bg-surface border border-border rounded-md text-[11px] font-medium text-primary hover:bg-primary/10"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setTargetPrice(Math.round((base?.price || targetPrice) * 1.05))}
                                className="px-2 py-1 bg-surface border border-border rounded-md text-[11px] font-medium text-text-muted hover:text-text"
                            >
                                +5%
                            </button>
                            <button
                                onClick={() => setTargetPrice(Math.round((base?.price || targetPrice) * 1.1))}
                                className="px-2 py-1 bg-surface border border-border rounded-md text-[11px] font-medium text-text-muted hover:text-text"
                            >
                                +10%
                            </button>
                            <input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(Number(e.target.value))}
                                className="w-20 ml-auto bg-surface border border-border text-xs font-bold text-text rounded-lg px-2 py-1 text-right focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* COGS (Unit Cost) Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <label className="font-semibold text-text-muted">Unit Base Cost (COGS):</label>
                            <span className="font-semibold text-text">{formatCurrency(cogs)}</span>
                        </div>
                        <input
                            type="number"
                            value={cogs}
                            onChange={(e) => setCogs(Number(e.target.value))}
                            className="w-full bg-surface border border-border text-xs font-medium text-text rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Competitor Strategy */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-muted">Competitor Stance Model:</label>
                        <select
                            value={competitorStrategy}
                            onChange={(e) => setCompetitorStrategy(e.target.value)}
                            className="w-full bg-surface border border-border text-xs font-medium text-text rounded-xl px-3 py-2 focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value="neutral">Neutral / Static (No Competitor Reaction)</option>
                            <option value="aggressive">Aggressive Price Match (Competitors cut prices to defend)</option>
                            <option value="follower">Price Follower (Competitors match our price shifts)</option>
                        </select>
                    </div>

                    {/* Demand Multiplier Slider */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <label className="font-semibold text-text-muted">Market Demand Multiplier:</label>
                            <span className="font-bold text-accent">{demandMultiplier}x</span>
                        </div>
                        <input
                            type="range"
                            min={0.5}
                            max={2.0}
                            step={0.05}
                            value={demandMultiplier}
                            onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                        <div className="flex justify-between text-[10px] text-text-muted">
                            <span>0.5x (Slump)</span>
                            <span>1.0x (Normal)</span>
                            <span>2.0x (Surge)</span>
                        </div>
                    </div>

                    {/* Time Horizon Segmented Control */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-muted">Forecast Horizon:</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[7, 30, 90].map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    onClick={() => setTimeHorizonDays(days)}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all ${timeHorizonDays === days
                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                        : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter'
                                        }`}
                                >
                                    {days} Days
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons: Run Simulation & Commit Price */}
                    <div className="space-y-2 pt-2">
                        <button
                            type="button"
                            onClick={() => handleRunSimulation()}
                            disabled={simulating}
                            className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-accent text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                        >
                            {simulating ? (
                                <>
                                    <HiOutlineRefresh className="w-4 h-4 animate-spin text-white" />
                                    Calculating Simulation...
                                </>
                            ) : (
                                <>
                                    <HiOutlineSparkles className="w-4 h-4 text-warning animate-bounce" />
                                    Run AI Simulation ({formatCurrency(targetPrice)})
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCommitModal(true)}
                            disabled={!selectedProductId}
                            className="w-full bg-surface border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <HiOutlineCheckCircle className="w-4 h-4" />
                            Commit Price Change
                        </button>
                    </div>
                    {!selectedProductId && (
                        <p className="text-[11px] text-warning text-center">
                            Select a product above to commit price changes.
                        </p>
                    )}
                </div>

                {/* Right Panel: Simulated KPIs & Visual Analytics (7 cols) */}
                <div className="lg:col-span-7 space-y-6">

                    {simulating && !simulation ? (
                        <div className="h-64 flex flex-col items-center justify-center text-text-muted">
                            <HiOutlineRefresh className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p className="text-xs font-medium">Computing high-precision elasticity & demand curves...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl text-xs flex items-center gap-2">
                            <HiOutlineExclamation className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* KPI Scoreboard Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Revenue Metric */}
                                <div className="glass-card p-4 border-l-4 border-l-primary">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Projected Revenue</p>
                                    <p className="text-xl font-bold text-text mt-0.5">{formatCurrency(sim?.predictedRevenue || 0)}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
                                        <span className={(deltas?.revenueUplift || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                            {(deltas?.revenueUplift || 0) >= 0 ? '+' : ''}{formatCurrency(deltas?.revenueUplift || 0)}
                                        </span>
                                        <span className="text-[10px] text-text-muted">({deltas?.revenueUpliftPct || 0}%)</span>
                                    </div>
                                </div>

                                {/* Net Profit Metric */}
                                <div className="glass-card p-4 border-l-4 border-l-emerald-500">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Projected Net Profit</p>
                                    <p className="text-xl font-bold text-text mt-0.5">{formatCurrency(sim?.predictedProfit || 0)}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
                                        <span className={(deltas?.profitUplift || 0) >= 0 ? 'text-emerald-400' : 'text-danger'}>
                                            {(deltas?.profitUplift || 0) >= 0 ? '+' : ''}{formatCurrency(deltas?.profitUplift || 0)}
                                        </span>
                                        <span className="text-[10px] text-text-muted">({deltas?.profitUpliftPct || 0}%)</span>
                                    </div>
                                </div>

                                {/* Sales Volume Metric */}
                                <div className="glass-card p-4 border-l-4 border-l-accent">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Forecast Volume</p>
                                    <p className="text-xl font-bold text-text mt-0.5">{sim?.predictedVolume || 0} units</p>
                                    <p className="text-[10px] text-text-muted mt-1">
                                        Break-even: <span className="font-semibold text-text">{deltas?.breakevenVolume || 0} units</span>
                                    </p>
                                </div>

                                {/* Profit Margin % & Elasticity */}
                                <div className="glass-card p-4 border-l-4 border-l-purple-500">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Net Margin %</p>
                                    <p className="text-xl font-bold text-purple-400 mt-0.5">{sim?.marginPct || 0}%</p>
                                    <p className="text-[10px] text-text-muted mt-1">
                                        Elasticity ($\epsilon$): <span className="font-semibold text-text">{sim?.effectiveElasticity || -1.0}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Confidence Interval Readout */}
                            {sim?.confidenceBounds && (
                                <div className="p-3 bg-surface/60 border border-primary/15 rounded-xl flex items-center justify-between text-xs">
                                    <span className="text-text-muted flex items-center gap-1.5 font-medium">
                                        <HiOutlineInformationCircle className="text-primary w-4 h-4" /> 95% Confidence Bounds (P10 - P90):
                                    </span>
                                    <span className="font-semibold text-text">
                                        Revenue: <span className="text-primary-light">{formatCurrency(sim.confidenceBounds.revenueP10)}</span> – <span className="text-primary-light">{formatCurrency(sim.confidenceBounds.revenueP90)}</span>
                                        <span className="mx-2 text-border">|</span>
                                        Profit: <span className="text-emerald-400">{formatCurrency(sim.confidenceBounds.profitP10)}</span> – <span className="text-emerald-400">{formatCurrency(sim.confidenceBounds.profitP90)}</span>
                                    </span>
                                </div>
                            )}

                            {/* Chart: Revenue & Profit Sensitivity Curve */}
                            <div className="glass-card p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                                        <HiOutlineTrendingUp className="text-primary" /> Revenue & Net Profit Peak Sensitivity Curve
                                    </h4>
                                    {opt?.price && (
                                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Optimal P* = {formatCurrency(opt.price)}
                                        </span>
                                    )}
                                </div>

                                <div className="h-56 w-full">
                                    {simulation?.sensitivityCurve ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={simulation.sensitivityCurve}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                                                <XAxis dataKey="price" tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" $" />
                                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: '#0d1326',
                                                        border: '1px solid rgba(99,102,241,0.2)',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        color: '#f1f5f9'
                                                    }}
                                                    formatter={(val, name) => [formatCurrency(val), name === 'revenue' ? 'Revenue' : 'Net Profit']}
                                                />
                                                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue" />
                                                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={false} name="Net Profit" />
                                                {opt?.price && (
                                                    <ReferenceLine x={opt.price} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Optimal P*', fill: '#10b981', fontSize: 10 }} />
                                                )}
                                                {targetPrice && (
                                                    <ReferenceLine x={targetPrice} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'Target', fill: '#f59e0b', fontSize: 10 }} />
                                                )}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-xs text-text-muted">No curve data</div>
                                    )}
                                </div>
                            </div>

                            {/* Competitor Positioning Spectrum */}
                            {comps && comps.count > 0 && (
                                <div className="p-4 bg-surface/30 rounded-xl border border-border/40 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="text-text-muted font-medium">Competitor Market Range:</p>
                                        <p className="text-text font-bold mt-0.5">
                                            {formatCurrency(comps.min)} – {formatCurrency(comps.max)} (Avg: {formatCurrency(comps.average)})
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-text-muted font-medium">Undercut Risk Score:</p>
                                        <span className={`text-sm font-bold ${sim?.undercutRisk > 50 ? 'text-danger' : 'text-emerald-400'}`}>
                                            {sim?.undercutRisk || 0}% ({sim?.undercutRisk > 50 ? 'High' : 'Low'})
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* Commit Confirmation Modal */}
            {showCommitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card max-w-lg w-full p-6 space-y-5 border border-primary/30 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-border/50 pb-3">
                            <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                <HiOutlineCheckCircle className="text-emerald-400 w-5 h-5" /> Confirm Price Commit
                            </h3>
                            <button
                                onClick={() => setShowCommitModal(false)}
                                className="text-text-muted hover:text-text text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-text-muted">
                            <p>You are about to commit a new price for <strong className="text-text">{activeProduct?.name || 'Selected Product'}</strong>.</p>

                            <div className="p-3 bg-surface rounded-xl space-y-2 border border-border/50">
                                <div className="flex justify-between">
                                    <span>Current Price:</span>
                                    <span className="font-semibold text-text">{formatCurrency(base?.price || activeProduct?.currentPrice || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>New Target Price:</span>
                                    <span className="font-bold text-primary text-sm">{formatCurrency(targetPrice)}</span>
                                </div>
                                <div className="flex justify-between border-t border-border/40 pt-2">
                                    <span>Expected Monthly Profit Uplift:</span>
                                    <span className={(deltas?.profitUplift || 0) >= 0 ? 'font-bold text-emerald-400' : 'font-bold text-danger'}>
                                        {(deltas?.profitUplift || 0) >= 0 ? '+' : ''}{formatCurrency(deltas?.profitUplift || 0)}
                                    </span>
                                </div>
                            </div>

                            <p className="font-semibold text-text pt-2">Multi-Channel Price Syncing:</p>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={syncChannels.shopify}
                                        onChange={(e) => setSyncChannels({ ...syncChannels, shopify: e.target.checked })}
                                        className="rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span>Sync to Shopify Store</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={syncChannels.amazon}
                                        onChange={(e) => setSyncChannels({ ...syncChannels, amazon: e.target.checked })}
                                        className="rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span>Sync to Amazon Seller Central</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowCommitModal(false)}
                                className="px-4 py-2 bg-surface hover:bg-surface-lighter text-text-muted text-xs font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCommitPrice}
                                disabled={committing}
                                className="btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/30"
                            >
                                {committing ? <HiOutlineRefresh className="w-4 h-4 animate-spin" /> : <HiOutlineCheckCircle className="w-4 h-4" />}
                                Confirm & Update Price
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
