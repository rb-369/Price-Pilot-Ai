import { useState, useEffect } from 'react';
import {
    getIntegrations, connectShopify, connectAmazon, connectFlipkart,
    disconnectIntegration, syncShopifyProducts, testIntegrationConnection,
    syncIntegrationNow, getAllSyncLogs
} from '../api';
import toast from 'react-hot-toast';
import {
    HiOutlineLink, HiOutlineRefresh, HiOutlineTrash, HiOutlineCheckCircle,
    HiOutlineExclamationCircle, HiOutlineLightningBolt, HiOutlineClock,
    HiOutlineDocumentReport
} from 'react-icons/hi';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';

export default function Integrations() {
    const [integrations, setIntegrations] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [disconnectTarget, setDisconnectTarget] = useState(null);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    // Shopify Modal State
    const [showShopifyModal, setShowShopifyModal] = useState(false);
    const [shopUrl, setShopUrl] = useState('');
    const [shopifyToken, setShopifyToken] = useState('');

    // Amazon Modal State
    const [showAmazonModal, setShowAmazonModal] = useState(false);
    const [amazonAccessToken, setAmazonAccessToken] = useState('');
    const [amazonRefreshToken, setAmazonRefreshToken] = useState('');
    const [amazonSellerId, setAmazonSellerId] = useState('');
    const [amazonMarketplaceId, setAmazonMarketplaceId] = useState('A21TJRUUN4KGV');

    // Flipkart Modal State
    const [showFlipkartModal, setShowFlipkartModal] = useState(false);
    const [flipkartAppId, setFlipkartAppId] = useState('');
    const [flipkartAppSecret, setFlipkartAppSecret] = useState('');

    const [connecting, setConnecting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [intRes, logsRes] = await Promise.all([
                getIntegrations(),
                getAllSyncLogs(30),
            ]);
            setIntegrations(intRes.data || []);
            setLogs(logsRes.data?.data || []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Connect Handlers
    const handleConnectShopify = async (e) => {
        e.preventDefault();
        setConnecting(true);
        try {
            await connectShopify({ shopUrl, accessToken: shopifyToken });
            toast.success('Shopify connected successfully!');
            setShowShopifyModal(false);
            setShopUrl('');
            setShopifyToken('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to connect Shopify');
        } finally {
            setConnecting(false);
        }
    };

    const handleConnectAmazon = async (e) => {
        e.preventDefault();
        setConnecting(true);
        try {
            await connectAmazon({
                accessToken: amazonAccessToken,
                refreshToken: amazonRefreshToken,
                sellerId: amazonSellerId,
                marketplaceId: amazonMarketplaceId,
            });
            toast.success('Amazon SP-API connected successfully!');
            setShowAmazonModal(false);
            setAmazonAccessToken('');
            setAmazonRefreshToken('');
            setAmazonSellerId('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to connect Amazon');
        } finally {
            setConnecting(false);
        }
    };

    const handleConnectFlipkart = async (e) => {
        e.preventDefault();
        setConnecting(true);
        try {
            await connectFlipkart({
                applicationId: flipkartAppId,
                applicationSecret: flipkartAppSecret,
            });
            toast.success('Flipkart Seller Hub connected successfully!');
            setShowFlipkartModal(false);
            setFlipkartAppId('');
            setFlipkartAppSecret('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to connect Flipkart');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = (id) => {
        setDisconnectTarget(id);
    };

    const confirmDisconnect = async () => {
        if (!disconnectTarget) return;
        setIsDisconnecting(true);
        try {
            await disconnectIntegration(disconnectTarget);
            toast.success('Disconnected successfully');
            setDisconnectTarget(null);
            fetchData();
        } catch {
            toast.error('Failed to disconnect');
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleTestConnection = async (integration) => {
        const toastId = toast.loading(`Testing connection to ${integration.platform.toUpperCase()}...`);
        try {
            const res = await testIntegrationConnection(integration._id);
            if (res.data?.success) {
                toast.success(res.data.message || 'Connection test passed!', { id: toastId });
            } else {
                toast.error(res.data?.message || 'Connection test failed', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Connection test failed', { id: toastId });
        }
    };

    const handleSyncNow = async (integration) => {
        setIsSyncing(true);
        const toastId = toast.loading(`Polling ${integration.platform.toUpperCase()} for orders...`);
        try {
            if (integration.platform === 'shopify') {
                await syncShopifyProducts();
            }
            const res = await syncIntegrationNow(integration._id);
            toast.success(res.data?.message || 'Sync complete!', { id: toastId });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sync failed', { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    if (error) {
        return <ErrorState title="Failed to load Integrations" onRetry={fetchData} />;
    }

    const shopifyIntegration = integrations.find(i => i.platform === 'shopify');
    const amazonIntegration = integrations.find(i => i.platform === 'amazon');
    const flipkartIntegration = integrations.find(i => i.platform === 'flipkart');

    return (
        <div className="space-y-8">
            <div className="animate-slide-up">
                <h1 className="page-header text-3xl">Integrations Hub</h1>
                <p className="text-text-muted mt-1 text-sm">
                    Connect your seller accounts on Shopify, Amazon SP-API, and Flipkart Seller Hub for live order tracking and multi-channel inventory sync.
                </p>
            </div>

            {/* Platform Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>

                {/* Shopify Card */}
                <PlatformCard
                    title="Shopify Store"
                    subtitle="Import products and listen for order webhooks/polls."
                    integration={shopifyIntegration}
                    isSyncing={isSyncing}
                    onConnect={() => setShowShopifyModal(true)}
                    onDisconnect={handleDisconnect}
                    onTest={handleTestConnection}
                    onSync={handleSyncNow}
                />

                {/* Amazon SP-API Card */}
                <PlatformCard
                    title="Amazon Seller Central"
                    subtitle="SP-API order polling & multi-channel stock sync."
                    integration={amazonIntegration}
                    isSyncing={isSyncing}
                    onConnect={() => setShowAmazonModal(true)}
                    onDisconnect={handleDisconnect}
                    onTest={handleTestConnection}
                    onSync={handleSyncNow}
                />

                {/* Flipkart Seller Hub Card */}
                <PlatformCard
                    title="Flipkart Seller Hub"
                    subtitle="Listing API inventory updates & shipment order tracking."
                    integration={flipkartIntegration}
                    isSyncing={isSyncing}
                    onConnect={() => setShowFlipkartModal(true)}
                    onDisconnect={handleDisconnect}
                    onTest={handleTestConnection}
                    onSync={handleSyncNow}
                />
            </div>

            {/* Live Sync Activity Feed Table */}
            <div className="glass-card p-6 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between border-b border-[rgba(99,102,241,0.08)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <HiOutlineLightningBolt className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text">Multi-Channel Sync Feed</h3>
                            <p className="text-xs text-text-muted">Real-time log of order ingestions, cross-platform stock pushes, and 30-min reconciliations.</p>
                        </div>
                    </div>
                    <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                        <HiOutlineRefresh className="w-3.5 h-3.5" /> Refresh Log
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-[rgba(99,102,241,0.08)] bg-surface-lighter/50">
                                <th className="p-3">Time</th>
                                <th className="p-3">Platform</th>
                                <th className="p-3">Action</th>
                                <th className="p-3">Product / Details</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(99,102,241,0.05)] text-xs font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-text-muted">Loading sync logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-text-muted">No sync activity recorded yet. Connect a channel and trigger Sync Now.</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-surface-lighter/30">
                                        <td className="p-3 text-text-muted font-mono whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                        <td className="p-3 uppercase font-bold text-primary-light">
                                            {log.platform || 'System'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                log.action === 'order_ingested' ? 'bg-success/15 text-success' :
                                                log.action === 'stock_pushed' ? 'bg-primary/15 text-primary-light' :
                                                log.action === 'reconciliation' ? 'bg-accent/15 text-accent' : 'bg-surface-lighter text-text-muted'
                                            }`}>
                                                {log.action?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-text max-w-md truncate">
                                            {log.productId?.name ? <span className="font-semibold">{log.productId.name} ({log.productId.sku}): </span> : null}
                                            {log.details?.orderId ? `Order #${log.details.orderId} ` : ''}
                                            {log.details?.pushedQuantity !== undefined ? `Pushed Stock: ${log.details.pushedQuantity} ` : ''}
                                            {log.details?.newStock !== undefined ? `New Stock: ${log.details.newStock} ` : ''}
                                            {log.details?.reason || ''}
                                        </td>
                                        <td className="p-3">
                                            {log.status === 'success' ? (
                                                <span className="text-success flex items-center gap-1 font-bold">
                                                    <HiOutlineCheckCircle className="w-4 h-4" /> Success
                                                </span>
                                            ) : (
                                                <span className="text-danger flex items-center gap-1 font-bold">
                                                    <HiOutlineExclamationCircle className="w-4 h-4" /> {log.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Shopify Modal */}
            {showShopifyModal && (
                <Modal title="Connect Shopify Store" onClose={() => setShowShopifyModal(false)}>
                    <form onSubmit={handleConnectShopify} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Shopify Store URL</label>
                            <input
                                className="input-field w-full text-sm"
                                placeholder="e.g. mystore.myshopify.com"
                                value={shopUrl}
                                onChange={(e) => setShopUrl(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Admin API Access Token</label>
                            <input
                                className="input-field w-full text-sm font-mono"
                                placeholder="shpat_..."
                                type="password"
                                value={shopifyToken}
                                onChange={(e) => setShopifyToken(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-[rgba(99,102,241,0.08)] mt-6">
                            <button type="button" onClick={() => setShowShopifyModal(false)} className="btn-secondary px-5 text-sm">Cancel</button>
                            <button type="submit" disabled={connecting} className="btn-primary px-5 text-sm">{connecting ? 'Connecting...' : 'Connect'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Amazon Modal */}
            {showAmazonModal && (
                <Modal title="Connect Amazon SP-API" onClose={() => setShowAmazonModal(false)}>
                    <form onSubmit={handleConnectAmazon} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Seller ID / Merchant ID</label>
                            <input
                                className="input-field w-full text-sm font-mono"
                                placeholder="e.g. A21TJRUUN4KGV"
                                value={amazonSellerId}
                                onChange={(e) => setAmazonSellerId(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">LWA Access Token / API Key</label>
                            <input
                                className="input-field w-full text-sm font-mono"
                                placeholder="Atza|..."
                                type="password"
                                value={amazonAccessToken}
                                onChange={(e) => setAmazonAccessToken(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">LWA Refresh Token (Optional for Sandbox)</label>
                            <input
                                className="input-field w-full text-sm font-mono"
                                placeholder="Atzr|..."
                                type="password"
                                value={amazonRefreshToken}
                                onChange={(e) => setAmazonRefreshToken(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Marketplace Region</label>
                            <select
                                className="input-field w-full text-sm"
                                value={amazonMarketplaceId}
                                onChange={(e) => setAmazonMarketplaceId(e.target.value)}
                            >
                                <option value="A21TJRUUN4KGV">India (Amazon.in - A21TJRUUN4KGV)</option>
                                <option value="ATVPDKIKX0DER">US (Amazon.com - ATVPDKIKX0DER)</option>
                                <option value="A1F83G8C2ARO7P">UK (Amazon.co.uk - A1F83G8C2ARO7P)</option>
                            </select>
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-[rgba(99,102,241,0.08)] mt-6">
                            <button type="button" onClick={() => setShowAmazonModal(false)} className="btn-secondary px-5 text-sm">Cancel</button>
                            <button type="submit" disabled={connecting} className="btn-primary px-5 text-sm">{connecting ? 'Connecting...' : 'Connect'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Flipkart Modal */}
            {showFlipkartModal && (
                <Modal title="Connect Flipkart Seller Hub" onClose={() => setShowFlipkartModal(false)}>
                    <form onSubmit={handleConnectFlipkart} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Application ID (Seller ID)</label>
                            <input
                                className="input-field w-full text-sm font-mono"
                                placeholder="Generated in Seller Hub > Developer Access"
                                value={flipkartAppId}
                                onChange={(e) => setFlipkartAppId(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Application Secret</label>
                            <input
                                className="input-field w-full text-sm font-mono"
                                placeholder="App Secret key"
                                type="password"
                                value={flipkartAppSecret}
                                onChange={(e) => setFlipkartAppSecret(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-[rgba(99,102,241,0.08)] mt-6">
                            <button type="button" onClick={() => setShowFlipkartModal(false)} className="btn-secondary px-5 text-sm">Cancel</button>
                            <button type="submit" disabled={connecting} className="btn-primary px-5 text-sm">{connecting ? 'Connecting...' : 'Connect'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Non-blocking Confirm Disconnect Modal */}
            <ConfirmModal
                isOpen={!!disconnectTarget}
                onClose={() => setDisconnectTarget(null)}
                onConfirm={confirmDisconnect}
                title="Disconnect Integration"
                message="Are you sure you want to disconnect this store channel? Live order tracking and inventory sync will stop immediately."
                confirmText="Disconnect"
                variant="warning"
                loading={isDisconnecting}
            />
        </div>
    );
}

// ── Platform Card Component ────────────────────────────────────────────────
function PlatformCard({ title, subtitle, integration, isSyncing, onConnect, onDisconnect, onTest, onSync }) {
    const isConnected = integration && integration.status === 'active';

    return (
        <div className="glass-card p-6 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text">{title}</h3>
                    {isConnected ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/15 px-2.5 py-1 rounded-full">
                            <HiOutlineCheckCircle className="w-4 h-4" /> Connected
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-text-muted bg-surface-lighter px-2.5 py-1 rounded-full">
                            Not Connected
                        </span>
                    )}
                </div>
                <p className="text-sm text-text-muted mb-6">{subtitle}</p>

                {isConnected && (
                    <div className="text-xs bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.1)] rounded-xl p-3 mb-6 space-y-1">
                        <p className="text-text-muted flex justify-between">
                            <span>Last Poll:</span>
                            <span className="text-text font-medium">{integration.lastOrderPollAt ? new Date(integration.lastOrderPollAt).toLocaleTimeString() : 'Never'}</span>
                        </p>
                        <p className="text-text-muted flex justify-between">
                            <span>Last Stock Sync:</span>
                            <span className="text-text font-medium">{integration.lastSyncedAt ? new Date(integration.lastSyncedAt).toLocaleTimeString() : 'Never'}</span>
                        </p>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 border-t border-[rgba(99,102,241,0.08)] pt-4 mt-2">
                {isConnected ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onSync(integration)}
                            disabled={isSyncing}
                            className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                        >
                            <HiOutlineRefresh className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Now
                        </button>
                        <button
                            onClick={() => onTest(integration)}
                            className="btn-secondary py-2 px-3 text-xs"
                            title="Test API Connection"
                        >
                            Test
                        </button>
                        <button
                            onClick={() => onDisconnect(integration._id)}
                            className="btn-secondary py-2 px-2.5 text-danger hover:bg-danger/10 hover:border-danger"
                            title="Disconnect"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button onClick={onConnect} className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2">
                        <HiOutlineLink className="w-4 h-4" /> Connect Channel
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Simple Reusable Modal ──────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-[rgba(99,102,241,0.15)] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text">{title}</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text font-bold text-lg">×</button>
                </div>
                {children}
            </div>
        </div>
    );
}
