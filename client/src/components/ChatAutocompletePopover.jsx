import { useState, useEffect, useRef } from 'react';
import { getProducts } from '../api';
import {
    HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineLightningBolt,
    HiOutlineLightBulb, HiOutlineBeaker, HiOutlineSwitchHorizontal,
    HiOutlineBadgeCheck, HiOutlineChatAlt2, HiOutlineCube, HiOutlineTag
} from 'react-icons/hi';

export const SLASH_COMMANDS = [
    {
        cmd: '/analyze-competitors',
        label: 'Analyze Competitors',
        description: 'Compare current pricing against market competitors & price gaps',
        prompt: 'Analyze competitor pricing trends and show me where we are priced too high or too low.',
        icon: HiOutlineChartBar,
    },
    {
        cmd: '/demand-signals',
        label: 'Demand Signals & Trends',
        description: 'Surface elasticity, search trends, and demand intensity',
        prompt: 'Show me the key demand signals and market trends for my catalog.',
        icon: HiOutlineTrendingUp,
    },
    {
        cmd: '/inventory-forecast',
        label: 'Inventory Forecast',
        description: 'Forecast stock depletion, days-of-supply, and stockout risks',
        prompt: 'Generate an inventory forecast for my products and highlight stockout risks.',
        icon: HiOutlineLightningBolt,
    },
    {
        cmd: '/pricing-recommendation',
        label: 'AI Pricing Recommendations',
        description: 'Get AI price adjustment suggestions for maximum profit margin',
        prompt: 'Can you suggest price adjustments to optimize my margins and revenue?',
        icon: HiOutlineLightBulb,
    },
    {
        cmd: '/ab-tests',
        label: 'A/B Test Experiments',
        description: 'Review active price elasticity experiments and conversion lift',
        prompt: 'Show me active A/B pricing experiments and their revenue impact.',
        icon: HiOutlineBeaker,
    },
    {
        cmd: '/channel-sync',
        label: 'Channel Inventory Sync',
        description: 'Check stock sync and order polling status across Shopify, Amazon, Flipkart',
        prompt: 'Check multi-channel inventory sync status across Shopify, Amazon, and Flipkart.',
        icon: HiOutlineSwitchHorizontal,
    },
    {
        cmd: '/goal',
        label: 'Autonomous Goal Mode',
        description: 'Run extra-thorough catalog optimization goal',
        prompt: '/goal Optimize entire catalog for maximum profit margin while maintaining sales volume',
        icon: HiOutlineBadgeCheck,
    },
    {
        cmd: '/grill-me',
        label: 'Grill Me Strategy Session',
        description: 'Interview step-by-step to align on pricing strategy',
        prompt: '/grill-me Help me design a new dynamic pricing strategy for Q3',
        icon: HiOutlineChatAlt2,
    },
];

