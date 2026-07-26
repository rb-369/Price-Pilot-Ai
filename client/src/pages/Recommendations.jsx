import { useState, useEffect, useMemo } from 'react';
import {
  getRecommendations,
  getProducts,
  generateRecommendation,
  acceptRecommendation,
  rejectRecommendation,
  revertRecommendation,
  getJobStatus
} from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlineLightBulb,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineSparkles,
  HiOutlineCube,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiX as HiOutlineXMark,
  HiOutlineExclamation as HiOutlineExclamationTriangle
} from 'react-icons/hi';
import jsPDF from 'jspdf';
import { SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
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
      getRecommendations().then(r => setRecommendations(r.data.data || r.data)).catch(() => { throw new Error('Failed recs'); }),
      getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { throw new Error('Failed prods'); }),
    ]).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Helper to resolve Product Name & SKU ───
  const getProductDetails = (rec) => {
    const pId = typeof rec.productId === 'object' ? rec.productId?._id : rec.productId;
    const matched = products.find(p => String(p._id) === String(pId));
    const name =
      (typeof rec.productId === 'object' && rec.productId?.name) ||
      matched?.name ||
      rec.productName ||
      rec.product?.name ||
      'Product';
    const sku =
      (typeof rec.productId === 'object' && rec.productId?.sku) ||
      matched?.sku ||
      '—';
    const currentPrice =
      rec.currentPrice ??
      (typeof rec.productId === 'object' ? rec.productId?.currentPrice : null) ??
      matched?.currentPrice ??
      0;
    return { name, sku, currentPrice };
  };

  const handleGenerate = async (productId) => {
    setGenerating(productId);
    try {
      const res = await generateRecommendation(productId);
      if (res.data.status === 'queued') {
        toast.success('Recommendation job queued...');
        const jobId = res.data.jobId;

        const poll = setInterval(async () => {
          try {
            const statusRes = await getJobStatus(jobId);
            if (statusRes.data.status === 'completed') {
              clearInterval(poll);
              setRecommendations(prev => [statusRes.data.result, ...prev]);
              toast.success('Recommendation generated!');
              setGenerating(null);
            } else if (statusRes.data.status === 'failed') {
              clearInterval(poll);
              toast.error('AI job failed.');
              setGenerating(null);
            }
          } catch {
            clearInterval(poll);
            toast.error('Error checking job status');
            setGenerating(null);
          }
        }, 2000);
      } else {
        setRecommendations(prev => [res.data, ...prev]);
        toast.success('Recommendation generated!');
        setGenerating(null);
      }
    } catch {
      toast.error('Failed — check AI service.');
      setGenerating(null);
    }
  };

  const handleAccept = async (id, impact) => {
    if (impact < -10) {
      if (!confirm(`Warning: This change is projected to decrease revenue by ${Math.abs(impact)}%. Are you sure you want to apply this price?`)) return;
    }
    try {
      await acceptRecommendation(id);
      toast.success('Price updated!');
      fetchData();
    } catch {
      toast.error('Failed to apply price change');
    }
  };

  const handleRevert = async (id) => {
    try {
      await revertRecommendation(id);
      toast.success('Price reverted to previous value');
      fetchData();
    } catch {
      toast.error('Failed to revert price');
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('AI Pricing Recommendations Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    let y = 45;
    recommendations.forEach((rec, i) => {
      const { name } = getProductDetails(rec);
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${name}`, 14, y);
      doc.setFontSize(9);
      doc.text(`Current: ₹${rec.currentPrice} → Recommended: ₹${rec.recommendedPrice}`, 20, y + 7);
      doc.text(`Revenue Impact: ${rec.expectedRevenueImpact}% | Confidence: ${(rec.confidenceScore * 100).toFixed(0)}%`, 20, y + 13);
      doc.text(`Reason: ${rec.reason?.substring(0, 100)}...`, 20, y + 19);
      doc.text(`Status: ${rec.status}`, 20, y + 25);
      y += 35;
    });

    doc.save('pricing-recommendations.pdf');
    toast.success('PDF exported!');
  };

  // ─── Analytics KPIs ───
  const kpis = useMemo(() => {
    if (!recommendations.length) return { total: 0, accepted: 0, avgLift: 0, avgConfidence: 0 };
    const accepted = recommendations.filter(r => r.status === 'accepted').length;
    const avgLift = (
      recommendations.reduce((sum, r) => sum + (r.expectedRevenueImpact || 0), 0) / recommendations.length
    ).toFixed(1);
    const avgConfidence = Math.round(
      (recommendations.reduce((sum, r) => sum + (r.confidenceScore || 0.85), 0) / recommendations.length) * 100
    );
    return { total: recommendations.length, accepted, avgLift, avgConfidence };
  }, [recommendations]);

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

  if (error) return <ErrorState title="Failed to load Recommendations" onRetry={fetchData} />;

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div><div className="skeleton h-8 w-64 mb-2 rounded"></div><div className="skeleton h-4 w-48 rounded"></div></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-24" />)}
      </div>
      <SkeletonCard className="h-44 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <SkeletonCard key={i} className="h-64" />)}
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
              AI Dynamic Pricing Engine
            </span>
            <span className="text-xs text-text-muted">Gemini 1.5 Pro &amp; Real-time Scrapers</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text">
            <span className="gradient-text">AI Recommendations</span>
          </h1>
          <p className="text-text-muted text-sm mt-1.5 flex items-center gap-2">
            <HiOutlineSparkles className="w-4 h-4 text-primary-light" />
            Explainable Price Optimization Powered by Competitor Data &amp; Elasticity Models
          </p>
        </div>
        <div className="flex items-center gap-3">
          {recommendations.length > 0 && (
            <button onClick={exportPDF} className="btn-primary">
              <HiOutlineDocumentText className="w-4 h-4" />
              Export PDF
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
            <HiOutlineLightBulb className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">No Products Found</h2>
          <p className="text-text-muted max-w-md mx-auto mb-8">
            Add products to your catalog to generate AI-driven dynamic pricing recommendations based on competitor pricing and demand signals.
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
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Recommendations</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <HiOutlineCube className="w-4 h-4 text-primary-light" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">{kpis.total}</p>
              <p className="text-xs text-text-muted mt-1.5">Optimizations generated</p>
            </div>

            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Applied Live</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <HiOutlineCheck className="w-4 h-4 text-success" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">{kpis.accepted}</p>
              <p className="text-xs text-text-muted mt-1.5">Active price changes</p>
            </div>

            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Avg Projected Lift</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.12)' }}>
                  <HiOutlineTrendingUp className="w-4 h-4 text-accent" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">
                {kpis.avgLift > 0 ? `+${kpis.avgLift}%` : `${kpis.avgLift}%`}
              </p>
              <p className="text-xs text-text-muted mt-1.5">Estimated revenue change</p>
            </div>

            <div className="glass-card glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Avg Confidence</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <HiOutlineShieldCheck className="w-4 h-4 text-warning" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-text">{kpis.avgConfidence}%</p>
              <p className="text-xs text-text-muted mt-1.5">AI model certainty score</p>
            </div>
          </div>

          {/* ── Generate AI Recommendation Selector Bar ── */}
          <div className="glass-card p-6 animate-slide-up stagger-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)' }}>
                  <HiOutlineSparkles className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text">Generate AI Recommendation</h2>
                  <p className="text-xs text-text-muted">Search or select a product to run Gemini dynamic pricing optimization</p>
                </div>
              </div>

              {/* Search & Category Controls */}
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
                      className={`p-3.5 bg-surface/50 border rounded-xl text-left transition-all cursor-pointer group relative overflow-hidden ${
                        isGenerating
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">
                          {p.category || 'General'}
                        </span>
                        <span className="text-[11px] font-bold text-text">
                          ₹{p.currentPrice}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text truncate group-hover:text-primary-light transition-colors" title={p.name}>
                        {p.name}
                      </p>
                      {isGenerating ? (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary-light font-semibold">
                          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Optimizing...
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-muted mt-1">
                          {p.stockLevel} in stock
                        </p>
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

          {/* ── Recommendation Cards List ── */}
          <div className="space-y-6">
            {recommendations.map((rec, i) => {
              const { name: productName, sku, currentPrice } = getProductDetails(rec);
              const recPrice = rec.recommendedPrice || currentPrice;
              const isIncrease = recPrice > currentPrice;
              const priceDiff = Math.abs(recPrice - currentPrice);
              const confidence = rec.confidenceScore ? Math.round(rec.confidenceScore * 100) : 90;

              return (
                <div
                  key={i}
                  className={`glass-card p-6 border-l-4 animate-slide-up glass-card-hover ${
                    rec.status === 'accepted'
                      ? 'border-l-success'
                      : isIncrease
                      ? 'border-l-primary'
                      : 'border-l-accent'
                  }`}
                  style={{ animationDelay: `${0.15 + i * 0.06}s` }}
                >
                  {/* Card Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isIncrease ? 'rgba(99,102,241,0.12)' : 'rgba(6,182,212,0.12)',
                        }}
                      >
                        {isIncrease ? (
                          <HiOutlineArrowUp className="w-5 h-5 text-primary-light" />
                        ) : (
                          <HiOutlineArrowDown className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-text text-base leading-tight">
                          {productName}
                        </h3>
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">
                          SKU: {sku}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          rec.status === 'accepted'
                            ? 'bg-success/15 text-success border border-success/20'
                            : rec.status === 'rejected'
                            ? 'bg-danger/15 text-danger border border-danger/20'
                            : 'bg-warning/15 text-warning border border-warning/20'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>

                  {/* 4 Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">
                        Current Price
                      </p>
                      <p className="text-lg font-extrabold text-text">₹{currentPrice}</p>
                    </div>

                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">
                        Recommended
                      </p>
                      <p className={`text-lg font-extrabold ${isIncrease ? 'text-primary-light' : 'text-accent'}`}>
                        ₹{recPrice}
                        <span className="text-[10px] ml-1 font-semibold opacity-80">
                          ({isIncrease ? `+₹${priceDiff}` : `-₹${priceDiff}`})
                        </span>
                      </p>
                    </div>

                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">
                        Revenue Impact
                      </p>
                      <p className={`text-lg font-extrabold ${rec.expectedRevenueImpact > 0 ? 'text-success' : 'text-danger'}`}>
                        {rec.expectedRevenueImpact > 0 ? '+' : ''}{rec.expectedRevenueImpact}%
                      </p>
                    </div>

                    <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">
                        Confidence
                      </p>
                      <p className="text-lg font-extrabold text-text">{confidence}%</p>
                    </div>
                  </div>

                  {/* Gemini AI Insight Box */}
                  <div className="p-4.5 rounded-xl bg-surface/60 border border-border mb-5">
                    <h4 className="text-[11px] uppercase tracking-wider text-primary-light mb-2.5 font-bold flex items-center gap-1.5">
                      <HiOutlineLightBulb className="w-4 h-4 text-warning" /> Gemini AI Insight &amp; Rationale
                    </h4>
                    {(() => {
                      try {
                        const parsed = JSON.parse(rec.insight);
                        return (
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm font-semibold text-text">{parsed.summary}</p>
                              {parsed.risk_level && (
                                <span
                                  className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                                    parsed.risk_level === 'low'
                                      ? 'bg-success/15 text-success border border-success/20'
                                      : parsed.risk_level === 'high'
                                      ? 'bg-danger/15 text-danger border border-danger/20'
                                      : 'bg-warning/15 text-warning border border-warning/20'
                                  }`}
                                >
                                  {parsed.risk_level} Risk
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">{parsed.detailed_analysis}</p>
                            {parsed.action_items && parsed.action_items.length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-border">
                                <p className="text-[11px] text-text-muted uppercase font-semibold mb-1.5">Action Items:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {parsed.action_items.map((item, idx) => (
                                    <li key={idx} className="text-xs text-text">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return <p className="text-xs text-text-muted leading-relaxed">{rec.insight || rec.reason}</p>;
                      }
                    })()}
                  </div>

                  {/* Competitor Pricing Section */}
                  {rec.competitorsUsed && rec.competitorsUsed.length > 0 ? (
                    <div className="mb-5">
                      <p className="text-[10px] text-text-muted mb-2.5 font-semibold uppercase tracking-wider">
                        Live Competitor Benchmark Data
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {rec.competitorsUsed.map((comp, idx) => {
                          const rawName = comp.productName || comp.name || '';
                          const shortTitle = rawName.split(/[,|\-–—]/)[0].trim() || rawName;
                          const platform = (comp.platform || comp.name || 'Competitor').toUpperCase();
                          const isAmazon = platform.includes('AMAZON');
                          const isFlipkart = platform.includes('FLIPKART');
                          const platformColor = isAmazon ? '#f97316' : isFlipkart ? '#0084ff' : '#06b6d4';
                          const linkUrl = comp.url || `https://www.google.com/search?q=${encodeURIComponent((comp.platform || '') + ' ' + rawName)}`;

                          return (
                            <div
                              key={idx}
                              className="shrink-0 bg-surface/50 p-3.5 rounded-xl border border-border w-[210px] h-[135px] flex flex-col justify-between"
                            >
                              <div>
                                <span
                                  className="text-[10px] font-extrabold uppercase tracking-wider mb-1 block"
                                  style={{ color: platformColor }}
                                >
                                  {platform}
                                </span>
                                <a
                                  href={linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-text hover:text-primary-light hover:underline font-semibold line-clamp-2 block leading-snug"
                                  title={rawName}
                                >
                                  {shortTitle}
                                </a>
                              </div>
                              <div className="flex justify-between items-end pt-2 border-t border-border/40">
                                <p className="text-base text-text font-extrabold">₹{comp.price}</p>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    comp.inStock ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                                  }`}
                                >
                                  {comp.inStock ? 'In Stock' : 'OOS'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 p-3.5 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-2 text-xs text-warning">
                      <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
                      <span>Competitor pricing benchmark unavailable for this item. Defaulting to demand elasticity model.</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  {rec.status === 'pending' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAccept(rec._id, rec.expectedRevenueImpact)}
                        className="btn-primary flex items-center gap-2 text-xs"
                      >
                        <HiOutlineCheck className="w-4 h-4" /> Accept &amp; Apply Price
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await rejectRecommendation(rec._id);
                            toast.success('Recommendation rejected');
                            fetchData();
                          } catch {
                            toast.error('Failed to reject recommendation');
                          }
                        }}
                        className="btn-secondary flex items-center gap-2 text-xs text-danger hover:bg-danger/10 hover:border-danger/30 cursor-pointer"
                      >
                        <HiOutlineXMark className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}

                  {rec.status === 'accepted' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <button
                        onClick={() => handleRevert(rec._id)}
                        className="btn-secondary flex items-center gap-2 text-xs text-warning hover:bg-warning/10 hover:border-warning/30 cursor-pointer"
                      >
                        <HiOutlineRefresh className="w-4 h-4" /> Undo &amp; Revert Price
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {recommendations.length === 0 && (
            <div className="glass-card p-12 text-center text-text-muted animate-slide-up">
              <HiOutlineLightBulb className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
              <h3 className="text-lg font-semibold text-text mb-1">No Recommendations Yet</h3>
              <p className="text-sm text-text-muted">
                Click on any product above to generate AI pricing recommendations and competitor benchmark analysis.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
