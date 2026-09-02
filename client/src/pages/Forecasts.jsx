import { useState, useEffect, useMemo } from 'react';
import { getForecasts, getProducts, generateForecast, getJobStatus } from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlineTrendingUp,
  HiOutlineRefresh,
  HiOutlineExclamation,
  HiDownload,
  HiOutlineCube,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineSearch,
  HiOutlineChip
} from 'react-icons/hi';
import AskAIButton from '../components/AskAIButton';
import { SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { exportToCSV } from '../utils/export';

export default function Forecasts() {
  const [forecasts, setForecasts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getForecasts().then(r => setForecasts(r.data.data || r.data)).catch(() => { throw new Error(); }),
      getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { throw new Error(); }),
    ]).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async (productId) => {
    setGenerating(productId);
    try {
      const res = await generateForecast(productId, 30);
      if (res.data.status === 'queued') {
        toast.success('AI forecast job queued...');
        const jobId = res.data.jobId;

        const poll = setInterval(async () => {
          try {
            const statusRes = await getJobStatus(jobId);
            if (statusRes.data.status === 'completed') {
              clearInterval(poll);
              setForecasts(prev => [statusRes.data.result, ...prev]);
              toast.success('AI Forecast generated!');
              setGenerating(null);
            } else if (statusRes.data.status === 'failed') {
              clearInterval(poll);
              toast.error('AI forecast job failed.');
              setGenerating(null);
            }
          } catch {
            clearInterval(poll);
            toast.error('Error checking job status');
            setGenerating(null);
          }
        }, 2000);
      } else {
        setForecasts(prev => [res.data, ...prev]);
        toast.success('Forecast generated!');
        setGenerating(null);
      }
    } catch {
      toast.error('Forecast generation failed — check AI service.');
      setGenerating(null);
    }
  };

  const getProductDetails = (f) => {
    const pId = typeof f.productId === 'object' ? f.productId?._id : f.productId;
    const matched = products.find(p => String(p._id) === String(pId));
    const name =
      (typeof f.productId === 'object' && f.productId?.name) ||
      matched?.name ||
      f.productName ||
      f.product?.name ||
      f.reason?.match(/Demand for (.+?) is projected/i)?.[1] ||
      'Product';
    const currentStock =
      f.currentStock ??
      (typeof f.productId === 'object' ? f.productId?.stockLevel : null) ??
      matched?.stockLevel ??
      0;
    return { name, currentStock };
  };

  const handleExport = () => {
    const exportData = forecasts.map(f => {
      const { name, currentStock } = getProductDetails(f);
      return {
        Product: name,
        Forecast_Range_Days: f.forecastRange || 30,
        Predicted_Demand: f.predictedDemand,
        Current_Stock: currentStock,
        Recommended_Increase: f.recommendedStockIncrease,
        Confidence_Score: f.confidenceScore,
        Reason: f.reason
      };
    });
    exportToCSV(exportData, 'inventory-forecasts');
  };

  // ─── Analytics KPIs ───
  const kpis = useMemo(() => {
    if (!forecasts.length) return { total: 0, atRisk: 0, avgConfidence: 0, totalReorder: 0 };
    const atRisk = forecasts.filter(f => {
      const { currentStock } = getProductDetails(f);
      return f.predictedDemand > currentStock;
    }).length;
    const avgConfidence = Math.round(
      (forecasts.reduce((sum, f) => sum + (f.confidenceScore || 0.85), 0) / forecasts.length) * 100
    );
    const totalReorder = forecasts.reduce((sum, f) => sum + (f.recommendedStockIncrease || 0), 0);
    return { total: forecasts.length, atRisk, avgConfidence, totalReorder };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecasts, products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchQuery = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  if (error) return <ErrorState title="Failed to load Inventory Forecasts" onRetry={fetchData} />;

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div><div className="skeleton h-8 w-64 mb-2 rounded"></div><div className="skeleton h-4 w-48 rounded"></div></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-24" />)}
      </div>
      <SkeletonCard className="h-44 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-64" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-slide-up stagger-1">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8] animate-pulse"></span>
              AI Forecast Engine
            </span>
            <span className="text-xs text-text-muted">Prophet &amp; Holt-Winters Models</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text">
            <span className="gradient-text">Inventory Forecasts</span>
          </h1>
          <p className="text-text-muted text-sm mt-1.5 flex items-center gap-2">
            <HiOutlineChip className="w-4 h-4 text-primary-light" />
            30–60 Day AI Demand Predictions &amp; Automated Reorder Recommendations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {forecasts.length > 0 && (
            <button onClick={handleExport} className="btn-primary">
              <HiDownload className="w-4 h-4" />
              Export CSV
            </button>
          )}
          <button onClick={fetchData} className="btn-secondary">
            <HiOutlineRefresh className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        /* ── Empty State ── */
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <HiOutlineTrendingUp className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">No Products Found</h2>
          <p className="text-text-muted max-w-md mx-auto mb-8">
            Add products to your catalog to unlock 30-day demand predictions, stock depletion risk alerts, and intelligent reorder suggestions.
          </p>
          <a href="/products" className="btn-primary">
            Add Your First Product
          </a>
        </div>
      ) : (
        <>
          {/* ── Top KPI Analytics Bar ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-2">
            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Forecasts</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <HiOutlineCube className="w-4 h-4 text-primary-light" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">{kpis.total}</p>
              <p className="text-xs text-text-muted mt-1.5">Active predictions</p>
            </div>

            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Stock Depletion Risk</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <HiOutlineExclamation className="w-4 h-4 text-danger" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">{kpis.atRisk}</p>
              <p className="text-xs text-text-muted mt-1.5">Products needing reorder</p>
            </div>

            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Avg Confidence</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <HiOutlineShieldCheck className="w-4 h-4 text-success" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">{kpis.avgConfidence}%</p>
              <p className="text-xs text-text-muted mt-1.5">Model accuracy score</p>
            </div>

            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Recommended Units</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <HiOutlineLightningBolt className="w-4 h-4 text-warning" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">+{kpis.totalReorder}</p>
              <p className="text-xs text-text-muted mt-1.5">Suggested reorder volume</p>
            </div>
          </div>

          {/* ── Generate Forecast Selector Bar ── */}
          <div className="glass-card p-6 animate-slide-up stagger-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)' }}>
                  <HiOutlineChip className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text">Generate AI Forecast</h2>
                  <p className="text-xs text-text-muted">Search or select a product to run Prophet &amp; Holt-Winters predictive model</p>
                </div>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search all products..."
                    className="input-field w-full text-xs py-2 pr-3"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>

                {categories.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface/60 text-text-muted hover:text-text border border-border'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-72 overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const isGenerating = generating === p._id;
                  return (
                    <button
                      key={p._id}
                      onClick={() => handleGenerate(p._id)}
                      disabled={isGenerating}
                      className="p-3.5 bg-surface/50 border border-border rounded-xl text-left hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">
                          {p.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stockLevel < 20 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                          {p.stockLevel < 20 ? 'Low' : 'OK'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text truncate group-hover:text-primary-light transition-colors" title={p.name}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">
                        {p.stockLevel} units in stock
                      </p>
                      {isGenerating && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary-light font-semibold">
                          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Generating...
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted text-xs">
                No products found matching <span className="text-text font-semibold">"{searchQuery}"</span>
              </div>
            )}
          </div>

          {/* ── Forecast Cards Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forecasts.map((f, i) => {
              const { name: productName, currentStock } = getProductDetails(f);
              const demandPct = currentStock > 0 ? Math.round((f.predictedDemand / currentStock) * 100) : 100;
              const isRisk = f.predictedDemand > currentStock;
              const confidence = f.confidenceScore ? Math.round(f.confidenceScore * 100) : 88;

              return (
                <div
                  key={i}
                  className={`glass-card p-6 animate-slide-up glass-card-hover ${
                    isRisk ? 'border-danger/30' : 'border-border'
                  }`}
                  style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                >
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isRisk ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                        }}
                      >
                        {isRisk ? (
                          <HiOutlineExclamation className="w-5 h-5 text-danger animate-pulse" />
                        ) : (
                          <HiOutlineShieldCheck className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-text text-base leading-tight">
                            {productName}
                          </h3>
                          <AskAIButton
                            variant="chip"
                            label="Ask Copilot"
                            prompt={`Analyze demand forecast for ${productName}: Current stock is ${currentStock}, predicted demand is ${f.predictedDemand} units, recommended increase is ${f.recommendedStockIncrease} units.`}
                            contextData={{ productName, currentStock, predictedDemand: f.predictedDemand, recommendedStockIncrease: f.recommendedStockIncrease }}
                          />
                        </div>
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">
                          {f.forecastRange || 30}-Day Demand Prediction
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          isRisk
                            ? 'bg-danger/15 text-danger border border-danger/20'
                            : 'bg-success/15 text-success border border-success/20'
                        }`}
                      >
                        {isRisk ? 'Depletion Risk' : 'Optimal Stock'}
                      </span>
                      <span className="text-[11px] text-text-muted font-medium">
                        {confidence}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* 3 Metrics Callout Boxes */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p className="text-xl font-extrabold text-text">{f.predictedDemand}</p>
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mt-0.5">
                        Predicted
                      </p>
                    </div>

                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p className="text-xl font-extrabold text-text">{currentStock}</p>
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mt-0.5">
                        Current Stock
                      </p>
                    </div>

                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p
                        className={`text-xl font-extrabold ${
                          f.recommendedStockIncrease > 0 ? 'text-warning' : 'text-success'
                        }`}
                      >
                        +{f.recommendedStockIncrease}
                      </p>
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mt-0.5">
                        Reorder Units
                      </p>
                    </div>
                  </div>

                  {/* Demand vs Stock Gauge Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-muted font-medium">Stock Coverage vs Demand</span>
                      <span className={`font-bold ${demandPct > 100 ? 'text-danger' : 'text-success'}`}>
                        {demandPct}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          demandPct > 100
                            ? 'bg-gradient-to-r from-danger to-red-400'
                            : demandPct > 70
                            ? 'bg-gradient-to-r from-warning to-amber-400'
                            : 'bg-gradient-to-r from-success to-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, demandPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Explanation / Reasoning Box */}
                  <div className="p-3.5 rounded-xl bg-surface/60 border border-border text-xs text-text-muted leading-relaxed flex items-start gap-2">
                    <HiOutlineChip className="w-4 h-4 text-primary-light shrink-0 mt-0.5" />
                    <span>{f.reason}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {forecasts.length === 0 && (
            <div className="glass-card p-12 text-center text-text-muted animate-slide-up">
              <HiOutlineTrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
              <h3 className="text-lg font-semibold text-text mb-1">No Forecasts Generated Yet</h3>
              <p className="text-sm text-text-muted">
                Click on any product above to trigger AI demand forecasting and stock reorder recommendations.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
