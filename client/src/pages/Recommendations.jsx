import { useState, useEffect } from 'react';
import { getRecommendations, getProducts, generateRecommendation, acceptRecommendation, rejectRecommendation, revertRecommendation, getJobStatus } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineLightBulb, HiOutlineCheck, HiOutlineRefresh, HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi';
import jsPDF from 'jspdf';
import { SkeletonCard, SkeletonText } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [generating, setGenerating] = useState(null);

    const fetchData = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            getRecommendations().then(r => setRecommendations(r.data.data || r.data)).catch(() => { throw new Error('Failed recs') }),
            getProducts().then(r => setProducts(r.data.data || r.data)).catch(() => { throw new Error('Failed prods') }),
        ]).catch(() => setError(true)).finally(() => setLoading(false));
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, []);

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
                toast.success('Recommendation generated');
                setGenerating(null);
            }
        } catch {
            toast.error('Failed — is the AI service running?');
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
            toast.error('Failed to apply');
        }
    };
    const handleRevert = async (id) => {
        try {
            await revertRecommendation(id);
            toast.success('Price reverted to previous value');
            fetchData();
        } catch {
            toast.error('Failed to revert');
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
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.text(`${i + 1}. ${rec.productId?.name || 'Product'}`, 14, y);
            doc.setFontSize(9);
            doc.text(`Current: ₹${rec.currentPrice} → Recommended: ₹${rec.recommendedPrice}`, 20, y + 7);
            doc.text(`Revenue Impact: ${rec.expectedRevenueImpact}% | Confidence: ${(rec.confidenceScore * 100).toFixed(0)}%`, 20, y + 13);
            doc.text(`Reason: ${rec.reason?.substring(0, 100)}...`, 20, y + 19);
            doc.text(`Status: ${rec.status}`, 20, y + 25);
            y += 35;
        });

        doc.save('pricing-recommendations.pdf');
        toast.success('PDF exported');
    };

    if (error) return <ErrorState title="Failed to load Recommendations" onRetry={fetchData} />;

    if (loading) return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div><div className="skeleton h-8 w-64 mb-2 rounded"></div><div className="skeleton h-4 w-48 rounded"></div></div>
            </div>
            <SkeletonCard className="h-32 mb-6" />
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-48" />)}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="page-header text-3xl">AI Recommendations</h1>
                    <p className="text-text-muted mt-1 text-sm">Explainable pricing decisions powered by AI</p>
                </div>
                <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
                    📄 Export PDF
                </button>
            </div>

            {/* Generate Section */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        {generating ? (
                            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <HiOutlineRefresh className="w-4 h-4 text-accent" />
                        )}
                    </div>
                    Generate New Recommendation
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {products.slice(0, 10).map(p => (
                        <button key={p._id} onClick={() => handleGenerate(p._id)}
                            disabled={generating === p._id}
                            className={`p-3.5 bg-surface/50 border rounded-xl text-left transition-all group ${generating === p._id ? 'border-primary/40 bg-primary/10' : 'border-primary/10 hover:border-primary/25 hover:bg-primary/5 disabled:opacity-50'}`}>
                            {generating === p._id ? (
                                <p className="text-sm font-medium text-primary-light flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-primary-light border-t-transparent rounded-full animate-spin"></span> Fetching...
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-text truncate group-hover:text-primary-light transition-colors">{p.name}</p>
                            )}
                            <p className="text-[11px] text-text-muted">₹{p.currentPrice}</p>
                            {generating === p._id && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mt-1.5" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendation Cards */}
            <div className="space-y-4">
                {recommendations.map((rec, i) => {
                    const isIncrease = rec.recommendedPrice > rec.currentPrice;
                    return (
                        <div key={i} className={`glass-card p-6 border-l-[3px] animate-slide-up ${rec.status === 'accepted' ? 'border-l-success' :
                                isIncrease ? 'border-l-primary' : 'border-l-accent'
                            }`} style={{ animationDelay: `${0.15 + i * 0.06}s` }}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${isIncrease ? 'bg-primary/12 text-primary' : 'bg-accent/12 text-accent'}`}>
                                        {isIncrease ? <HiOutlineArrowUp className="w-5 h-5" /> : <HiOutlineArrowDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text">{rec.productId?.name || 'Product'}</h3>
                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">SKU: {rec.productId?.sku || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${
                                        rec.status === 'accepted' ? 'badge-success' :
                                            rec.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                                    } ${rec.status === 'accepted' ? 'animate-shimmer' : ''}`}>{rec.status}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-primary/5">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Current</p>
                                    <p className="text-lg font-bold text-text">₹{rec.currentPrice}</p>
                                </div>
                                <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-primary/5">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Recommended</p>
                                    <p className={`text-lg font-bold ${isIncrease ? 'text-primary-light' : 'text-accent'}`}>₹{rec.recommendedPrice}</p>
                                </div>
                                <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-primary/5">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Revenue</p>
                                    <p className={`text-lg font-bold ${rec.expectedRevenueImpact > 0 ? 'text-success' : 'text-danger'}`}>
                                        {rec.expectedRevenueImpact > 0 ? '+' : ''}{rec.expectedRevenueImpact}%
                                    </p>
                                </div>
                                <div className="text-center p-3.5 bg-surface/50 rounded-xl border border-primary/5">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Confidence</p>
                                    <p className="text-lg font-bold text-text">{(rec.confidenceScore * 100).toFixed(0)}%</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-[rgba(99,102,241,0.05)] to-transparent rounded-xl mb-4 border border-[rgba(99,102,241,0.1)]">
                                <h4 className="text-[11px] uppercase tracking-wider text-primary mb-2 font-bold flex items-center gap-1.5">
                                    <HiOutlineLightBulb className="w-4 h-4" /> Gemini AI Insight
                                </h4>
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(rec.insight);
                                        return (
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <p className="text-sm font-semibold text-slate-200">{parsed.summary}</p>
                                                    {parsed.risk_level && (
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                            parsed.risk_level === 'low' ? 'bg-success/20 text-success' :
                                                            parsed.risk_level === 'high' ? 'bg-danger/20 text-danger' :
                                                            'bg-warning/20 text-warning'
                                                        }`}>{parsed.risk_level} Risk</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-muted leading-relaxed">{parsed.detailed_analysis}</p>
                                                {parsed.action_items && parsed.action_items.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-[11px] text-text-muted uppercase font-semibold mb-1">Action Items:</p>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {parsed.action_items.map((item, idx) => (
                                                                <li key={idx} className="text-sm text-slate-300">{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    } catch {
                                        return <p className="text-sm text-text-muted leading-relaxed">{rec.insight || rec.reason}</p>;
                                    }
                                })()}
                            </div>

                            {rec.competitorsUsed && rec.competitorsUsed.length > 0 ? (
                                <div className="mb-4">
                                    <p className="text-[10px] text-text-muted mb-2 font-semibold uppercase tracking-wider">Live Competitor Pricing Data</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {rec.competitorsUsed.map((comp, idx) => (
                                            <div key={idx} className="shrink-0 bg-surface/50 p-2.5 rounded-lg border border-primary/10 min-w-[170px] max-w-[220px]">
                                                <p className="text-[10px] text-text-muted font-medium mb-0.5">{comp.platform || comp.name}</p>
                                                {comp.url ? (
                                                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary-light hover:underline font-medium line-clamp-2 block" title={comp.productName || comp.name}>
                                                        {comp.productName || comp.name}
                                                    </a>
                                                ) : (
                                                    <p className="text-[11px] text-text font-medium line-clamp-2" title={comp.productName || comp.name}>{comp.productName || comp.name}</p>
                                                )}
                                                <div className="flex justify-between items-end mt-1.5">
                                                    <p className="text-sm text-primary-light font-bold">₹{comp.price}</p>
                                                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${comp.inStock ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                        {comp.inStock ? 'In Stock' : 'OOS'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 rounded-lg bg-warning/5 border border-warning/20">
                                    <p className="text-xs text-warning font-medium">⚠ Failed to fetch competitor prices. Configure your API key or add competitors manually.</p>
                                </div>
                            )}


                            {rec.status === 'pending' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleAccept(rec._id, rec.expectedRevenueImpact)} className="btn-primary flex items-center gap-2">
                                        <HiOutlineCheck className="w-4 h-4" /> Accept & Apply Price
                                    </button>
                                    <button onClick={async () => {
                                        try {
                                            await rejectRecommendation(rec._id);
                                            toast.success('Recommendation rejected');
                                            fetchData();
                                        } catch { toast.error('Failed to reject'); }
                                    }} className="btn-secondary flex items-center gap-2 text-danger hover:bg-danger/10 hover:border-danger/30">
                                        ✕ Reject
                                    </button>
                                </div>
                            )}
                            {rec.status === 'accepted' && (
                                <div className="flex gap-3 mt-4 pt-4 border-t border-[rgba(99,102,241,0.1)]">
                                    <button onClick={() => handleRevert(rec._id)} className="btn-secondary flex items-center gap-2 text-warning hover:bg-warning/10 hover:border-warning/30">
                                        <HiOutlineRefresh className="w-4 h-4" /> Undo & Revert Price
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {recommendations.length === 0 && (
                <div className="glass-card empty-state">
                    <HiOutlineLightBulb className="empty-state-icon w-16 h-16" />
                    <h3 className="text-lg font-semibold text-text mb-1">No recommendations yet</h3>
                    <p className="text-text-muted text-sm">Click on a product above to generate one</p>
                </div>
            )}
        </div>
    );
}
