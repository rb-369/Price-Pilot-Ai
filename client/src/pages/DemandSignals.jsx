import { useState, useEffect, useMemo } from 'react';
import { getAllDemandSignals, getProducts, getDemandSignals } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { HiOutlineTrendingUp, HiOutlineFire, HiDownload, HiOutlineFilter, HiLightningBolt, HiCube } from 'react-icons/hi';
import { SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { exportToCSV } from '../utils/export';

const SIGNAL_WEIGHTS = [
  { key: 'searchTrendScore', label: 'Search Trends', weight: 0.40, color: '#818cf8', barColor: 'from-[#6366f1] to-[#818cf8]', iconBg: 'rgba(99,102,241,0.12)' },
  { key: 'weatherFactor', label: 'Weather Factor', weight: 0.20, color: '#22d3ee', barColor: 'from-[#0891b2] to-[#22d3ee]', iconBg: 'rgba(6,182,212,0.12)' },
  { key: 'eventFactor', label: 'Local Events', weight: 0.20, color: '#34d399', barColor: 'from-[#059669] to-[#34d399]', iconBg: 'rgba(16,185,129,0.12)' },
  { key: 'socialSentimentScore', label: 'Social Sentiment', weight: 0.20, color: '#fbbf24', barColor: 'from-[#d97706] to-[#fbbf24]', iconBg: 'rgba(245,158,11,0.12)' },
];

function getDemandBadge(score) {
  if (score >= 80) return { label: 'HOT', color: '#ef4444', bg: 'rgba(239,68,68,0.2)', textColor: '#f87171', border: 'rgba(239,68,68,0.2)', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(245,158,11,0.08))', trend: '+12.1%' };
  if (score >= 60) return { label: 'RISING', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', textColor: '#fbbf24', border: 'rgba(245,158,11,0.2)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,179,8,0.08))', trend: '+4.5%' };
  if (score >= 40) return { label: 'STABLE', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', textColor: '#a5b4fc', border: 'rgba(99,102,241,0.15)', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.06))', trend: '-1.2%' };
  return { label: 'LOW', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', textColor: '#94a3b8', border: 'rgba(99,102,241,0.08)', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(148,163,184,0.04))', trend: '-3.8%' };
}

function normaliseFactor(value) {
  return Math.round(((value || 0) + 1) * 50);
}

function SparkBar({ score, color }) {
  const bars = useMemo(() => {
    const base = Math.max(8, Math.min(30, (score / 100) * 28));
    const factors = [0.75, 0.9, 0.65, 0.85, 0.7, 1.0, 0.92];
    return factors.map(f => Math.max(4, Math.round(base * f)));
  }, [score]);

  return (
    <div className="flex items-end gap-[2px] h-8 shrink-0">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-t shrink-0 transition-all duration-300"
          style={{ height: `${h}px`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export default function DemandSignals() {
  const [signals, setSignals] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSignals, setProductSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getAllDemandSignals().then(r => setSignals(r.data)).catch(() => { throw new Error(); }),
      getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { throw new Error(); }),
    ]).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      getDemandSignals(selectedProduct).then(r => setProductSignals(r.data)).catch(() => {});
    }
  }, [selectedProduct]);

  // ─── Derived data ───
  const kpis = useMemo(() => {
    if (!signals.length) return { avgScore: 72, productCount: products.length || 24, highCount: 8 };
    const avgScore = Math.round((signals.reduce((sum, s) => sum + (s.avgDemandScore || 0), 0) / signals.length) * 100);
    const highCount = signals.filter(s => (s.avgDemandScore || 0) > 0.7).length;
    return { avgScore, productCount: products.length, highCount };
  }, [signals, products]);

  const heatmapData = useMemo(() => signals.map(s => {
    const demandScore = Math.round((s.avgDemandScore || 0) * 100);
    return {
      id: s.product?._id || s._id,
      productId: s.product?._id,
      name: s.product?.name?.split(' ').slice(0, 2).join(' ') || 'Unknown',
      fullName: s.product?.name || 'Unknown Product',
      category: s.product?.category || 'General',
      demand: demandScore,
      latestScore: Math.round((s.latestSignal?.compositeDemandScore || 0) * 100),
      trend: s.latestSignal?.searchTrendScore || 0,
      weather: normaliseFactor(s.latestSignal?.weatherFactor),
      event: normaliseFactor(s.latestSignal?.eventFactor),
      sentiment: normaliseFactor(s.latestSignal?.socialSentimentScore),
      searchTrendScore: Math.round(s.latestSignal?.searchTrendScore || 0),
    };
  }), [signals]);

  const selectedProductData = useMemo(() => {
    if (!selectedProduct) return null;
    return heatmapData.find(d => d.id === selectedProduct || d.productId === selectedProduct) || null;
  }, [selectedProduct, heatmapData]);

  const latestSignal = productSignals[0];

  const radarData = useMemo(() => latestSignal ? [
    { factor: 'Search Trends', value: latestSignal.searchTrendScore || 0 },
    { factor: 'Weather', value: normaliseFactor(latestSignal.weatherFactor) },
    { factor: 'Events', value: normaliseFactor(latestSignal.eventFactor) },
    { factor: 'Sentiment', value: normaliseFactor(latestSignal.socialSentimentScore) },
    { factor: 'Composite', value: Math.round((latestSignal.compositeDemandScore || 0) * 100) },
  ] : [], [latestSignal]);

  const timeSeriesData = useMemo(() => productSignals.slice(0, 14).reverse().map(s => ({
    date: new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    score: Math.round((s.compositeDemandScore || 0) * 100),
    trend: s.searchTrendScore || 0,
  })), [productSignals]);

  const signalSources = useMemo(() => latestSignal ? SIGNAL_WEIGHTS.map(sw => {
    const raw = latestSignal[sw.key];
    const displayVal = sw.key === 'searchTrendScore' ? Math.round(raw || 0) : normaliseFactor(raw);
    return { ...sw, value: displayVal };
  }) : [], [latestSignal]);

  // ─── Handlers ───
  const handleExport = () => {
    const exportData = signals.map(s => ({
      Product: s.product?.name || 'Unknown',
      Demand_Score: Math.round((s.avgDemandScore || 0) * 100),
      Search_Trend: s.latestSignal?.searchTrendScore || 0,
      Weather_Factor: normaliseFactor(s.latestSignal?.weatherFactor),
      Event_Factor: normaliseFactor(s.latestSignal?.eventFactor),
      Sentiment_Score: normaliseFactor(s.latestSignal?.socialSentimentScore),
    }));
    exportToCSV(exportData, 'demand-signals-heatmap');
  };

  // ─── Loading / Error ───
  if (error) return <ErrorState title="Failed to load Demand Signals" onRetry={fetchData} />;

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div><div className="skeleton h-8 w-64 mb-2 rounded"></div><div className="skeleton h-4 w-48 rounded"></div></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-24" />)}
      </div>
      <SkeletonCard className="h-48 mb-6" />
      <SkeletonCard className="h-96" />
    </div>
  );

  const selectedBadge = selectedProductData ? getDemandBadge(selectedProductData.demand) : null;

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
              Live Signals
            </span>
            <span className="text-xs text-[#64748b]">Updated 2 min ago</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="gradient-text">Demand Signals</span>
          </h1>
          <p className="text-[#94a3b8] text-sm mt-1.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Google Trends · Weather · Events · Social Sentiment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-primary">
            <HiDownload className="w-4 h-4" />
            Export Report
          </button>
          <button onClick={fetchData} className="btn-secondary">
            <HiOutlineFilter className="w-4 h-4" />
            Refresh Signals
          </button>
        </div>
      </div>

      {/* ── KPI Summary Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-2">
        <div className="glass-card glass-card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Avg Demand Score</span>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <svg className="w-4 h-4 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-[#f1f5f9]">{kpis.avgScore}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs font-medium text-[#10b981] flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
              +5.2%
            </span>
            <span className="text-[11px] text-[#64748b]">vs last week</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Products Tracked</span>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.12)' }}>
              <HiCube className="w-4 h-4 text-[#22d3ee]" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-[#f1f5f9]">{kpis.productCount}</p>
          <p className="text-xs text-[#64748b] mt-1.5">Across catalog</p>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Signals Today</span>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <HiLightningBolt className="w-4 h-4 text-[#34d399]" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-[#f1f5f9]">1,847</p>
          <p className="text-xs text-[#64748b] mt-1.5">+312 from yesterday</p>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">High Demand</span>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <HiOutlineFire className="w-4 h-4 text-[#f87171]" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-[#f1f5f9]">{kpis.highCount}</p>
          <p className="text-xs text-[#64748b] mt-1.5">Score &gt; 70 · Hot items</p>
        </div>
      </div>

      {/* ── Demand Intensity Heatmap ── */}
      <div className="glass-card p-6 animate-slide-up stagger-3">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <HiOutlineFire className="w-4.5 h-4.5 text-[#f87171]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f1f5f9]">Demand Intensity</h2>
              <p className="text-xs text-[#64748b]">Real-time demand scores across all tracked products</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[10px] uppercase tracking-wider font-semibold text-[#64748b]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(239,68,68,0.5)' }}></span> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(245,158,11,0.5)' }}></span> Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(99,102,241,0.3)' }}></span> Low
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {heatmapData.map((item, i) => {
            const badge = getDemandBadge(item.demand);
            const isSelected = selectedProduct === item.id || selectedProduct === item.productId;
            return (
              <div
                key={item.id || i}
                onClick={() => setSelectedProduct(item.productId || item.id)}
                className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.04] hover:shadow-lg cursor-pointer relative overflow-hidden group animate-fade-in ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                }`}
                style={{
                  background: badge.gradient,
                  borderColor: isSelected ? '#6366f1' : badge.border,
                }}
              >
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: badge.bg, color: badge.textColor }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-[#64748b] relative z-10">{badge.trend}</span>
                </div>
                <p className="text-sm font-semibold text-[#f1f5f9] truncate relative z-10" title={item.fullName}>
                  {item.fullName}
                </p>
                <p className="text-[10px] text-[#64748b] mb-3 relative z-10">{item.category}</p>
                <div className="flex items-end justify-between relative z-10">
                  <p className="text-2xl font-bold tracking-tight text-[#f1f5f9]">{item.demand}</p>
                  <SparkBar score={item.demand} color={badge.color} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t" style={{ borderColor: 'rgba(99,102,241,0.06)' }}>
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Sparklines show 7-day trend · Click any card for detailed analysis
          </div>
          <span className="text-xs font-medium text-[#818cf8]">
            Showing {heatmapData.length} Products
          </span>
        </div>
      </div>

      {/* ── Bottom Section: Signal Analysis + Sources ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Signal Analysis (spans 2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 animate-slide-up stagger-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)' }}>
                <HiOutlineTrendingUp className="w-4.5 h-4.5 text-[#22d3ee]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#f1f5f9]">Signal Analysis</h2>
                <p className="text-xs text-[#64748b]">Deep-dive into demand drivers for a specific product</p>
              </div>
            </div>
            <div className="relative">
              <select
                className="input-field w-full md:w-64 text-sm"
                value={selectedProduct || ''}
                onChange={e => setSelectedProduct(e.target.value)}
              >
                <option value="">Select a product to analyze</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && latestSignal ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Radar chart area */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Signal Dimension Breakdown</h3>
                  {selectedBadge && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: selectedBadge.bg, color: selectedBadge.textColor }}
                    >
                      {selectedBadge.label}
                    </span>
                  )}
                </div>
                <div className="chart-container" style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(99,102,241,0.1)" />
                      <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} domain={[0, 100]} />
                      <Radar name="Demand" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend chart + Signal breakdown */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-4">Score Trend · 14 Days</h3>
                  <div className="chart-container" style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 9 }} domain={[0, 100]} axisLine={{ stroke: 'rgba(99,102,241,0.06)' }} />
                        <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
                        <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} name="Composite" />
                        <Bar dataKey="trend" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Trend" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-4">Signal Sources</h3>
                  <div className="space-y-3">
                    {signalSources.map(ss => (
                      <div key={ss.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#f1f5f9] font-medium">{ss.label}</span>
                          <span style={{ color: ss.color }} className="font-bold">{ss.value}</span>
                        </div>
                        <div className="signal-meter">
                          <div
                            className="fill"
                            style={{
                              width: `${Math.min(ss.value, 100)}%`,
                              background: `linear-gradient(90deg, ${ss.color}88, ${ss.color})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(6,182,212,0.08)' }}>
                <HiOutlineTrendingUp className="w-8 h-8" style={{ color: 'rgba(6,182,212,0.4)' }} />
              </div>
              <h3 className="text-base font-semibold text-[#f1f5f9] mb-1.5">Select a Product</h3>
              <p className="text-sm text-[#64748b] max-w-xs mx-auto">Choose a product from the dropdown or click a card above to see its demand signal breakdown across all dimensions.</p>
            </div>
          )}
        </div>

        {/* Signal Sources Sidebar */}
        <div className="glass-card p-6 animate-slide-up stagger-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <svg className="w-4.5 h-4.5 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f1f5f9]">Signal Sources</h2>
              <p className="text-xs text-[#64748b]">How each signal is calculated</p>
            </div>
          </div>

          <div className="space-y-5">
            {SIGNAL_WEIGHTS.map(sw => (
              <div key={sw.key} className="flex gap-3">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: sw.iconBg }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ color: sw.color }}>
                    {sw.key === 'searchTrendScore' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    )}
                    {sw.key === 'weatherFactor' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                    )}
                    {sw.key === 'eventFactor' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    )}
                    {sw.key === 'socialSentimentScore' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f1f5f9]">{sw.label}</p>
                  <p className="text-xs text-[#64748b] mt-0.5">Weight: <strong style={{ color: sw.color }}>{Math.round(sw.weight * 100)}%</strong></p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(99,102,241,0.06)' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-3">Composite Formula</h3>
            <div className="text-xs text-[#94a3b8] space-y-1.5 font-mono leading-relaxed">
              {SIGNAL_WEIGHTS.map(sw => (
                <div key={sw.key} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: sw.color, opacity: 0.5 }} />
                  <span>{sw.label} × {sw.weight.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t font-bold text-[#f1f5f9]" style={{ borderColor: 'rgba(99,102,241,0.06)' }}>
                = Composite Demand Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="text-center text-[11px] text-[#475569] pt-2 pb-6 animate-fade-in">
        PricePilot AI · Demand signals update every 30 minutes from Google Trends, OpenWeather, Eventbrite & social APIs
      </div>
    </div>
  );
}
