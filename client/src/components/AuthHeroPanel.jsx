import React from 'react';

export default function AuthHeroPanel() {
    return (
        <section
            aria-label="About PricePilot AI"
            className="w-full max-w-[420px] lg:max-w-[440px] bg-transparent text-text flex flex-col justify-center z-10 relative select-none shrink-0"
            style={{
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <style>{`
                .pp-hero-headline {
                    font-family: 'Bricolage Grotesque', sans-serif;
                    letter-spacing: -0.03em;
                    line-height: 1.08;
                }
                @keyframes ppDrawLine {
                    from { stroke-dashoffset: 650; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes ppFadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes ppPulseHalo {
                    0% { r: 5px; opacity: 0.8; stroke-width: 2px; }
                    50% { opacity: 0.4; stroke-width: 1.5px; }
                    100% { r: 16px; opacity: 0; stroke-width: 0.5px; }
                }
                .pp-line-anim {
                    stroke-dasharray: 650;
                    stroke-dashoffset: 650;
                    animation: ppDrawLine 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .pp-area-anim {
                    opacity: 0;
                    animation: ppFadeIn 1.2s ease-out 1.1s forwards;
                }
                .pp-tooltip-anim {
                    opacity: 0;
                    animation: ppFadeIn 0.8s ease-out 1.9s forwards;
                }
                .pp-halo-anim {
                    animation: ppPulseHalo 2.4s ease-out 2.2s infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .pp-line-anim {
                        stroke-dashoffset: 0 !important;
                        animation: none !important;
                    }
                    .pp-area-anim, .pp-tooltip-anim {
                        opacity: 1 !important;
                        animation: none !important;
                    }
                    .pp-halo-anim {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="w-full flex flex-col space-y-4 lg:space-y-4">
                {/* 1. Main Message & Savings Chart Card */}
                <div className="space-y-3.5 lg:space-y-3.5">
                    {/* Headline */}
                    <h1
                        className="pp-hero-headline font-extrabold text-text text-left max-w-[14ch]"
                        style={{ fontSize: 'clamp(26px, 2.7vw, 36px)' }}
                    >
                        Buy when the price is right.
                    </h1>

                    {/* Lead Paragraph - Desktop only */}
                    <p className="hidden lg:block text-text-muted text-[13.5px] sm:text-[14px] leading-relaxed max-w-[40ch] text-left font-normal">
                        PricePilot watches prices for you, spots real drops, and tells you the best moment to buy.
                    </p>

                    {/* 2. The Savings Chart Card without navy background - Desktop only */}
                    <div className="hidden lg:block w-full rounded-2xl border border-border/70 p-3.5 pb-2 bg-transparent shadow-xs">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-2 text-left">
                            <span className="text-[13px] font-semibold text-text">
                                Your savings this month
                            </span>
                            <span className="text-[12px] font-medium text-text-muted">
                                Last 30 days
                            </span>
                        </div>

                        {/* Chart Graphic */}
                        <div className="w-full overflow-hidden">
                            <svg
                                viewBox="0 0 480 215"
                                className="w-full h-auto overflow-visible"
                                role="img"
                                aria-label="Savings rise from ₹0 to ₹12,480 this month, passing the ₹10,000 goal."
                            >
                                <defs>
                                    <linearGradient id="ppSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                                        <stop offset="60%" stopColor="#16A34A" stopOpacity="0.08" />
                                        <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Background Grid Guidance line */}
                                <line x1="0" y1="180" x2="480" y2="180" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                                {/* Dashed Amber Goal Line at y=110 */}
                                <line
                                    x1="0"
                                    y1="110"
                                    x2="480"
                                    y2="110"
                                    stroke="#D97706"
                                    strokeWidth="1.5"
                                    strokeDasharray="5 5"
                                    opacity="0.85"
                                />
                                <text
                                    x="16"
                                    y="103"
                                    fill="#B45309"
                                    fontSize="11"
                                    fontWeight="600"
                                    fontFamily="'DM Sans', system-ui"
                                >
                                    Monthly goal ₹10,000
                                </text>

                                {/* Gradient Area Fill under rising line */}
                                <path
                                    d="M0 175 L50 160 L90 168 L140 130 L190 138 L240 100 L290 108 L340 65 L390 72 L440 38 L440 180 L0 180 Z"
                                    fill="url(#ppSavingsGrad)"
                                    className="pp-area-anim"
                                />

                                {/* Animated Rising Savings Line (M0 175 ... L440 38) */}
                                <path
                                    d="M0 175 L50 160 L90 168 L140 130 L190 138 L240 100 L290 108 L340 65 L390 72 L440 38"
                                    fill="none"
                                    stroke="#16A34A"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="pp-line-anim"
                                />

                                {/* Pulsing Halo at End Point (440, 38) */}
                                <circle
                                    cx="440"
                                    cy="38"
                                    r="5.5"
                                    fill="none"
                                    stroke="#16A34A"
                                    className="pp-halo-anim"
                                />

                                {/* Solid End Point Marker */}
                                <circle
                                    cx="440"
                                    cy="38"
                                    r="5.5"
                                    fill="#16A34A"
                                    stroke="var(--color-surface, #ffffff)"
                                    strokeWidth="2.5"
                                    className="pp-area-anim"
                                />

                                {/* Tooltip Pill near End Point */}
                                <g className="pp-tooltip-anim">
                                    <rect
                                        x="248"
                                        y="14"
                                        width="180"
                                        height="27"
                                        rx="13.5"
                                        fill="#1E293B"
                                        stroke="rgba(255,255,255,0.15)"
                                        strokeWidth="1"
                                        filter="drop-shadow(0 4px 10px rgba(0,0,0,0.25))"
                                    />
                                    <text
                                        x="338"
                                        y="31.5"
                                        textAnchor="middle"
                                        fill="#FFFFFF"
                                        fontSize="11.5"
                                        fontWeight="600"
                                        fontFamily="'DM Sans', system-ui"
                                    >
                                        ₹12,480 saved · Goal reached
                                    </text>
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 3. Feature Lines - Desktop only */}
                <ul className="hidden lg:flex flex-col space-y-2 pt-0.5 text-left list-none m-0 p-0">
                    <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                            <svg viewBox="0 0 16 16" className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                            </svg>
                        </span>
                        <p className="text-[12.5px] leading-snug m-0">
                            <strong className="font-semibold text-text">Real drops, not fake sales.</strong>{' '}
                            <span className="text-text-muted">Price history shows whether a deal is actually good.</span>
                        </p>
                    </li>

                    <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                            <svg viewBox="0 0 16 16" className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                            </svg>
                        </span>
                        <p className="text-[12.5px] leading-snug m-0">
                            <strong className="font-semibold text-text">Alerts at your target.</strong>{' '}
                            <span className="text-text-muted">Set a price once and we’ll message you when it’s hit.</span>
                        </p>
                    </li>

                    <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                            <svg viewBox="0 0 16 16" className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                            </svg>
                        </span>
                        <p className="text-[12.5px] leading-snug m-0">
                            <strong className="font-semibold text-text">Plain-language advice.</strong>{' '}
                            <span className="text-text-muted">Buy now or wait, with the reason why.</span>
                        </p>
                    </li>
                </ul>
            </div>
        </section>
    );
}
