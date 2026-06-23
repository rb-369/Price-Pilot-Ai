import { useState, useEffect } from 'react';
import { getIntegrations, connectShopify, disconnectIntegration, syncShopifyProducts } from '../api';
import toast from 'react-hot-toast';
import { HiOutlineLink, HiOutlineRefresh, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import ErrorState from '../components/ErrorState';

export default function Integrations() {
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Shopify Modal State
    const [showShopifyModal, setShowShopifyModal] = useState(false);
    const [shopUrl, setShopUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [connecting, setConnecting] = useState(false);

    const fetchIntegrations = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await getIntegrations();
            setIntegrations(res.data);
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const handleConnectShopify = async (e) => {
        e.preventDefault();
        setConnecting(true);
        try {
            await connectShopify({ shopUrl, accessToken });
            toast.success('Shopify connected successfully!');
            setShowShopifyModal(false);
            setShopUrl('');
            setAccessToken('');
            fetchIntegrations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to connect Shopify');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async (id) => {
        if (!confirm('Are you sure you want to disconnect this integration?')) return;
        try {
            await disconnectIntegration(id);
            toast.success('Disconnected successfully');
            fetchIntegrations();
        } catch (err) {
            toast.error('Failed to disconnect');
        }
    };

    const handleSyncShopify = async () => {
        setIsSyncing(true);
        const toastId = toast.loading('Syncing products from Shopify...');
        try {
            const res = await syncShopifyProducts();
            toast.success(res.data.message || 'Sync complete!', { id: toastId });
            fetchIntegrations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sync failed', { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    if (error) {
        return <ErrorState title="Failed to load Integrations" onRetry={fetchIntegrations} />;
    }

    const shopifyIntegration = integrations.find(i => i.platform === 'shopify');

    return (
        <div className="space-y-6">
            <div className="animate-slide-up">
                <h1 className="page-header text-3xl">Integrations</h1>
                <p className="text-text-muted mt-1 text-sm">Connect your external e-commerce stores to manage inventory and pricing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                
                {/* Shopify Card */}
                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-text">Shopify</h3>
                            {shopifyIntegration ? (
                                <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                                    <HiOutlineCheckCircle className="w-4 h-4" /> Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-medium text-text-muted bg-surface-lighter px-2 py-1 rounded-full">
                                    Not Connected
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-muted mb-6">Import your Shopify products and sync AI-optimized prices automatically.</p>
                        
                        {shopifyIntegration && (
                            <div className="text-sm bg-[rgba(99,102,241,0.05)] rounded-lg p-3 mb-6">
                                <p className="text-text-muted">Shop: <span className="text-text font-medium">{shopifyIntegration.shopUrl}</span></p>
                                <p className="text-text-muted mt-1">Last Synced: <span className="text-text font-medium">{shopifyIntegration.lastSyncedAt ? new Date(shopifyIntegration.lastSyncedAt).toLocaleString() : 'Never'}</span></p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-4 border-t border-[rgba(99,102,241,0.08)] pt-4">
                        {shopifyIntegration ? (
                            <>
                                <button 
                                    onClick={handleSyncShopify} 
                                    disabled={isSyncing}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    <HiOutlineRefresh className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                                <button 
                                    onClick={() => handleDisconnect(shopifyIntegration._id)}
                                    className="btn-secondary px-3 flex items-center justify-center text-danger hover:text-danger hover:border-danger hover:bg-danger/10"
                                    title="Disconnect"
                                >
                                    <HiOutlineTrash className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setShowShopifyModal(true)} className="w-full btn-primary flex items-center justify-center gap-2">
                                <HiOutlineLink className="w-4 h-4" /> Connect Shopify
                            </button>
                        )}
                    </div>
                </div>

                {/* Coming Soon: Amazon */}
                <div className="glass-card p-6 flex flex-col justify-between opacity-60">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-text">Amazon Seller Central</h3>
                            <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">Coming Soon</span>
                        </div>
                        <p className="text-sm text-text-muted mb-6">Sync products and automatically win the Buy Box with AI pricing rules.</p>
                    </div>
                    <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
                        Available Soon
                    </button>
                </div>

                {/* Coming Soon: Flipkart */}
                <div className="glass-card p-6 flex flex-col justify-between opacity-60">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-text">Flipkart Seller Hub</h3>
                            <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">Coming Soon</span>
                        </div>
                        <p className="text-sm text-text-muted mb-6">Manage FSNs and run promotional AI pricing campaigns directly.</p>
                    </div>
                    <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
                        Available Soon
                    </button>
                </div>
            </div>

            {/* Shopify Connect Modal */}
            {showShopifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-[rgba(99,102,241,0.15)] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
                        <h2 className="text-xl font-bold text-text mb-2">Connect Shopify</h2>
                        <p className="text-sm text-text-muted mb-6">
                            Create a Custom App in your Shopify Admin with `write_products` and `read_products` scopes.
                        </p>
                        
                        <form onSubmit={handleConnectShopify} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">Shopify Store URL</label>
                                <input 
                                    className="input-field w-full" 
                                    placeholder="e.g. mystore.myshopify.com" 
                                    value={shopUrl}
                                    onChange={(e) => setShopUrl(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">Admin API Access Token</label>
                                <input 
                                    className="input-field w-full" 
                                    placeholder="shpat_..." 
                                    type="password"
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-3 justify-end pt-4 border-t border-[rgba(99,102,241,0.08)] mt-6">
                                <button type="button" onClick={() => setShowShopifyModal(false)} className="btn-secondary px-6">
                                    Cancel
                                </button>
                                <button type="submit" disabled={connecting} className="btn-primary px-6">
                                    {connecting ? 'Connecting...' : 'Connect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