export default function ChatAutocompletePopover({
    input,
    setInput,
    inputRef,
    isOpen,
    setIsOpen,
    activeTrigger,
    setActiveTrigger,
    query,
    setQuery,
}) {
    const [products, setProducts] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedItemRef = useRef(null);

    // Fetch products once for @ tagging
    useEffect(() => {
        getProducts(1, 100)
            .then(res => {
                const prods = res.data?.data || res.data?.products || (Array.isArray(res.data) ? res.data : []);
                setProducts(Array.isArray(prods) ? prods : []);
            })
            .catch(() => {});
    }, []);

    // Filter items based on trigger type and query
    let items = [];
    if (activeTrigger === '@') {
        const q = (query || '').toLowerCase();
        items = products.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        ).slice(0, 8);
    } else if (activeTrigger === '/') {
        const q = (query || '').toLowerCase();
        items = SLASH_COMMANDS.filter(cmd =>
            cmd.cmd.toLowerCase().includes(q) ||
            cmd.label.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q)
        );
    }

    // Reset index when items change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, activeTrigger]);

    // Scroll selected item into view smoothly
    useEffect(() => {
        if (selectedItemRef.current) {
            selectedItemRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleSelect = (item) => {
        if (!inputRef?.current) return;

        const val = input;
        const lastTriggerIndex = val.lastIndexOf(activeTrigger);

        if (activeTrigger === '@') {
            const before = val.substring(0, lastTriggerIndex);
            const tagText = `@"${item.name}" `;
            const updated = before + tagText;
            setInput(updated);
        } else if (activeTrigger === '/') {
            // Insert ONLY the command string (e.g. "/analyze-competitors ")
            const before = val.substring(0, lastTriggerIndex);
            const updated = before + `${item.cmd} `;
            setInput(updated);
        }

        setIsOpen(false);
        setActiveTrigger(null);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const handleSelectRef = useRef(handleSelect);
    handleSelectRef.current = handleSelect;

    // Keyboard Navigation Listener (ArrowUp, ArrowDown, Tab, Enter, Escape)
    useEffect(() => {
        if (!isOpen || items.length === 0) return;

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
            } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault();
                e.stopPropagation();
                const selected = items[selectedIndex] || items[0];
                if (selected) {
                    handleSelectRef.current(selected);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
    }, [isOpen, items, selectedIndex]);

    if (!isOpen || items.length === 0) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-surface/95 backdrop-blur-md border border-[rgba(99,102,241,0.2)] rounded-xl shadow-2xl overflow-hidden animate-slide-up max-h-64 overflow-y-auto custom-scrollbar">
            <div className="p-2 border-b border-[rgba(99,102,241,0.1)] bg-surface-lighter/50 flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <span>
                    {activeTrigger === '@' ? '🏷️ Tag Product' : '⚡ Mention Method'}
                </span>
                <span className="text-[10px] normal-case opacity-70">
                    ↑↓ Navigate • Tab / Enter to select • Esc to dismiss
                </span>
            </div>

            <div className="p-1 space-y-0.5">
                {items.map((item, idx) => {
                    const isSelected = idx === selectedIndex;

                    if (activeTrigger === '@') {
                        return (
                            <button
                                key={item._id || item.sku}
                                ref={isSelected ? selectedItemRef : null}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                                    isSelected
                                        ? 'bg-primary/15 border border-primary/30 text-text font-medium shadow-sm'
                                        : 'hover:bg-surface-lighter text-text-muted hover:text-text'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-7 h-7 rounded-md object-cover bg-surface" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {item.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="truncate">
                                        <div className="font-semibold text-xs text-text truncate">{item.name}</div>
                                        <div className="text-[10px] text-text-muted font-mono">SKU: {item.sku}</div>
                                    </div>
                                </div>
                                <div className="text-right text-[11px] shrink-0 ml-2">
                                    <span className="font-bold text-primary-light">${item.currentPrice}</span>
                                    <span className="text-[10px] text-text-muted block">Stock: {item.stockLevel}</span>
                                </div>
                            </button>
                        );
                    }

                    // Slash Command Item
                    const Icon = item.icon || HiOutlineTag;
                    return (
                        <button
                            key={item.cmd}
                            ref={isSelected ? selectedItemRef : null}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${
                                isSelected
                                    ? 'bg-accent/15 border border-accent/30 text-text font-medium shadow-sm'
                                    : 'hover:bg-surface-lighter text-text-muted hover:text-text'
                            }`}
                        >
                            <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-text flex items-center gap-2">
                                    <span className="text-accent font-mono">{item.cmd}</span>
                                    <span className="text-text-muted font-normal">• {item.label}</span>
                                </div>
                                <div className="text-[11px] text-text-muted truncate">{item.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Helper function to format chat message text containing @tags and /commands with custom badges.
 */
export function renderFormattedChatMessage(text, isUser = false) {
    if (!text) return null;

    // Pattern to match @"Product Name" or @SKU or /command-name
    const regex = /(@"[^"]+"|\b\/[a-zA-Z0-9_-]+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (part.startsWith('@')) {
            const cleanName = part.replace(/^@"|"$/g, '').replace(/^@/, '');
            return (
                <span
                    key={index}
                    className={
                        isUser
                            ? "inline-flex items-center gap-1 bg-white/20 text-white border border-white/40 rounded px-1.5 py-0.5 text-xs font-semibold my-0.5 mx-0.5 backdrop-blur-xs shadow-xs"
                            : "inline-flex items-center gap-1 bg-primary/20 text-indigo-300 border border-primary/40 rounded px-1.5 py-0.5 text-xs font-semibold my-0.5 mx-0.5"
                    }
                >
                    <HiOutlineCube className="w-3 h-3" /> {cleanName}
                </span>
            );
        }

        if (part.startsWith('/')) {
            return (
                <span
                    key={index}
                    className={
                        isUser
                            ? "inline-flex items-center gap-1 bg-cyan-400/30 text-cyan-100 border border-cyan-300/60 rounded px-1.5 py-0.5 text-xs font-mono font-bold my-0.5 mx-0.5 backdrop-blur-xs shadow-xs"
                            : "inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded px-1.5 py-0.5 text-xs font-mono font-bold my-0.5 mx-0.5"
                    }
                >
                    <HiOutlineTag className="w-3 h-3" /> {part}
                </span>
            );
        }

        return part;
    });
}
