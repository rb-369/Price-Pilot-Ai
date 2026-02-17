import { useState, useEffect } from 'react';
import { getRecommendations, getProducts, generateRecommendation, acceptRecommendation } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineLightBulb, HiOutlineCheck, HiOutlineRefresh, HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi';
import jsPDF from 'jspdf';

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);

    const fetchData = () => {
        Promise.all([
            getRecommendations().then(r => setRecommendations(r.data)).catch(() => { }),
            getProducts().then(r => setProducts(r.data)).catch(() => { }),
        ]).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleGenerate = async (productId) => {
        setGenerating(productId);
        try {
            const res = await generateRecommendation(productId);
            setRecommendations(prev => [res.data, ...prev]);
            toast.success('Recommendation generated');
        } catch {
            toast.error('Failed — is the AI service running?');
        } finally {
            setGenerating(null);
        }
    };

    const handleAccept = async (id) => {
        try {
            await acceptRecommendation(id);
            toast.success('Price updated!');
            fetchData();
        } catch {
            toast.error('Failed to apply');
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

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-header text-3xl">AI Recommendations</h1>
                    <p className="text-text-muted mt-1">Explainable pricing decisions powered by AI</p>
                </div>
                <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
                    📄 Export PDF
                </button>
            </div>

            {/* Generate Section */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                    <HiOutlineRefresh className="w-5 h-5 text-accent" /> Generate New Recommendation
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {products.slice(0, 10).map(p => (
                        <button key={p._id} onClick={() => handleGenerate(p._id)}
                            disabled={generating === p._id}
                            className="p-3 bg-surface/50 border border-border/30 rounded-xl text-left hover:border-primary/30 transition-all disabled:opacity-50">
                            <p className="text-sm font-medium text-text truncate">{p.name}</p>
                            <p className="text-xs text-text-muted">₹{p.currentPrice}</p>
                            {generating === p._id && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mt-1" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendation Cards */}
            <div className="space-y-4">
                {recommendations.map((rec, i) => {
                    const isIncrease = rec.recommendedPrice > rec.currentPrice;
                    const changePct = rec.currentPrice > 0 ? ((rec.recommendedPrice - rec.currentPrice) / rec.currentPrice * 100).toFixed(1) : 0;

                    return (
                        <div key={i} className={`glass-card p-6 border-l-4 ${rec.status === 'accepted' ? 'border-l-success' :
                                isIncrease ? 'border-l-primary' : 'border-l-accent'
                            }`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncrease ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
                                        }`}>
                                        {isIncrease ? <HiOutlineArrowUp className="w-5 h-5" /> : <HiOutlineArrowDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text">{rec.productId?.name || 'Product'}</h3>
                                        <p className="text-xs text-text-muted">SKU: {rec.productId?.sku || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={
                                        rec.status === 'accepted' ? 'badge-success' :
                                            rec.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                                    }>{rec.status}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className="text-sm text-text-muted">Current</p>
                                    <p className="text-lg font-bold text-text">₹{rec.currentPrice}</p>
                                </div>
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className="text-sm text-text-muted">Recommended</p>
                                    <p className={`text-lg font-bold ${isIncrease ? 'text-primary' : 'text-accent'}`}>₹{rec.recommendedPrice}</p>
                                </div>
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className="text-sm text-text-muted">Revenue Impact</p>
                                    <p className={`text-lg font-bold ${rec.expectedRevenueImpact > 0 ? 'text-success' : 'text-danger'}`}>
                                        {rec.expectedRevenueImpact > 0 ? '+' : ''}{rec.expectedRevenueImpact}%
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-surface/50 rounded-xl">
                                    <p className="text-sm text-text-muted">Confidence</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <p className="text-lg font-bold text-text">{(rec.confidenceScore * 100).toFixed(0)}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-surface/30 rounded-xl mb-4">
                                <p className="text-sm text-text-muted flex items-start gap-2">
                                    <HiOutlineLightBulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                                    {rec.reason}
                                </p>
                            </div>

                            {rec.status === 'pending' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleAccept(rec._id)} className="btn-primary flex items-center gap-2">
                                        <HiOutlineCheck className="w-4 h-4" /> Accept & Apply Price
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {recommendations.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <HiOutlineLightBulb className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted">No recommendations yet. Click on a product above to generate one.</p>
                </div>
            )}
        </div>
    );
}
