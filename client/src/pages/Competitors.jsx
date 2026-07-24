import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    HiDownload,
    HiOutlineChartBar,
    HiOutlineCube,
    HiOutlineScale,
    HiOutlineTrendingDown,
    HiOutlineTrendingUp,
    HiOutlineTrash,
} from 'react-icons/hi';
import { deleteProduct, getCompetitorPrices, getLatestCompetitorPrices, getProducts } from '../api';
import ErrorState from '../components/ErrorState';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import { exportToCSV } from '../utils/export';

const competitorColors = {
    Amazon: '#FF9900',
    Flipkart: '#2874F0',
    Myntra: '#FF3E6C',
    Snapdeal: '#E40046',
    Meesho: '#570A57',
};

const formatPrice = (price) => `Rs. ${Number(price || 0).toLocaleString('en-IN')}`;

export default function Competitors() {
    const [prices, setPrices] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            getLatestCompetitorPrices().then((response) => setPrices(response.data)),
            getProducts().then((response) => setProducts(response.data.data || response.data)),
        ]).catch(() => {
            setError(true);
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedProduct) {
            setHistory([]);
            return;
        }

        getCompetitorPrices(selectedProduct).then((response) => {
            const grouped = response.data.reduce((result, price) => {
                const day = new Date(price.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                if (!result[day]) result[day] = { day };
                result[day][price.competitorName] = price.competitorPrice;
                return result;
            }, {});
            setHistory(Object.values(grouped).reverse().slice(-15));
        }).catch(() => setHistory([]));
    }, [selectedProduct]);

    const productPrices = useMemo(() => prices.reduce((result, price) => {
        const productId = price._id?.productId?.toString();
        if (!productId || !price.product) return result;
        if (!result[productId]) result[productId] = { product: price.product, competitors: [] };
        result[productId].competitors.push({
            name: price._id.competitorName,
            productName: price._id.productName || '',
            url: price.url || '',
            price: price.latestPrice,
            inStock: price.inStock,
            timestamp: price.timestamp,
        });
        return result;
    }, {}), [prices]);

    const summary = useMemo(() => {
        const entries = Object.values(productPrices).flatMap((data) => data.competitors.map((competitor) => ({
            competitor,
            ourPrice: data.product.currentPrice,
        })));
        return {
            products: Object.keys(productPrices).length,
            offers: entries.length,
            lowerPriced: entries.filter(({ competitor, ourPrice }) => competitor.price < ourPrice).length,
        };
    }, [productPrices]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id);
            toast.success('Product deleted');
            if (selectedProduct === id) setSelectedProduct('');
            fetchData();
        } catch {
            toast.error('Failed to delete product');
        }
    };

    const handleExport = () => {
        const exportData = Object.values(productPrices).flatMap((data) => data.competitors.map((competitor) => ({
            Product: data.product.name,
            SKU: data.product.sku,
            Our_Price: data.product.currentPrice,
            Competitor_Name: competitor.name,
            Competitor_Price: competitor.price,
            In_Stock: competitor.inStock ? 'Yes' : 'No',
            Difference_Pct: (((competitor.price - data.product.currentPrice) / data.product.currentPrice) * 100).toFixed(1),
        })));
        exportToCSV(exportData, 'competitor-prices');
    };

    if (error) return <ErrorState title="Failed to load competitor data" onRetry={fetchData} />;

    if (loading) {
        return (
            <div className="space-y-6">
                <div><div className="skeleton mb-2 h-8 w-64 rounded" /><div className="skeleton h-4 w-48 rounded" /></div>
                <div className="grid gap-3 sm:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
                <SkeletonCard className="h-[400px]" />
                <SkeletonTable rows={5} columns={4} />
            </div>
        );
    }

    const historyCompetitors = Object.keys(competitorColors).filter((competitor) => history.some((point) => point[competitor]));

    return (
        <div className="space-y-7 pb-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-light">Market intelligence</p>
                    <h1 className="page-header mt-1 text-3xl">Competitor comparison</h1>
                    <p className="mt-2 text-sm text-text-muted">Monitor price position and availability across your tracked catalog.</p>
                </div>
                <button type="button" onClick={handleExport} disabled={!summary.offers} className="btn-secondary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                    <HiDownload className="h-4 w-4" />
                    Export CSV
                </button>
            </header>

            <section className="grid gap-3 sm:grid-cols-3" aria-label="Competitor summary">
                <div className="border border-border bg-surface-light p-4">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-text-muted">Tracked products</span><HiOutlineCube className="h-4 w-4 text-primary-light" /></div>
                    <p className="mt-3 text-2xl font-semibold text-text">{summary.products}</p>
                </div>
                <div className="border border-border bg-surface-light p-4">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-text-muted">Live competitor offers</span><HiOutlineChartBar className="h-4 w-4 text-accent" /></div>
                    <p className="mt-3 text-2xl font-semibold text-text">{summary.offers}</p>
                </div>
                <div className="border border-border bg-surface-light p-4">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-text-muted">Priced below us</span><HiOutlineTrendingDown className="h-4 w-4 text-warning" /></div>
                    <p className="mt-3 text-2xl font-semibold text-text">{summary.lowerPriced}</p>
                </div>
            </section>

            <section className="border border-border bg-surface-light">
                <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary-light"><HiOutlineScale className="h-5 w-5" /></div>
                        <div><h2 className="text-sm font-semibold text-text">Price history</h2><p className="mt-0.5 text-xs text-text-muted">Latest 15 competitor price observations</p></div>
                    </div>
                    <label className="sr-only" htmlFor="product-history">Choose a product</label>
                    <select id="product-history" className="input-field w-full sm:w-72" value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
                        <option value="">Choose a product to inspect</option>
                        {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
                    </select>
                </div>
                <div className="p-4 sm:p-6">
                    {history.length ? (
                        <div className="h-[300px] sm:h-[340px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                                    <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                                    {historyCompetitors.map((competitor) => <Line key={competitor} type="monotone" dataKey={competitor} stroke={competitorColors[competitor]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls={true} />)}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex h-[300px] flex-col items-center justify-center text-center">
                            <HiOutlineScale className="h-9 w-9 text-text-muted" />
                            <p className="mt-3 text-sm font-medium text-text">Select a product to view its price trend</p>
                            <p className="mt-1 text-xs text-text-muted">We will plot each tracked competitor separately.</p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div className="mb-4 flex items-center justify-between">
                    <div><h2 className="text-base font-semibold text-text">Latest price checks</h2><p className="mt-1 text-xs text-text-muted">Each row compares one competitor offer with your current price.</p></div>
                    <span className="hidden text-xs text-text-muted sm:block">{summary.offers} offers</span>
                </div>

                {Object.keys(productPrices).length ? (
                    <div className="space-y-4">
                        {Object.entries(productPrices).map(([productId, data]) => (
                            <article key={productId} className="overflow-hidden border border-border bg-surface-light">
                                <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-light"><HiOutlineCube className="h-4 w-4" /></div>
                                        <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-text">{data.product.name}</h3><p className="mt-0.5 text-xs text-text-muted">Your price: <span className="font-medium text-text">{formatPrice(data.product.currentPrice)}</span>{data.product.sku ? `  |  ${data.product.sku}` : ''}</p></div>
                                    </div>
                                    <button type="button" onClick={() => handleDelete(productId)} className="self-end rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger sm:self-auto" aria-label={`Delete ${data.product.name}`} title="Delete product"><HiOutlineTrash className="h-4 w-4" /></button>
                                </div>

                                <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(100px,0.75fr)_100px_110px] gap-4 border-b border-border bg-surface px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted md:grid">
                                    <span>Competitor</span><span className="text-right">Their price</span><span className="text-center">Availability</span><span className="text-right">Difference</span>
                                </div>
                                <div className="divide-y divide-border">
                                    {data.competitors.map((competitor, index) => {
                                        const difference = data.product.currentPrice ? ((competitor.price - data.product.currentPrice) / data.product.currentPrice) * 100 : 0;
                                        const competitorIsHigher = difference >= 0;
                                        return (
                                            <div key={`${productId}-${competitor.name}-${index}`} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(100px,0.75fr)_100px_110px] md:items-center md:gap-4 md:px-5">
                                                <div className="flex flex-col justify-center">
                                                    <div className="flex items-center justify-between md:block"><span className="text-sm font-medium text-text">{competitor.name}</span><span className="text-xs text-text-muted md:hidden">{formatPrice(competitor.price)}</span></div>
                                                    {competitor.productName && (
                                                        <div className="mt-1">
                                                            {competitor.url ? (
                                                                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-light hover:underline line-clamp-1">{competitor.productName}</a>
                                                            ) : (
                                                                <span className="text-xs text-text-muted line-clamp-1">{competitor.productName}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="hidden text-right text-sm font-semibold text-text md:block">{formatPrice(competitor.price)}</span>
                                                <div className="md:text-center"><span className={`badge ${competitor.inStock ? 'badge-success' : 'badge-danger'} text-[10px]`}>{competitor.inStock ? 'In stock' : 'Out of stock'}</span></div>
                                                <div className={`flex items-center gap-1 text-sm font-semibold md:justify-end ${competitorIsHigher ? 'text-success' : 'text-danger'}`}>
                                                    {competitorIsHigher ? <HiOutlineTrendingUp className="h-4 w-4" /> : <HiOutlineTrendingDown className="h-4 w-4" />}
                                                    {competitorIsHigher ? '+' : ''}{difference.toFixed(1)}%
                                                    <span className="text-xs font-normal text-text-muted md:hidden">vs you</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-border bg-surface-light px-6 py-14 text-center"><HiOutlineScale className="mx-auto h-9 w-9 text-text-muted" /><p className="mt-3 text-sm font-medium text-text">No competitor prices yet</p><p className="mt-1 text-xs text-text-muted">Add products and competitor sources to begin monitoring the market.</p></div>
                )}
            </section>
        </div>
    );
}
