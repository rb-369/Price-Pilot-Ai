import { useState, useEffect } from 'react';
import { HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi';

/**
 * PricePilotChartLoader
 * 
 * Reusable, premium PricePilot Chart Loader based on THREE VERTICAL BAR-CHART BARS
 * that continuously move up and down in a live pricing & analytics wave.
 * 
 * Features:
 * - 3 independent bars animating via GPU-accelerated CSS `transform: scaleY()` with `transform-origin: bottom`.
 * - Full light/dark theme compliance using PricePilot's brand palette (Terracotta #A85A3C light / Copper #B8734F dark).
 * - Smart anti-flicker delay (`showDelay`, default 350ms): fast requests complete without showing any loader.
 * - Dynamic patience messages for long queries (3.5s+ "Still working on it...", 14s+ "Taking longer than expected").
 * - Error failure state handling: stops animation, reveals failure details and a connected [Retry] button.
 * - Accessibility: `role="status"`, `aria-live="polite"`, and `prefers-reduced-motion` static bar fallback.
 * 
 * Props:
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - message: optional status string (e.g. "Analyzing pricing opportunities...", "Generating demand forecast...")
 * - showDelay: ms before becoming visible (default: 350ms, set 0 for immediate)
 * - timeout: ms after which to prompt timeout/retry (default: 14000ms)
 * - onRetry: optional retry callback function
 * - error: boolean | string (if truthy, halts animation and shows error state)
 * - variant: 'card' | 'inline' | 'minimal' | 'fullscreen' (default: 'card' when message provided, else 'minimal')
 * - className: additional wrapper classes
 */
export default function PricePilotChartLoader({
    size = 'medium',
    message,
    showDelay = 350,
    timeout = 14000,
    onRetry = null,
    error = null,
    variant = message ? 'card' : 'minimal',
    className = '',
    ariaLabel,
}) {
    const [isVisible, setIsVisible] = useState(showDelay === 0 || !!error);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Smart delay: do NOT flash loader for fast instant requests (< 350ms)
    useEffect(() => {
        if (showDelay === 0 || error) {
            setIsVisible(true);
            return;
        }
        const timer = setTimeout(() => setIsVisible(true), showDelay);
        return () => clearTimeout(timer);
    }, [showDelay, error]);

    // Live elapsed timer for staged long-request updates
    useEffect(() => {
        if (!isVisible || error) return;
        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1000);
        }, 1000);
        return () => clearInterval(interval);
    }, [isVisible, error]);

    // Fast completion: never render if unmounted before delay expires
    if (!isVisible) {
        return null;
    }

    const isPatience = elapsedTime >= 3500 && elapsedTime < timeout;
    const isTimedOut = elapsedTime >= timeout;

    // Status messaging
    let primaryMessage = message || 'Loading PricePilot data...';
    let secondaryMessage = null;

    if (error) {
        primaryMessage = 'Connection interrupted';
        secondaryMessage = typeof error === 'string' ? error : "We couldn't reach PricePilot right now.";
    } else if (isTimedOut) {
        primaryMessage = 'Taking longer than expected.';
        secondaryMessage = 'The network or AI service may be responding slowly.';
    } else if (isPatience) {
        secondaryMessage = 'Still working on it...';
    }

    // Size configuration
    const sizeConfig = {
        small: {
            containerHeight: 'h-6',
            barWidth: 'w-1',
            gap: 'gap-1',
            rounded: 'rounded-t-[2px]',
            baselineWidth: 'w-7',
            textSize: 'text-xs',
            subTextSize: 'text-[10px]',
        },
        medium: {
            containerHeight: 'h-10',
            barWidth: 'w-2',
            gap: 'gap-1.5',
            rounded: 'rounded-t-[3px]',
            baselineWidth: 'w-12',
            textSize: 'text-sm font-medium',
            subTextSize: 'text-xs',
        },
        large: {
            containerHeight: 'h-16',
            barWidth: 'w-3',
            gap: 'gap-2',
            rounded: 'rounded-t-[4px]',
            baselineWidth: 'w-18',
            textSize: 'text-base font-semibold',
            subTextSize: 'text-xs',
        },
    }[size] || sizeConfig.medium;

    // The 3 Chart Bars
    const chartBars = (
        <div className="flex flex-col items-center justify-end select-none" aria-hidden="true">
            <div className={`flex items-end justify-center ${sizeConfig.gap} ${sizeConfig.containerHeight}`}>
                {/* Bar 1 */}
                <span
                    className={`h-full ${sizeConfig.barWidth} ${sizeConfig.rounded} ${
                        error
                            ? 'bg-danger/60 transform scale-y-45'
                            : 'bg-primary pricepilot-chart-bar-1'
                    }`}
                />
                {/* Bar 2 */}
                <span
                    className={`h-full ${sizeConfig.barWidth} ${sizeConfig.rounded} ${
                        error
                            ? 'bg-danger/80 transform scale-y-80'
                            : 'bg-primary pricepilot-chart-bar-2'
                    }`}
                />
                {/* Bar 3 */}
                <span
                    className={`h-full ${sizeConfig.barWidth} ${sizeConfig.rounded} ${
                        error
                            ? 'bg-danger/50 transform scale-y-60'
                            : 'bg-primary pricepilot-chart-bar-3'
                    }`}
                />
            </div>
            {/* Subtle Analytics Chart Baseline */}
            <div
                className={`${sizeConfig.baselineWidth} h-[1.5px] rounded-full mt-0.5 ${
                    error ? 'bg-danger/30' : 'bg-primary/25'
                }`}
            />
        </div>
    );

    // Minimal Variant: Just the animated bars
    if (variant === 'minimal') {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-label={ariaLabel || message || 'Loading...'}
                className={`inline-flex items-center justify-center animate-fade-in ${className}`}
            >
                {chartBars}
            </div>
        );
    }

    // Inline Variant: Bars next to status text (ideal for chips, button states, table rows)
    if (variant === 'inline') {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-label={ariaLabel || primaryMessage}
                className={`inline-flex items-center gap-2.5 animate-fade-in ${className}`}
            >
                {chartBars}
                <span className={`${sizeConfig.textSize} text-text font-medium truncate`}>
                    {primaryMessage}
                </span>
                {(error || isTimedOut) && onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="ml-1 text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                        <HiOutlineRefresh className="w-3 h-3" /> Retry
                    </button>
                )}
            </div>
        );
    }

    // Fullscreen Variant: For critical blocking bootstrap operations only
    if (variant === 'fullscreen') {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-label={ariaLabel || primaryMessage}
                className={`min-h-screen w-full flex flex-col items-center justify-center p-6 bg-surface/95 backdrop-blur-md animate-fade-in ${className}`}
            >
                <div className="flex flex-col items-center text-center max-w-sm space-y-4">
                    {chartBars}
                    <div className="space-y-1">
                        <p className={`${sizeConfig.textSize} text-text`}>{primaryMessage}</p>
                        {secondaryMessage && (
                            <p className={`${sizeConfig.subTextSize} text-text-muted`}>{secondaryMessage}</p>
                        )}
                    </div>
                    {(error || isTimedOut) && onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="btn-secondary text-xs px-4 py-2 mt-2 flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <HiOutlineRefresh className="w-3.5 h-3.5" /> Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Default Variant: 'card' (Contextual, fits smoothly in any dashboard card, tab, or section)
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={ariaLabel || primaryMessage}
            className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fade-in ${className}`}
        >
            <div className="flex flex-col items-center space-y-3.5 max-w-md">
                {error ? (
                    <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center mb-1">
                        <HiOutlineExclamationCircle className="w-6 h-6" />
                    </div>
                ) : (
                    chartBars
                )}

                <div className="space-y-1">
                    <p className={`${sizeConfig.textSize} text-text`}>{primaryMessage}</p>
                    {secondaryMessage && (
                        <p className={`${sizeConfig.subTextSize} text-text-muted transition-opacity duration-300`}>
                            {secondaryMessage}
                        </p>
                    )}
                </div>

                {(error || isTimedOut) && onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="btn-secondary text-xs px-4 py-2 mt-2 inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                        <HiOutlineRefresh className="w-3.5 h-3.5 text-primary" />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        </div>
    );
}
