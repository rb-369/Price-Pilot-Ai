import { useState, useEffect } from 'react';
import { getProductMappings, getProducts, createProductMapping, deleteProductMapping, autoMatchMappings, confirmMapping, rejectMapping } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineSwitchHorizontal, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePlus, HiOutlineSparkles, HiOutlineTrash, HiOutlineSearch, HiOutlineTag } from 'react-icons/hi';
import ErrorState from '../components/ErrorState';

export default function ChannelMapping() {
    const [products, setProducts] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, confirmed, suggested, unmapped
    const [isAutoMatching, setIsAutoMatching] = useState(false);

    // Modal state for manual mapping
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [platform, setPlatform] = useState('amazon');
    const [externalSku, setExternalSku] = useState('');
    const [externalId, setExternalId] = useState('');
    const [externalName, setExternalName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [prodRes, mapRes] = await Promise.all([
                getProducts(1, 100),
                getProductMappings(),
            ]);
            
            // Fix: prodRes.data is { data: [...], page, limit, total }
            const rawProds = prodRes.data?.data || prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
            const rawMaps = mapRes.data?.data || (Array.isArray(mapRes.data) ? mapRes.data : []);

            setProducts(Array.isArray(rawProds) ? rawProds : []);
            setMappings(Array.isArray(rawMaps) ? rawMaps : []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleConfirm = async (id) => {
        try {
            await confirmMapping(id);
            toast.success('Mapping confirmed');
            fetchData();
        } catch {
            toast.error('Failed to confirm mapping');
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectMapping(id);
            toast.success('Suggested mapping rejected');
            fetchData();
        } catch {
            toast.error('Failed to reject mapping');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this channel link?')) return;
        try {
            await deleteProductMapping(id);
            toast.success('Link removed');
            fetchData();
        } catch {
            toast.error('Failed to remove link');
        }
    };

    const handleManualMapSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setSaving(true);
        try {
            await createProductMapping({
                productId: selectedProduct._id,
                platform,
                externalSku,
                externalId,
                externalName,
            });
            toast.success(`Mapped ${selectedProduct.name} to ${platform.toUpperCase()}`);
            setShowMapModal(false);
            setExternalSku('');
            setExternalId('');
            setExternalName('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create mapping');
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerAutoMatch = async () => {
        setIsAutoMatching(true);
        const toastId = toast.loading('Running AI fuzzy matching across products...');
        try {
            // Simulated external product list for demonstration / trigger
            const mockExternalCatalog = [
                { name: 'Wireless Bluetooth Earbuds Pro', sku: 'SKU-001', externalId: 'B08MOCK001' },
                { name: 'USB-C Cable Fast Charging 2-Pack', sku: 'SKU-002', externalId: 'B08MOCK002' },
                { name: 'Stainless Water Bottle 1L', sku: 'SKU-003', externalId: 'B08MOCK003' },
            ];
            const res = await autoMatchMappings('amazon', mockExternalCatalog);
            toast.success(res.data.message || 'AI Matching completed!', { id: toastId });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI Auto-match failed', { id: toastId });
        } finally {
            setIsAutoMatching(false);
        }
    };

    if (error) {
        return <ErrorState title="Failed to load Channel Mappings" onRetry={fetchData} />;
    }

    // Filter products & mappings
    const safeProducts = Array.isArray(products) ? products : [];
    const safeMappings = Array.isArray(mappings) ? mappings : [];

    const filteredProducts = safeProducts.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
        const prodMappings = safeMappings.filter(m => String(m.productId?._id || m.productId) === String(p._id));
        
        if (filterStatus === 'confirmed') return matchesSearch && prodMappings.some(m => m.status === 'confirmed');
        if (filterStatus === 'suggested') return matchesSearch && prodMappings.some(m => m.status === 'suggested');
        if (filterStatus === 'unmapped') return matchesSearch && prodMappings.length === 0;
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="page-header text-3xl flex items-center gap-3">
                        <HiOutlineSwitchHorizontal className="text-primary" /> Channel Mapping
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">
                        Link central PricePilot products with external platform SKUs (Amazon ASIN, Flipkart FSN, Shopify Variant).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTriggerAutoMatch}
                        disabled={isAutoMatching}
                        className="btn-secondary flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/10"
                    >
                        <HiOutlineSparkles className={`w-4 h-4 ${isAutoMatching ? 'animate-spin' : ''}`} />
                        {isAutoMatching ? 'Scanning...' : 'Scan with AI Match'}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <div className="relative w-full sm:w-80">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search product name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field w-full pl-9 py-2 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    {['all', 'confirmed', 'suggested', 'unmapped'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                                filterStatus === st
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-surface-lighter text-text-muted hover:text-text'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Mapping Bulk Table */}
            <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[rgba(99,102,241,0.08)] bg-surface-lighter/50 text-xs font-bold uppercase tracking-wider text-text-muted">
                                <th className="p-4">Central Product</th>
                                <th className="p-4">Shopify Link</th>
                                <th className="p-4">Amazon SP-API</th>
                                <th className="p-4">Flipkart Hub</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(99,102,241,0.05)] text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">
                                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                                        Loading product channel mappings...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">
                                        No products match the selected filter or search term.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const prodMappings = mappings.filter(m => String(m.productId?._id || m.productId) === String(product._id));
                                    const shopifyMap = prodMappings.find(m => m.platform === 'shopify');
                                    const amazonMap = prodMappings.find(m => m.platform === 'amazon');
                                    const flipkartMap = prodMappings.find(m => m.platform === 'flipkart');

                                    return (
                                        <tr key={product._id} className="hover:bg-surface-lighter/30 transition-colors">
                                            {/* Product Info */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-surface" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                            {product.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-text">{product.name}</div>
                                                        <div className="text-xs text-text-muted font-mono flex items-center gap-2">
                                                            <span>SKU: {product.sku}</span>
                                                            <span className="text-primary-light">Stock: {product.stockLevel}</span>
                                                            <span className="text-warning">Buffer: {product.safetyBuffer || 2}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Shopify */}
                                            <td className="p-4">
                                                <ChannelCell
                                                    mapping={shopifyMap}
                                                    externalId={product.externalIds?.shopifyId}
                                                    platform="shopify"
                                                    onConfirm={handleConfirm}
                                                    onReject={handleReject}
                                                    onDelete={handleDelete}
                                                />
                                            </td>

                                            {/* Amazon */}
                                            <td className="p-4">
                                                <ChannelCell
                                                    mapping={amazonMap}
                                                    externalId={product.externalIds?.amazonAsin}
                                                    platform="amazon"
                                                    onConfirm={handleConfirm}
                                                    onReject={handleReject}
                                                    onDelete={handleDelete}
                                                />
                                            </td>

                                            {/* Flipkart */}
                                            <td className="p-4">
                                                <ChannelCell
                                                    mapping={flipkartMap}
                                                    externalId={product.externalIds?.flipkartFsn}
                                                    platform="flipkart"
                                                    onConfirm={handleConfirm}
                                                    onReject={handleReject}
                                                    onDelete={handleDelete}
                                                />
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setShowMapModal(true);
                                                    }}
                                                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 ml-auto hover:border-primary hover:text-primary"
                                                >
                                                    <HiOutlinePlus className="w-3.5 h-3.5" /> Map Channel
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Link Modal */}
            {showMapModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-[rgba(99,102,241,0.15)] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
                        <h2 className="text-xl font-bold text-text mb-1">Map Channel</h2>
                        <p className="text-sm text-text-muted mb-4">
                            Link <span className="text-primary font-semibold">{selectedProduct.name}</span> to an external marketplace listing.
                        </p>

                        <form onSubmit={handleManualMapSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Platform</label>
                                <select
                                    className="input-field w-full text-sm"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                >
                                    <option value="amazon">Amazon SP-API (ASIN)</option>
                                    <option value="flipkart">Flipkart Seller Hub (FSN)</option>
                                    <option value="shopify">Shopify Store (Variant ID)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                                    {platform === 'amazon' ? 'Amazon ASIN' : platform === 'flipkart' ? 'Flipkart FSN' : 'Shopify Variant ID'}
                                </label>
                                <input
                                    type="text"
                                    className="input-field w-full text-sm font-mono"
                                    placeholder={platform === 'amazon' ? 'e.g. B08XYZ123' : platform === 'flipkart' ? 'e.g. FSNWIDGET01' : 'e.g. 44123456'}
                                    value={externalId}
                                    onChange={(e) => setExternalId(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Platform Seller SKU (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field w-full text-sm font-mono"
                                    placeholder="Leave blank to use central product SKU"
                                    value={externalSku}
                                    onChange={(e) => setExternalSku(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">External Listing Title (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field w-full text-sm"
                                    placeholder="Listing title on external marketplace"
                                    value={externalName}
                                    onChange={(e) => setExternalName(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-[rgba(99,102,241,0.08)] mt-6">
                                <button type="button" onClick={() => setShowMapModal(false)} className="btn-secondary px-5 text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn-primary px-5 text-sm">
                                    {saving ? 'Saving...' : 'Save Channel Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Cell Component for display ─────────────────────────────────────────────
function ChannelCell({ mapping, externalId, platform, onConfirm, onReject, onDelete }) {
    const displayId = mapping?.externalId || externalId;

    if (!mapping && !displayId) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted/50 bg-surface-lighter/50 px-2 py-1 rounded-md">
                Unlinked
            </span>
        );
    }

    // Suggested AI match
    if (mapping && mapping.status === 'suggested') {
        const confPercent = Math.round((mapping.confidence || 0) * 100);
        return (
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-text font-medium">{displayId || 'SKU Match'}</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <HiOutlineSparkles className="w-3 h-3" /> {confPercent}% Match
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onConfirm(mapping._id)}
                        className="text-xs text-success hover:underline font-semibold flex items-center gap-0.5"
                    >
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Confirm
                    </button>
                    <span className="text-text-muted/40">•</span>
                    <button
                        onClick={() => onReject(mapping._id)}
                        className="text-xs text-danger hover:underline font-semibold flex items-center gap-0.5"
                    >
                        <HiOutlineXCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                </div>
            </div>
        );
    }

    // Confirmed Link
    return (
        <div className="flex items-center gap-2 group">
            <span className="font-mono text-xs text-success-light bg-success/10 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <HiOutlineTag className="w-3 h-3" /> {displayId || 'Linked'}
            </span>
            {mapping && (
                <button
                    onClick={() => onDelete(mapping._id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-opacity"
                    title="Remove Link"
                >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
