import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl">
                <p className="text-sm font-semibold text-slate-200">{data.name}</p>
                <p className={`text-xs mt-1 ${data.type === 'positive' ? 'text-success' : 'text-danger'}`}>
                    Impact: {data.type === 'positive' ? '+' : ''}{data.impact}%
                </p>
            </div>
        );
    }
    return null;
};

const ExplainabilityPanel = ({ xaiData, recommendations = [] }) => {
    const [selectedProductId, setSelectedProductId] = useState('global');
    const [products, setProducts] = useState([]);

    useEffect(() => {
        api.get('/products?limit=100').then(res => {
            const data = res.data.products || res.data.data || res.data;
            if (Array.isArray(data)) setProducts(data);
        }).catch(err => console.error("Failed to fetch products for XAI:", err));
    }, []);

    const { currentFactors } = useMemo(() => {
        let factors = xaiData?.factors || [];

        if (selectedProductId !== 'global') {
            const selectedRec = recommendations.find(r => r.productId?._id === selectedProductId);

            if (selectedRec && selectedRec.factors) {
                const xai = [
                    { name: 'Competitor Pricing', impact: Math.abs(selectedRec.factors.competitorFactor || 35), type: (selectedRec.factors.competitorFactor || 1) >= 0 ? 'positive' : 'negative' },
                    { name: 'Demand Trend', impact: Math.abs(selectedRec.factors.demandFactor || 25), type: (selectedRec.factors.demandFactor || 1) >= 0 ? 'positive' : 'negative' },
                    { name: 'Stock Level', impact: Math.abs(selectedRec.factors.stockFactor || 15), type: (selectedRec.factors.stockFactor || 1) >= 0 ? 'positive' : 'negative' }
                ];
                factors = xai.filter(f => f.impact > 0).sort((a,b) => b.impact - a.impact);
            } else {
                factors = [
                    { name: 'Base Cost', impact: 40, type: 'negative' },
                    { name: 'Market Demand', impact: 20, type: 'positive' }
                ];
            }
        }
        return { currentFactors: factors };
    }, [xaiData, recommendations, products, selectedProductId]);

    return (
        <div className="glass-card p-6 border-t-2 border-t-indigo-500 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                        <HiOutlineInformationCircle className="w-6 h-6 text-indigo-400" />
                        Explainable AI (XAI) Engine
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Understanding the factors driving current price recommendations</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-400">Target:</label>
                    <select 
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        disabled={products.length === 0}
                    >
                        <option value="global">Global (Latest Data)</option>
                        {products.map(p => (
                            <option key={p._id} value={p._id}>
                                {p.name || 'Product'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Feature Importance Chart */}
            <div className="bg-surface/50 border border-primary/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 text-center uppercase tracking-widest">Global Feature Impact Factors</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={currentFactors} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                                {currentFactors.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.type === 'positive' ? '#10b981' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
