import { useState, useEffect } from 'react';
import { getABTests, createABTest, recordABTestEvent, simulateABTestTraffic, completeABTest, getProducts } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { exportReportToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';
import {
  HiBeaker,
  HiPlus,
  HiCheckCircle,
  HiXCircle,
  HiPlay,
  HiStop,
  HiTrendingUp,
  HiChip,
  HiDocumentDownload,
  HiBadgeCheck,
  HiRefresh,
  HiOutlineSearch
} from 'react-icons/hi';
import { SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import ExplainWithAITag from '../components/ExplainWithAITag';
import AskAIButton from '../components/AskAIButton';

export default function ABTestDashboard() {
  const [tests, setTests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [variantBPrice, setVariantBPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive UI states
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true);
  const [simulatingTestId, setSimulatingTestId] = useState(null);
  const [completedWinnerModal, setCompletedWinnerModal] = useState(null);
  
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [testsRes, productsRes] = await Promise.all([
        getABTests(),
        getProducts(1, 100)
      ]);
      setTests(testsRes.data || []);
      setProducts(productsRes.data?.data || productsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch A/B tests:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !variantBPrice) {
      toast.error('Please select a product and target price');
      return;
    }

    setSubmitting(true);
    try {
      await createABTest({
        productId: selectedProductId,
        variantBPrice: Number(variantBPrice)
      });
      toast.success('A/B Price Experiment Started!');
      setShowCreateModal(false);
      setSelectedProductId('');
      setVariantBPrice('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start A/B test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateEvent = async (testId, variant, eventType) => {
    try {
      await recordABTestEvent(testId, { variant, eventType });
      toast.success(`Recorded ${eventType} for Variant ${variant}`);
      fetchData();
    } catch {
      toast.error('Failed to record event');
    }
  };

  const handleBatchSimulate = async (testId) => {
    setSimulatingTestId(testId);
    try {
      await simulateABTestTraffic(testId, 50);
      toast.success('Simulated 50 visitor sessions! Metrics updated.');
      fetchData();
    } catch {
      toast.error('Failed to simulate traffic');
    } finally {
      setSimulatingTestId(null);
    }
  };

  const [pendingCompletionTest, setPendingCompletionTest] = useState(null);

  const handleOpenCompleteModal = (test) => {
    const pName = test.productId?.name || 'Product';
    const vA = test.results?.variantA || { views: 0, conversions: 0, revenue: 0 };
    const vB = test.results?.variantB || { views: 0, conversions: 0, revenue: 0 };
    const rpvA = vA.views > 0 ? (vA.revenue / vA.views) : 0;
    const rpvB = vB.views > 0 ? (vB.revenue / vB.views) : 0;

    let winner = 'tie';
    if (rpvB > rpvA * 1.05) winner = 'B';
    else if (rpvA > rpvB * 1.05) winner = 'A';

    setPendingCompletionTest({
      test,
      pName,
      winner,
      winningPrice: winner === 'B' ? test.variantB?.price : test.variantA?.price,
      variantAPrice: test.variantA?.price,
      variantBPrice: test.variantB?.price,
      confidence: test.confidenceLevel || 0,
      rpvA,
      rpvB
    });
  };

  const handleConfirmComplete = async (action) => {
    if (!pendingCompletionTest) return;
    const testId = pendingCompletionTest.test._id;
    try {
      await completeABTest(testId, { action });
      setPendingCompletionTest(null);

      if (action === 'accept') {
        toast.success('Winning price accepted and applied to catalog!');
      } else {
        toast.success('Tested price rejected. Preserved original catalog price.');
      }
      fetchData();
    } catch {
      toast.error('Failed to complete experiment');
    }
  };

  const handleExportPDF = () => {
    if (tests.length === 0) {
      toast.error('No experiments available to export');
      return;
    }
    const columns = ['Product', 'Status', 'Variant A Price', 'Variant B Price', 'A RPV', 'B RPV', 'Winner', 'Confidence'];
    const data = tests.map(t => {
      const rpvA = t.results?.variantA?.views > 0 ? (t.results.variantA.revenue / t.results.variantA.views).toFixed(1) : 0;
      const rpvB = t.results?.variantB?.views > 0 ? (t.results.variantB.revenue / t.results.variantB.views).toFixed(1) : 0;
      return [
        t.productId?.name || 'Product',
        t.status.toUpperCase(),
        `₹${t.variantA?.price}`,
        `₹${t.variantB?.price}`,
        `₹${rpvA}`,
        `₹${rpvB}`,
        t.winner ? `Variant ${t.winner}` : 'Pending',
        `${t.confidenceLevel || 0}%`
      ];
    });

    exportReportToPdf({
      title: 'A/B Price Experiment Results Report',
      subtitle: `Aggregated analysis of ${tests.length} pricing experiments`,
      columns,
      data,
      filename: 'PricePilot_AB_Test_Report.pdf'
    });
    toast.success('PDF report exported!');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeTests = tests.filter(t => t.status === 'active');
  const completedTests = tests.filter(t => t.status === 'completed');
  const bWinners = completedTests.filter(t => t.winner === 'B').length;
  const winRate = completedTests.length > 0 ? Math.round((bWinners / completedTests.length) * 100) : 0;

  if (error) {
    return <ErrorState title="Failed to load A/B Experiments" onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-header text-3xl flex items-center gap-2">
              <HiBeaker className="w-8 h-8 text-primary" /> A/B Price Experiments
            </h1>
            <ExplainWithAITag title="Explain with AI" contextData={{ type: 'ab_tests', testCount: tests.length }} />
          </div>
          <p className="text-text-muted mt-1 text-sm">
            Test AI-recommended prices against baseline control prices with real-time statistical significance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <HiDocumentDownload className="w-4 h-4 text-accent" /> Export PDF Report
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <HiPlus className="w-4 h-4" /> New Price Experiment
          </button>
        </div>
      </div>

      {/* Visual Onboarding Explainer Banner */}
      {showOnboardingBanner && (
        <div className="glass-card p-5 border-l-4 border-l-primary relative overflow-hidden animate-slide-up shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <HiBeaker className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-text text-base">How A/B Price Experiments Work</h3>
                <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">Guide</span>
              </div>
              <p className="text-xs text-text-muted max-w-3xl leading-relaxed">
                A/B Price Testing validates whether an AI-recommended target price generates higher overall revenue per customer before making a permanent catalog price update.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-surface-lighter/60 border border-border flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">1</div>
                  <div>
                    <p className="text-xs font-bold text-text">50/50 Traffic Split</p>
                    <p className="text-[11px] text-text-muted">50% see Variant A (Current), 50% see Variant B (AI Target)</p>
                  </div>
                </div>
                
                <div className="p-3 rounded-xl bg-surface-lighter/60 border border-border flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">2</div>
                  <div>
                    <p className="text-xs font-bold text-text">Compare RPV</p>
                    <p className="text-[11px] text-text-muted">Revenue Per Visitor (RPV = Revenue ÷ Views) proves true profitability</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-lighter/60 border border-border flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/20">3</div>
                  <div>
                    <p className="text-xs font-bold text-text">Auto-Apply Winner</p>
                    <p className="text-[11px] text-text-muted">When Variant B hits 95%+ confidence, 1-click update live store catalog</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowOnboardingBanner(false)}
              className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-surface-lighter transition-colors"
              title="Dismiss guide"
            >
              <HiXCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                Active Experiments
              </span>
              <p className="text-2xl font-bold text-primary">{activeTests.length}</p>
              <span className="text-[11px] text-text-muted">Live split tests</span>
            </div>

            <div className="glass-card p-4.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                Completed Tests
              </span>
              <p className="text-2xl font-bold text-text">{completedTests.length}</p>
              <span className="text-[11px] text-text-muted">Concluded runs</span>
            </div>

            <div className="glass-card p-4.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                AI Winner Rate
              </span>
              <p className="text-2xl font-bold text-emerald-500">{winRate}%</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Variant B outperform</span>
            </div>

            <div className="glass-card p-4.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                Avg Confidence
              </span>
              <p className="text-2xl font-bold text-amber-500">
                {activeTests.length > 0
                  ? Math.round(activeTests.reduce((sum, t) => sum + (t.confidenceLevel || 0), 0) / activeTests.length)
                  : 95}%
              </p>
              <span className="text-[11px] text-text-muted">Statistical significance</span>
            </div>
          </div>

          {/* Active Experiments List */}
          <div>
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <HiPlay className="w-5 h-5 text-emerald-500" /> Active Experiments ({activeTests.length})
            </h2>

            {activeTests.length === 0 ? (
              <div className="glass-card p-8 text-center text-text-muted">
                <HiBeaker className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary" />
                <p className="text-sm font-medium text-text">No active price experiments right now.</p>
                <p className="text-xs text-text-muted mt-1">Click "New Price Experiment" above to start testing an AI recommendation against your current price.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTests.map(test => {
                  const pName = test.productId?.name || 'Product';
                  const pSku = test.productId?.sku || '';
                  const vA = test.results?.variantA || { views: 0, conversions: 0, revenue: 0 };
                  const vB = test.results?.variantB || { results: 0, conversions: 0, revenue: 0 };

                  const crA = vA.views > 0 ? ((vA.conversions / vA.views) * 100).toFixed(1) : '0.0';
                  const crB = vB.views > 0 ? ((vB.conversions / vB.views) * 100).toFixed(1) : '0.0';

                  const rpvA = vA.views > 0 ? (vA.revenue / vA.views) : 0;
                  const rpvB = vB.views > 0 ? (vB.revenue / vB.views) : 0;
                  const maxRpv = Math.max(rpvA, rpvB) || 1;

                  return (
                    <div key={test._id} className="glass-card p-6 border-t-2 border-t-primary flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-text text-base">{pName}</h3>
                            <p className="text-xs text-text-muted">SKU: {pSku} • Started {new Date(test.startDate).toLocaleDateString()}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                          </span>
                        </div>

                        {/* Split Test Columns */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {/* Variant A: Control */}
                          <div className="p-3.5 rounded-xl bg-surface-lighter/50 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-text-muted uppercase">Variant A (Control)</span>
                              <span className="font-bold text-text">{formatCurrency(test.variantA?.price)}</span>
                            </div>
                            <div className="space-y-1 text-xs text-text-muted">
                              <div className="flex justify-between"><span>Views:</span> <span className="text-text font-medium">{vA.views}</span></div>
                              <div className="flex justify-between"><span>Conversions:</span> <span className="text-text font-medium">{vA.conversions} ({crA}%)</span></div>
                              <div className="flex justify-between font-semibold pt-1 border-t border-border text-text">
                                <span>RPV:</span> <span>{formatCurrency(rpvA, 1)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-1.5">
                              <button onClick={() => handleSimulateEvent(test._id, 'A', 'view')} className="flex-1 text-[10px] py-1 bg-surface hover:bg-surface-lighter rounded-lg border border-border text-text font-medium transition-colors">
                                + View
                              </button>
                              <button onClick={() => handleSimulateEvent(test._id, 'A', 'conversion')} className="flex-1 text-[10px] py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg border border-primary/30 transition-colors">
                                + Sale
                              </button>
                            </div>
                          </div>

                          {/* Variant B: AI Recommended */}
                          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-primary uppercase flex items-center gap-1">
                                <HiChip className="w-3.5 h-3.5" /> Variant B (Optimized)
                              </span>
                              <span className="font-bold text-primary">{formatCurrency(test.variantB?.price)}</span>
                            </div>
                            <div className="space-y-1 text-xs text-text-muted">
                              <div className="flex justify-between"><span>Views:</span> <span className="text-text font-medium">{vB.views}</span></div>
                              <div className="flex justify-between"><span>Conversions:</span> <span className="text-text font-medium">{vB.conversions} ({crB}%)</span></div>
                              <div className="flex justify-between font-semibold pt-1 border-t border-primary/20 text-primary">
                                <span>RPV:</span> <span>{formatCurrency(rpvB, 1)}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-1.5">
                              <button onClick={() => handleSimulateEvent(test._id, 'B', 'view')} className="flex-1 text-[10px] py-1 bg-surface hover:bg-surface-lighter rounded-lg border border-border text-text font-medium transition-colors">
                                + View
                              </button>
                              <button onClick={() => handleSimulateEvent(test._id, 'B', 'conversion')} className="flex-1 text-[10px] py-1 bg-primary text-white hover:bg-primary-dark font-bold rounded-lg border border-primary transition-colors">
                                + Sale
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* RPV Comparison Meter */}
                        <div className="p-3 rounded-xl bg-surface-lighter/60 border border-border mb-4 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-text-muted uppercase text-[10px] flex items-center gap-1">
                              <HiTrendingUp className="w-3.5 h-3.5 text-primary" /> RPV Comparison (Revenue Per Visitor)
                            </span>
                            <span className="text-primary text-[11px]">
                              {rpvB > rpvA 
                                ? `+${(((rpvB - rpvA) / (rpvA || 1)) * 100).toFixed(1)}% AI Lift` 
                                : rpvA > rpvB 
                                ? `+${(((rpvA - rpvB) / (rpvB || 1)) * 100).toFixed(1)}% Control Lift` 
                                : 'Equal Performance'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div>
                              <div className="flex justify-between text-[11px] text-text-muted mb-0.5">
                                <span>Variant A (Control): {formatCurrency(rpvA, 1)}</span>
                                <span>CR: {crA}%</span>
                              </div>
                              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                                <div 
                                  className="bg-slate-400 dark:bg-slate-500 h-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, (rpvA / maxRpv) * 100)}%` }} 
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[11px] text-primary font-semibold mb-0.5">
                                <span>Variant B (AI Target): {formatCurrency(rpvB, 1)}</span>
                                <span>CR: {crB}%</span>
                              </div>
                              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                                <div 
                                  className="bg-gradient-to-r from-primary to-emerald-500 h-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, (rpvB / maxRpv) * 100)}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Confidence Meter */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-text-muted">Statistical Confidence (Z-Test)</span>
                            <span className="text-amber-500 font-bold">{test.confidenceLevel || 0}%</span>
                          </div>
                          <div className="w-full bg-surface-lighter border border-border h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-emerald-500 h-full transition-all duration-500"
                              style={{ width: `${Math.min(100, test.confidenceLevel || 0)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Toolbar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
                        <button
                          type="button"
                          disabled={simulatingTestId === test._id}
                          onClick={() => handleBatchSimulate(test._id)}
                          className="py-2 px-3 rounded-xl bg-surface-lighter hover:bg-surface border border-border text-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <HiRefresh className={`w-3.5 h-3.5 text-primary ${simulatingTestId === test._id ? 'animate-spin' : ''}`} />
                          {simulatingTestId === test._id ? 'Simulating...' : 'Simulate 50 Visitors'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(test)}
                          className="py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <HiStop className="w-3.5 h-3.5 text-white" />
                          Declare Winner & Finish
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Completed Experiments */}
          {completedTests.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-text text-base flex items-center gap-2">
                  <HiBadgeCheck className="w-5 h-5 text-amber-500" /> Completed Experiments History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase text-text-muted bg-surface-lighter">
                      <th className="p-4">Product</th>
                      <th className="p-4">Variant A Price</th>
                      <th className="p-4">Variant B Price</th>
                      <th className="p-4 text-right">RPV A</th>
                      <th className="p-4 text-right">RPV B</th>
                      <th className="p-4 text-center">Winner</th>
                      <th className="p-4 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {completedTests.map(t => {
                      const rpvA = t.results?.variantA?.views > 0 ? (t.results.variantA.revenue / t.results.variantA.views) : 0;
                      const rpvB = t.results?.variantB?.views > 0 ? (t.results.variantB.revenue / t.results.variantB.views) : 0;

                      return (
                        <tr key={t._id} className="hover:bg-surface-lighter/50 transition-colors">
                          <td className="p-4 font-medium text-text">{t.productId?.name || 'Product'}</td>
                          <td className="p-4 text-text-muted">{formatCurrency(t.variantA?.price)}</td>
                          <td className="p-4 text-primary font-semibold">{formatCurrency(t.variantB?.price)}</td>
                          <td className="p-4 text-right text-text-muted">{formatCurrency(rpvA, 1)}</td>
                          <td className="p-4 text-right font-semibold text-text">{formatCurrency(rpvB, 1)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              t.winner === 'B'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : t.winner === 'A'
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-slate-500/10 text-text-muted border-border'
                            }`}>
                              {t.winner === 'B' ? 'Variant B (AI)' : t.winner === 'A' ? 'Variant A (Control)' : 'Tie'}
                            </span>
                          </td>
                          <td className="p-4 text-right font-semibold text-amber-500">{t.confidenceLevel || 0}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create New Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <HiBeaker className="w-5 h-5 text-primary" /> Start A/B Price Experiment
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)} 
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Select Product to Test</label>
                  <div className="relative w-full sm:w-64">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-surface-lighter border border-border text-xs rounded-xl py-2 pl-9 pr-3 text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1 mb-4 custom-scrollbar">
                  {filteredProducts.length > 0 ? filteredProducts.map(p => {
                    const isSelected = selectedProductId === p._id;
                    const aiTargetPrice = Math.round(p.currentPrice * 1.06);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p._id);
                          setVariantBPrice(aiTargetPrice);
                        }}
                        className={`p-3 text-left border rounded-xl transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                            : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-lighter'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-text-muted uppercase truncate">
                              {p.category || 'General'}
                            </span>
                            <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <HiChip className="w-2.5 h-2.5" /> +8.5%
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-text truncate mb-1" title={p.name}>
                            {p.name}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-border/40">
                          <span className="text-text-muted">Current: <strong className="text-text">{formatCurrency(p.currentPrice)}</strong></span>
                          <span className="text-primary font-bold">AI: {formatCurrency(aiTargetPrice)}</span>
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="col-span-full text-center py-6 text-text-muted text-xs">
                      No products found.
                    </div>
                  )}
                </div>
              </div>

              {selectedProductId && (
                <div className="bg-surface-lighter/60 p-4 rounded-xl border border-border mt-2 space-y-2">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Variant B Price (AI / Test Target)</label>
                  <input
                    type="number"
                    value={variantBPrice}
                    onChange={(e) => setVariantBPrice(e.target.value)}
                    required
                    min="1"
                    placeholder="Enter test price"
                    className="w-full bg-surface border border-border text-text rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 font-semibold transition-colors"
                  />
                  <span className="text-[11px] text-text-muted block">
                    Variant A will remain at current price: <strong className="text-text">{formatCurrency(products.find(p => p._id === selectedProductId)?.currentPrice)}</strong>
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:bg-surface-lighter text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedProductId}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? 'Starting...' : 'Launch Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Winner Decision Modal */}
      {pendingCompletionTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-light border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <HiBadgeCheck className="w-7 h-7" />
            </div>
            
            <div>
              <h3 className="font-bold text-text text-lg">Conclude A/B Experiment</h3>
              <p className="text-xs text-text-muted mt-1">{pendingCompletionTest.pName}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-surface-lighter/80 border border-border text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Winning Performance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {pendingCompletionTest.winner === 'B' ? 'Variant B (AI Target)' : pendingCompletionTest.winner === 'A' ? 'Variant A (Control)' : 'Tie / Equal'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Control Price (A):</span>
                <span className="font-semibold text-text">{formatCurrency(pendingCompletionTest.variantAPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">AI Target Price (B):</span>
                <span className="font-bold text-primary">{formatCurrency(pendingCompletionTest.variantBPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Statistical Confidence:</span>
                <span className="font-bold text-amber-500">{pendingCompletionTest.confidence}%</span>
              </div>
            </div>

            <div className="text-xs text-text-muted text-left">
              Decide whether to update your live store catalog with the tested price or retain your baseline price.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmComplete('reject')}
                className="py-2.5 rounded-xl border border-danger/30 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-bold transition-colors"
              >
                Reject & Keep ₹{pendingCompletionTest.variantAPrice}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmComplete('accept')}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
              >
                Accept & Apply Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
