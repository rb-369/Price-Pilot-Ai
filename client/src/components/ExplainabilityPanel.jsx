import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import { useCurrency } from '../context/CurrencyContext';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPos = data.type === 'positive';
        return (
            <div className="bg-surface border border-border p-3.5 rounded-xl shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isPos ? 'bg-success' : 'bg-danger'}`} />
                    <p className="text-xs font-bold text-text uppercase tracking-wider">{data.name}</p>
                </div>
                <p className={`text-sm mt-1.5 font-bold ${isPos ? 'text-success' : 'text-danger'}`}>
                    Impact: {isPos ? '+' : '-'}{data.impact}%
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                    {isPos ? 'Upward elasticity driver' : 'Downward pricing pressure'}
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

    const renderCustomLabel = (props) => {
        const { x, y, width, height, value, index } = props;
        const factor = currentFactors[index];
        const isPos = factor?.type === 'positive';
        return (
            <text 
                x={x + width + 8} 
                y={y + height / 2 + 4} 
                fill={isPos ? 'var(--pp-success, #78B08B)' : 'var(--pp-danger, #F0685A)'} 
                fontSize={12} 
                fontWeight={700}
            >
                {isPos ? '+' : '-'}{value}%
            </text>
        );
    };

    return (
        <div className="glass-card p-6 border-t-2 border-t-primary col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                        <HiOutlineInformationCircle className="w-6 h-6 text-primary" />
                        Explainable AI (XAI) Engine
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Understanding the factors driving current price recommendations</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-text-muted">Target:</label>
                    <select 
                        className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text focus:outline-none focus:border-primary transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-surface-elevated/70 border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Global Feature Impact Factors</h3>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-success">
                            <span className="w-2 h-2 rounded-full bg-success" /> Positive Driver (+)
                        </span>
                        <span className="flex items-center gap-1.5 text-danger">
                            <span className="w-2 h-2 rounded-full bg-danger" /> Downward Pressure (-)
                        </span>
                    </div>
                </div>

                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={currentFactors} margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="positiveImpact" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4A855E" />
                                    <stop offset="100%" stopColor="#78B08B" />
                                </linearGradient>
                                <linearGradient id="negativeImpact" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#C0392B" />
                                    <stop offset="100%" stopColor="#F0685A" />
                                </linearGradient>
                            </defs>
                            <XAxis type="number" hide domain={[0, 'dataMax + 10']} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={130} 
                                tick={{ fill: 'var(--pp-text)', fontSize: 12, fontWeight: 500 }} 
                                axisLine={false} 
                                tickLine={false} 
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--pp-border)', opacity: 0.15 }} />
                            <Bar dataKey="impact" radius={[0, 8, 8, 0]} barSize={22}>
                                {currentFactors.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.type === 'positive' ? 'url(#positiveImpact)' : 'url(#negativeImpact)'} 
                                    />
                                ))}
                                <LabelList content={renderCustomLabel} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
