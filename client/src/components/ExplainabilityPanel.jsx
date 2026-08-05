import { useState, useEffect } from 'react';
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

const ExplainabilityPanel = ({ xaiData }) => {
    const factors = xaiData?.factors || [];
    const simulations = xaiData?.simulations || {
        basePrice: 0,
        scenarios: []
    };

    const { formatCurrency } = useCurrency();
    const [whatIfScenario, setWhatIfScenario] = useState('');
    const [simulatedPrice, setSimulatedPrice] = useState(0);

    useEffect(() => {
        if (simulations.scenarios.length > 0 && !whatIfScenario) {
            setWhatIfScenario(simulations.scenarios[0].id);
            setSimulatedPrice(simulations.scenarios[0].price);
        }
    }, [simulations.scenarios, whatIfScenario]);

    const handleScenarioChange = (e) => {
        const scenarioId = e.target.value;
        setWhatIfScenario(scenarioId);
        const scenario = simulations.scenarios.find(s => s.id === scenarioId);
        if (scenario) {
            setSimulatedPrice(scenario.price);
        }
    };

    return (
        <div className="glass-card p-6 border-l-[3px] border-l-indigo-500 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                        <HiOutlineInformationCircle className="w-6 h-6 text-indigo-400" />
                        Explainable AI (XAI) Engine
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Understanding the factors driving current price recommendations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Importance Chart */}
                <div className="bg-surface/50 border border-primary/10 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 text-center uppercase tracking-widest">Global Feature Impact</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={factors} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                                    {factors.map((entry, index) => (
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
                                    {simulations.scenarios.map(s => (
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
