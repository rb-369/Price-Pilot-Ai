import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import {
    HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineLightningBolt,
    HiOutlineLightBulb, HiOutlineBeaker, HiOutlineSwitchHorizontal,
    HiOutlineBadgeCheck, HiOutlineChatAlt2, HiOutlineCube, HiOutlineTag
} from 'react-icons/hi';

export const SLASH_COMMANDS = [
    {
        cmd: '/explain-simply',
        label: 'Explain with AI (Simple Seller Terms)',
        description: 'Translates complex pricing metrics & AI suggestions into simple 2-bullet seller guidance',
        prompt: '/explain-simply Explain this pricing recommendation in simple seller terms.',
        icon: HiOutlineLightBulb,
    },
    {
        cmd: '/what-if',
        label: 'What-If Simulation Scenario',
        description: 'Simulate price changes (e.g. /what-if i increased @Product price by 2000rs)',
        prompt: '/what-if i increased price by 500rs',
        icon: HiOutlineLightningBolt,
    },
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
    const { formatCurrency } = useCurrency();
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
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up max-h-64 overflow-y-auto custom-scrollbar">
            <div className="p-2 border-b border-border bg-surface-lighter/50 flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                    {activeTrigger === '@' ? (
                        <>
                            <HiOutlineTag className="w-3.5 h-3.5 text-primary" />
                            <span>Tag Product</span>
                        </>
                    ) : (
                        <>
                            <HiOutlineLightningBolt className="w-3.5 h-3.5 text-primary" />
                            <span>Mention Method</span>
                        </>
                    )}
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
                                    <span className="font-bold text-primary-light">{formatCurrency ? formatCurrency(item.currentPrice) : `₹${item.currentPrice}`}</span>
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
 * Helper to parse inline tokens: Markdown links [text](url), bold **text**, inline code `code`,
 * @product mentions, and standalone /slash-commands.
 */
function parseInlineMarkdownTokens(text, isUser = false) {
    if (!text) return null;

    // Regex to split on:
    // 1. Markdown link: [Label](url)
    // 2. Bold text: **bold**
    // 3. Inline code: `code`
    // 4. @Product mentions: @"Product Name" or @ProductName
    // 5. Standalone /slash-command (strictly preceded by start or space, followed by space or punctuation)
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|@"[^"]+"|@[a-zA-Z0-9_\-]+|(?<=^|\s)\/(?:explain-simply|what-if|analyze-competitors|demand-signals|inventory-forecast|pricing-recommendation|ab-tests|channel-sync|goal|grill-me|[a-zA-Z0-9_-]+)(?=\s|[.,;:!?]|$))/g;

    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
        if (!part) return null;

        // 1. Markdown link: [Label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            const [, linkText, linkUrl] = linkMatch;
            const cleanUrl = linkUrl.trim();
            if (cleanUrl.startsWith('/')) {
                return (
                    <Link
                        key={index}
                        to={cleanUrl}
                        className="inline-flex items-center gap-0.5 text-primary hover:text-primary-dark underline font-semibold transition-colors cursor-pointer"
                    >
                        {linkText}
                    </Link>
                );
            }
            return (
                <a
                    key={index}
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary hover:text-primary-dark underline font-semibold transition-colors cursor-pointer"
                >
                    {linkText}
                </a>
            );
        }

        // 2. Bold: **text**
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            const boldContent = part.slice(2, -2);
            return <strong key={index} className="font-bold text-text">{boldContent}</strong>;
        }

        // 3. Inline code: `code`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            const codeContent = part.slice(1, -1);
            return (
                <code key={index} className="px-1.5 py-0.5 rounded bg-surface-lighter/60 border border-border/80 font-mono text-[11px] text-accent">
                    {codeContent}
                </code>
            );
        }

        // 4. @Product tag: @"Product Name" or @SKU
        if (part.startsWith('@')) {
            const cleanName = part.replace(/^@"|"$/g, '').replace(/^@/, '');
            return (
                <span
                    key={index}
                    className={
                        isUser
                            ? "inline-flex items-center gap-1 bg-white/20 text-white border border-white/40 rounded px-1.5 py-0.5 text-xs font-semibold my-0.5 mx-0.5 backdrop-blur-xs shadow-xs"
                            : "inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/25 rounded px-1.5 py-0.5 text-xs font-semibold my-0.5 mx-0.5"
                    }
                >
                    <HiOutlineCube className="w-3 h-3 shrink-0" /> {cleanName}
                </span>
            );
        }

        // 5. Standalone slash command: /what-if
        if (part.startsWith('/') && !part.includes('//')) {
            return (
                <span
                    key={index}
                    className={
                        isUser
                            ? "inline-flex items-center gap-1 bg-white/20 text-white border border-white/40 rounded px-1.5 py-0.5 text-xs font-mono font-bold my-0.5 mx-0.5 backdrop-blur-xs shadow-xs"
                            : "inline-flex items-center gap-1 bg-copper/10 text-copper border border-copper/25 rounded px-1.5 py-0.5 text-xs font-mono font-bold my-0.5 mx-0.5"
                    }
                >
                    <HiOutlineTag className="w-3 h-3 shrink-0" /> {part}
                </span>
            );
        }

        return part;
    });
}

