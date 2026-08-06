import { useState, useEffect } from 'react';
import api from '../api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { HiOutlineInformationCircle, HiOutlineAdjustments } from 'react-icons/hi';
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

    // Determine the data to show based on selected product
    let currentFactors = xaiData?.factors || [];
    let currentSimulations = xaiData?.simulations || { basePrice: 0, scenarios: [] };

    if (selectedProductId !== 'global') {
        const selectedRec = recommendations.find(r => r.productId?._id === selectedProductId);
        const selectedProduct = products.find(p => p._id === selectedProductId);

        if (selectedRec && selectedRec.factors) {
            const xai = [
                { name: 'Competitor Pricing', impact: Math.abs(selectedRec.factors.competitorFactor || 35), type: (selectedRec.factors.competitorFactor || 1) >= 0 ? 'positive' : 'negative' },
                { name: 'Demand Trend', impact: Math.abs(selectedRec.factors.demandFactor || 25), type: (selectedRec.factors.demandFactor || 1) >= 0 ? 'positive' : 'negative' },
                { name: 'Stock Level', impact: Math.abs(selectedRec.factors.stockFactor || 15), type: (selectedRec.factors.stockFactor || 1) >= 0 ? 'positive' : 'negative' }
            ];
            currentFactors = xai.filter(f => f.impact > 0).sort((a,b) => b.impact - a.impact);
        } else {
            // Default factors for products that don't have an AI recommendation yet
            currentFactors = [
                { name: 'Base Cost', impact: 40, type: 'negative' },
                { name: 'Market Demand', impact: 20, type: 'positive' }
            ];
        }
        
        const basePrice = selectedRec?.recommendedPrice || selectedProduct?.currentPrice || 120;
        currentSimulations = {
            basePrice: Math.round(basePrice),
            scenarios: [
                { id: 'demand_surge', name: 'Social Media Trend Surge (+80% Demand)', price: Math.round(basePrice * 1.15) },
                { id: 'competitor_drop', name: 'Key Competitor Drops Price (-20%)', price: Math.round(basePrice * 0.85) },
                { id: 'stock_low', name: 'Supply Chain Delay (Stock < 5%)', price: Math.round(basePrice * 1.25) }
            ]
        };
    }

    const { formatCurrency } = useCurrency();
    const [whatIfScenario, setWhatIfScenario] = useState('');
    const [simulatedPrice, setSimulatedPrice] = useState(0);

    useEffect(() => {
        if (currentSimulations.scenarios.length > 0) {
            setWhatIfScenario(currentSimulations.scenarios[0].id);
            setSimulatedPrice(currentSimulations.scenarios[0].price);
        }
    }, [currentSimulations.scenarios, selectedProductId]);

    const handleScenarioChange = (e) => {
        const scenarioId = e.target.value;
        setWhatIfScenario(scenarioId);
        const scenario = currentSimulations.scenarios.find(s => s.id === scenarioId);
        if (scenario) {
            setSimulatedPrice(scenario.price);
        }
    };

    return (
        <div className="glass-card p-6 border-l-[3px] border-l-indigo-500 col-span-1 md:col-span-2">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Importance Chart */}
                <div className="bg-surface/50 border border-primary/10 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 text-center uppercase tracking-widest">Global Feature Impact</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={currentFactors} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                                    {currentFactors.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.type === 'positive' ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* What-If Simulator */}
                <div className="bg-surface/50 border border-primary/10 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-widest">
                            <HiOutlineAdjustments className="w-5 h-5 text-indigo-400" /> What-If Simulator
                        </h3>
                        <p className="text-xs text-text-muted mb-4">Simulate how external events would change the AI's recommended price.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-2">Select Scenario</label>
                                <select 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={whatIfScenario}
                                    onChange={handleScenarioChange}
                                >
                                    {currentSimulations.scenarios.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Simulated Price</p>
                            <p className="text-3xl font-black text-indigo-400">{formatCurrency(simulatedPrice)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
