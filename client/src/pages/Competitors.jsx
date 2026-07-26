import { useEffect, useMemo, useRef, useState } from 'react';
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
    HiOutlineRefresh,
    HiChevronDown,
    HiOutlineSearch,
} from 'react-icons/hi';
import { deleteProduct, getCompetitorPrices, getLatestCompetitorPrices, getProducts, fetchLiveCompetitorPrices } from '../api';
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

function SearchableProductSelect({ products, selectedProduct, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    const selectedObj = products.find((p) => p._id === selectedProduct);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={containerRef} className="relative w-full sm:w-72">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="input-field flex w-full items-center justify-between gap-2 text-left text-xs sm:text-sm py-2 px-3"
            >
                <span className="truncate">
                    {selectedObj ? selectedObj.name : 'Choose a product to inspect'}
                </span>
                <HiChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-full rounded-lg border border-border bg-surface-light p-2 shadow-2xl backdrop-blur-md">
                    <div className="relative mb-2 flex items-center">
                        <HiOutlineSearch className="absolute left-2.5 z-10 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field w-full py-1.5 text-xs"
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                        <button
                            type="button"
                            onClick={() => {
                                onSelect('');
                                setIsOpen(false);
                                setSearch('');
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors ${!selectedProduct ? 'bg-primary/20 text-primary-light font-semibold' : 'text-text-muted hover:bg-surface hover:text-text'}`}
                        >
                            Choose a product to inspect
                        </button>
                        {filtered.length > 0 ? (
                            filtered.map((product) => (
                                <button
                                    key={product._id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(product._id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors truncate ${selectedProduct === product._id ? 'bg-primary/20 text-primary-light font-semibold' : 'text-text hover:bg-surface'}`}
                                    title={product.name}
                                >
                                    {product.name}
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-3 text-center text-xs text-text-muted">No products found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Competitors() {
    const [prices, setPrices] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingPrices, setFetchingPrices] = useState(false);
    const [error, setError] = useState(false);
    const [pricesFetchFailed, setPricesFetchFailed] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [fetchingLiveProduct, setFetchingLiveProduct] = useState(null);

    const fetchData = () => {
        setLoading(true);
        setError(false);
        setFetchingPrices(true);
        setPricesFetchFailed(false);
        Promise.allSettled([
            getLatestCompetitorPrices(),
            getProducts(),
        ]).then(([pricesResult, productsResult]) => {
            if (pricesResult.status === 'fulfilled') {
                setPrices(pricesResult.value.data);
            } else {
                setPrices([]);
                setPricesFetchFailed(true);
            }
            if (productsResult.status === 'fulfilled') {
                setProducts(productsResult.value.data.data || productsResult.value.data);
            } else {
                setProducts([]);
            }
            if (pricesResult.status === 'rejected' && productsResult.status === 'rejected') {
                setError(true);
            }
        }).finally(() => {
            setLoading(false);
            setFetchingPrices(false);
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

        setFetchingHistory(true);
        getCompetitorPrices(selectedProduct).then((response) => {
            const grouped = response.data.reduce((result, price) => {
                const day = new Date(price.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                if (!result[day]) result[day] = { day };
                result[day][price.competitorName] = price.competitorPrice;
                return result;
            }, {});
            setHistory(Object.values(grouped).reverse().slice(-15));
        }).catch(() => setHistory([])).finally(() => setFetchingHistory(false));
    }, [selectedProduct]);

    const productPrices = useMemo(() => {
        const grouped = {};
        products.forEach(p => {
            grouped[p._id] = { product: p, competitors: [] };
        });

        prices.forEach((price) => {
            const productId = price._id?.productId?.toString();
            if (!productId || !grouped[productId]) return;
            grouped[productId].competitors.push({
                name: price._id.competitorName,
                productName: price._id?.productName || price.productName || '',
                url: price.url || price.competitorUrl || '',
                price: price.latestPrice,
                inStock: price.inStock,
                timestamp: price.timestamp,
            });
        });
        for (const key of Object.keys(grouped)) {
            grouped[key].competitors.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        }
        const sorted = Object.entries(grouped).sort(([, a], [, b]) => {
            const aLatest = a.competitors[0]?.timestamp ? new Date(a.competitors[0].timestamp) : new Date(0);
            const bLatest = b.competitors[0]?.timestamp ? new Date(b.competitors[0].timestamp) : new Date(0);
            return bLatest - aLatest;
        });
        return Object.fromEntries(sorted);
    }, [prices, products]);

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

    const handleFetchLive = async (productId) => {
        setFetchingLiveProduct(productId);
        if (selectedProduct === productId) {
            setFetchingHistory(true);
        }
        
        const loadingToast = toast.loading('Fetching live competitor prices...');
        try {
            await fetchLiveCompetitorPrices(productId);
            toast.success('Prices updated successfully', { id: loadingToast });
            const [pricesResult] = await Promise.allSettled([getLatestCompetitorPrices()]);
            if (pricesResult.status === 'fulfilled') setPrices(pricesResult.value.data);
            
            if (selectedProduct === productId) {
                const response = await getCompetitorPrices(productId);
                const grouped = response.data.reduce((result, price) => {
                    const day = new Date(price.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    if (!result[day]) result[day] = { day };
                    result[day][price.competitorName] = price.competitorPrice;
                    return result;
                }, {});
                setHistory(Object.values(grouped).reverse().slice(-15));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch live prices', { id: loadingToast });
            if (selectedProduct === productId) {
                try {
                    const response = await getCompetitorPrices(productId);
                    const grouped = response.data.reduce((result, price) => {
                        const day = new Date(price.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        if (!result[day]) result[day] = { day };
                        result[day][price.competitorName] = price.competitorPrice;
                        return result;
                    }, {});
                    setHistory(Object.values(grouped).reverse().slice(-15));
                } catch {
                    setHistory([]);
                }
            }
        } finally {
            setFetchingLiveProduct(null);
            if (selectedProduct === productId) {
                setFetchingHistory(false);
            }
        }
    };

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
                <div className="flex items-center gap-3">
                    <button type="button" onClick={handleExport} disabled={!summary.offers} className="btn-secondary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                        <HiDownload className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
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
                    <div className="flex items-center gap-2">
                        <SearchableProductSelect
                            products={products}
                            selectedProduct={selectedProduct}
                            onSelect={(id) => setSelectedProduct(id)}
                        />
                        {selectedProduct && (
                            <button
                                type="button"
                                onClick={() => handleFetchLive(selectedProduct)}
                                disabled={fetchingLiveProduct === selectedProduct}
                                className="rounded-lg p-2.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary-light border border-border disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                title="Fetch Live Prices for Selected Product"
                                aria-label="Fetch Live Prices"
                            >
                                {fetchingLiveProduct === selectedProduct ? (
                                    <svg className="h-4 w-4 animate-spin text-primary-light" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <HiOutlineRefresh className="h-4 w-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    {fetchingHistory ? (
                        <div className="flex h-[300px] flex-col items-center justify-center text-center">
                            <svg className="mb-3 h-9 w-9 animate-spin text-primary-light" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <p className="text-sm font-medium text-text">Loading price history...</p>
                        </div>
                    ) : history.length ? (
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
                    ) : selectedProduct ? (
                        <div className="flex h-[300px] flex-col items-center justify-center text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                                <span className="text-xl">✕</span>
                            </div>
                            <p className="text-sm font-medium text-text">Failed to fetch competitor prices</p>
                            <p className="mt-1 text-xs text-text-muted">No historical data available for this product.</p>
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
                    <div>
                        <h2 className="text-base font-semibold text-text">Latest price checks</h2>
                        <p className="mt-1 text-xs text-text-muted">Each row compares one competitor offer with your current price.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {fetchingPrices && (
                            <div className="flex items-center gap-2 text-xs text-primary-light">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Fetching prices…
                            </div>
                        )}
                        <span className="hidden text-xs text-text-muted sm:block">{summary.offers} offers</span>
                    </div>
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
                                    <div className="flex gap-2 self-end sm:self-auto">
                                        <button type="button" onClick={() => handleFetchLive(productId)} disabled={fetchingLiveProduct === productId} className="rounded-lg p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary-light disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Fetch Live Prices for ${data.product.name}`} title="Fetch Live Prices">
                                            {fetchingLiveProduct === productId ? <svg className="h-4 w-4 animate-spin text-primary-light" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <HiOutlineRefresh className="h-4 w-4" />}
                                        </button>
                                        <button type="button" onClick={() => handleDelete(productId)} className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${data.product.name}`} title="Delete product"><HiOutlineTrash className="h-4 w-4" /></button>
                                    </div>
                                </div>

                                <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(100px,0.75fr)_100px_110px] gap-4 border-b border-border bg-surface px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted md:grid">
                                    <span>Competitor</span><span className="text-right">Their price</span><span className="text-center">Availability</span><span className="text-right">Difference</span>
                                </div>
                                <div className="divide-y divide-border">
                                    {data.competitors.length > 0 ? (
                                        data.competitors.map((competitor, index) => {
                                            const difference = data.product.currentPrice ? ((competitor.price - data.product.currentPrice) / data.product.currentPrice) * 100 : 0;
                                            const competitorIsHigher = difference >= 0;
                                            return (
                                                <div key={`${productId}-${competitor.name}-${index}`} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(100px,0.75fr)_100px_110px] md:items-center md:gap-4 md:px-5">
                                                    <div className="flex flex-col justify-center">
                                                        <div className="flex items-center justify-between md:block"><span className="text-sm font-medium text-text">{competitor.name}</span><span className="text-xs text-text-muted md:hidden">{formatPrice(competitor.price)}</span></div>
                                                        {competitor.productName ? (
                                                            <div className="mt-1">
                                                                {competitor.url ? (
                                                                    <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-light hover:underline line-clamp-1" title={competitor.productName}>{competitor.productName}</a>
                                                                ) : (
                                                                    <span className="text-xs text-text-muted line-clamp-1" title={competitor.productName}>{competitor.productName}</span>
                                                                )}
                                                            </div>
                                                        ) : null}
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
                                        })
                                    ) : (
                                        <div className="px-5 py-6 text-center text-sm text-text-muted">
                                            No competitor prices found. Click the refresh button above to fetch live prices.
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="border border-border bg-surface-light px-6 py-14 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                            <span className="text-xl">✕</span>
                        </div>
                        <p className="mt-4 text-sm font-semibold text-text">Failed to fetch competitor prices</p>
                        <p className="mt-1.5 text-xs text-text-muted max-w-md mx-auto">We could not retrieve live competitor data. Please configure your RAINFOREST_API_KEY or add competitor prices manually.</p>
                        <button type="button" onClick={fetchData} className="btn-secondary mt-4 text-xs">
                            Try again
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