/**
 * Helper function to format chat message text containing Markdown, @tags, /commands, and What-If action cards.
 */
export function renderFormattedChatMessage(text, isUser = false, onOpenSimulator = null) {
    if (!text) return null;

    let mainContent = text;
    let actionPayload = null;

    if (text.includes('---ACTION_REDIRECT_WHAT_IF---')) {
        const parts = text.split('---ACTION_REDIRECT_WHAT_IF---');
        mainContent = parts[0].trim();
        const jsonCandidate = parts[1] ? parts[1].trim() : '';
        if (jsonCandidate) {
            try {
                actionPayload = JSON.parse(jsonCandidate);
            } catch (e) {
                console.error('Failed to parse what-if payload:', e);
                const pMatch = jsonCandidate.match(/"productQuery"\s*:\s*"([^"]+)"/i);
                const prMatch = jsonCandidate.match(/"priceChange"\s*:\s*"([^"]+)"/i);
                if (pMatch || prMatch) {
                    actionPayload = {
                        action: "redirect_what_if",
                        productQuery: pMatch ? pMatch[1] : "",
                        priceChange: prMatch ? prMatch[1] : ""
                    };
                }
            }
        }
    } else {
        // Fallback regex to catch raw {"action": "redirect_what_if", ...} JSON objects anywhere in text
        const jsonMatch = text.match(/{\s*"action"\s*:\s*"redirect_what_if"[\s\S]*}/i);
        if (jsonMatch) {
            try {
                actionPayload = JSON.parse(jsonMatch[0].trim());
                mainContent = text.replace(jsonMatch[0], '').trim();
            } catch (e) {
                console.error('Failed to parse regex what-if payload:', e);
                const pMatch = jsonMatch[0].match(/"productQuery"\s*:\s*"([^"]+)"/i);
                const prMatch = jsonMatch[0].match(/"priceChange"\s*:\s*"([^"]+)"/i);
                if (pMatch || prMatch) {
                    actionPayload = {
                        action: "redirect_what_if",
                        productQuery: pMatch ? pMatch[1] : "",
                        priceChange: prMatch ? prMatch[1] : ""
                    };
                    mainContent = text.replace(jsonMatch[0], '').trim();
                }
            }
        }
    }

    const lines = mainContent.split('\n');
    const blocks = [];
    let currentList = [];

    const flushList = (key) => {
        if (currentList.length > 0) {
            const isAllNumbered = currentList.every(item => item.type === 'number');
            if (isAllNumbered) {
                blocks.push(
                    <ol key={`ol-${key}`} className="my-2 space-y-1.5 pl-0.5 text-inherit">
                        {currentList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary-light font-bold text-[11px] select-none shrink-0 mt-0.5 border border-primary/30">
                                    {item.num || idx + 1}
                                </span>
                                <span className="flex-1 min-w-0">{item.text}</span>
                            </li>
                        ))}
                    </ol>
                );
            } else {
                blocks.push(
                    <ul key={`ul-${key}`} className="my-2 space-y-1 pl-1 text-inherit">
                        {currentList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                {item.type === 'number' ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary-light font-bold text-[11px] select-none shrink-0 mt-0.5 border border-primary/30">
                                        {item.num || idx + 1}
                                    </span>
                                ) : (
                                    <span className="text-primary-light font-bold select-none shrink-0 mt-0.5">•</span>
                                )}
                                <span className="flex-1 min-w-0">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                );
            }
            currentList = [];
        }
    };

    lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();

        // Ignore empty lines or stray single punctuation marks like '.' or '•' on their own line
        if (!trimmed || trimmed === '.' || trimmed === '•' || trimmed === '-' || trimmed === '*') {
            flushList(lineIdx);
            if (!trimmed) {
                blocks.push(<div key={`space-${lineIdx}`} className="h-1.5" />);
            }
            return;
        }

        // Handle bullet list item (•, -, *)
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[•\-*]\s*/, '');
            currentList.push({ type: 'bullet', text: parseInlineMarkdownTokens(itemText, isUser) });
            return;
        }

        // Handle numbered list item (e.g. "1. ", "2. ")
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
            currentList.push({ type: 'number', num: numMatch[1], text: parseInlineMarkdownTokens(numMatch[2], isUser) });
            return;
        }

        // Flush any active list when hitting non-list line
        flushList(lineIdx);

        // Heading 3
        if (trimmed.startsWith('### ')) {
            blocks.push(
                <h4 key={`h3-${lineIdx}`} className="mt-3 mb-1 text-sm font-bold text-text flex items-center gap-1.5">
                    {parseInlineMarkdownTokens(trimmed.slice(4), isUser)}
                </h4>
            );
            return;
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
            blocks.push(
                <h3 key={`h2-${lineIdx}`} className="mt-4 mb-1.5 text-sm sm:text-base font-bold text-text border-b border-border pb-1">
                    {parseInlineMarkdownTokens(trimmed.slice(3), isUser)}
                </h3>
            );
            return;
        }

        // Heading 1
        if (trimmed.startsWith('# ')) {
            blocks.push(
                <h2 key={`h1-${lineIdx}`} className="mt-4 mb-2 text-base sm:text-lg font-extrabold text-text">
                    {parseInlineMarkdownTokens(trimmed.slice(2), isUser)}
                </h2>
            );
            return;
        }

        // Normal paragraph line
        blocks.push(
            <p key={`p-${lineIdx}`} className="my-1 leading-relaxed">
                {parseInlineMarkdownTokens(trimmed, isUser)}
            </p>
        );
    });

    flushList('final');

    return (
        <div className="space-y-1">
            <div>{blocks}</div>
            {actionPayload && (
                <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface border border-border shadow-md text-text">
                        <div className="flex items-center justify-between text-xs font-bold text-copper">
                            <span className="flex items-center gap-1.5">
                                <HiOutlineLightningBolt className="w-4 h-4 text-copper animate-pulse" />
                                Interactive Scenario Ready
                            </span>
                        </div>
                        <span className="text-[11px] text-text-muted leading-snug">
                            {actionPayload.productQuery ? `Product: "${actionPayload.productQuery}"` : ''} {actionPayload.priceChange ? `• Proposed Change: ${actionPayload.priceChange}` : ''}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenSimulator) {
                                    onOpenSimulator(actionPayload);
                                } else {
                                    const event = new CustomEvent('launch_what_if_simulator', { detail: actionPayload });
                                    window.dispatchEvent(event);
                                }
                            }}
                            className="mt-1 w-full py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <span>See Details in What-If Simulator</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
