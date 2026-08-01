import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { FiX, FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { getPriceHistory } from '../api';
import api from '../api';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

export default function PriceHistoryModal({ product, onClose }) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [historyData, setHistoryData] = useState([]);
  const [stats, setStats] = useState(null);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (!product?._id) return;
    fetchHistory(days);
  }, [product, days]);

  const fetchHistory = async (rangeDays) => {
    setLoading(true);
    try {
      const res = await getPriceHistory(product._id, rangeDays);
      const rawHistory = res.data.history || [];
      // Fetch Sales Data simultaneously
      let salesMap = {};
      try {
          const salesRes = await api.get(`/sales/product/${product._id}`);
          if (salesRes.data.success) {
              salesRes.data.data.forEach(metric => {
                  const d = new Date(metric.date);
                  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  salesMap[dateStr] = metric.totalUnitsSold;
              });
          }
      } catch (salesErr) {
          console.error('Failed to fetch sales history:', salesErr);
      }

      const formatted = rawHistory.map(item => {
        const d = new Date(item.timestamp);
        const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return {
          date: dateStr,
          fullDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          Price: item.price,
          BaseCost: item.baseCost,
          CompetitorAvg: item.competitorAvgPrice || null,
          Amazon: item.amazonPrice || null,
          Flipkart: item.flipkartPrice || null,
          SalesVolume: salesMap[dateStr] || 0
        };
      });
      setHistoryData(formatted);
      setStats(res.data.stats || null);
    } catch (err) {
      console.error('Failed to fetch price history:', err);
      toast.error('Could not load price history');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const currentPrice = product.currentPrice || stats?.currentPrice || 0;
  const baseCost = product.baseCost || stats?.baseCost || 0;
  const marginPct = currentPrice > 0 ? (((currentPrice - baseCost) / currentPrice) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                Price History Trend
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">
                  {product.sku || 'SKU'}
                </span>
              </h2>
              <p className="text-xs text-text-secondary truncate max-w-md">
                {product.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Range Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-1 text-xs">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    days === d
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchHistory(days)}
              className="p-2 rounded-lg border border-border hover:bg-surface text-text-secondary hover:text-text-primary transition"
              title="Refresh Trend"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-border hover:bg-surface text-text-secondary hover:text-text-primary transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-surface border border-border/80">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <FiDollarSign className="w-3.5 h-3.5 text-primary" /> Current Price
              </span>
              <p className="text-xl font-bold text-text-primary mt-1">{formatCurrency(currentPrice)}</p>
              <span className="text-[11px] text-emerald-500 font-semibold">{marginPct}% margin</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/80">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <FiTrendingDown className="w-3.5 h-3.5 text-emerald-400" /> Lowest Price
              </span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(stats?.lowestPrice || currentPrice)}</p>
              <span className="text-[11px] text-text-secondary">Historical Floor</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/80">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <FiTrendingUp className="w-3.5 h-3.5 text-amber-400" /> Highest Price
              </span>
              <p className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(stats?.highestPrice || currentPrice)}</p>
              <span className="text-[11px] text-text-secondary">Historical Ceiling</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/80">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <FiShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Competitor Avg
              </span>
              <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(stats?.avgCompetitorPrice || currentPrice)}</p>
              <span className="text-[11px] text-text-secondary">Market Benchmark</span>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                Price Trajectory vs Competitors ({days} Days)
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1 text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span> Your Price
                </span>
                <span className="flex items-center gap-1 text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span> Amazon
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span> Flipkart
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Base Cost
                </span>
              </div>
            </div>

            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : historyData.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-text-secondary text-sm">
                <FiCalendar className="w-8 h-8 opacity-40 mb-2" />
                No historical price records found for this timeframe.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorAmazon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorFlipkart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0084ff" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0084ff" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'Sales Volume') return [value, name];
                        return [formatCurrency(value), name];
                      }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                    />
                    <Bar yAxisId="right" dataKey="SalesVolume" fill="#10b981" fillOpacity={0.3} barSize={20} name="Sales Volume" />
                    <Area yAxisId="left" type="monotone" dataKey="Price" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" name="Your Price" />
                    <Area yAxisId="left" type="monotone" dataKey="Amazon" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorAmazon)" name="Amazon" />
                    <Area yAxisId="left" type="monotone" dataKey="Flipkart" stroke="#0084ff" strokeWidth={2} fillOpacity={1} fill="url(#colorFlipkart)" name="Flipkart" />
                    <Area yAxisId="left" type="monotone" dataKey="BaseCost" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Base Cost" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-xs text-text-secondary pt-2">
            <span>Historical baseline tracks manual price edits, accepted AI recommendations, and scraped competitor benchmarks.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface border border-border text-text-primary hover:bg-surface-header font-medium transition"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
