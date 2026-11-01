import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight } from "react-icons/lu";

export interface TestimonialItem {
    /** Unique identifier for the card */
    id: string | number;
    /** Title displayed for the card */
    title: string;
    /** Description text for the card */
    description: string;
    /** Category or department tag */
    category?: string;
    /** Secondary badge or label */
    badge?: string;
    /** Publication date or version */
    date?: string;
    /** Optional link or target */
    link?: string;
    /** Optional image (retained for type compatibility, not rendered for text sliding) */
    image?: string;
}

export interface TestimonialsCardProps {
    /** Array of testimonial / policy items to display */
    items: TestimonialItem[];
    /** Additional CSS classes for the container */
    className?: string;
    /** Width of the card stack (default: 420) */
    width?: number | string;
    /** Whether to show navigation arrows (default: true) */
    showNavigation?: boolean;
    /** Whether to show the counter (default: true) */
    showCounter?: boolean;
    /** Whether to enable auto-play (default: false) */
    autoPlay?: boolean;
    /** Auto-play interval in ms (default: 3500) */
    autoPlayInterval?: number;
}

export function TestimonialsCard({
    items,
    className,
    width = 420,
    showNavigation = true,
    showCounter = true,
    autoPlay = false,
    autoPlayInterval = 3500,
}: TestimonialsCardProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-play effect with pause on hover
    useEffect(() => {
        if (!autoPlay || items.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setDirection(1);
            setActiveIndex((prev) => (prev + 1) % items.length);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, items.length, isHovered]);

    const handleNext = useCallback(() => {
        if (activeIndex < items.length - 1) {
            setDirection(1);
            setActiveIndex((prev) => prev + 1);
        } else if (autoPlay) {
            setDirection(1);
            setActiveIndex(0);
        }
    }, [activeIndex, items.length, autoPlay]);

    const handlePrev = useCallback(() => {
        if (activeIndex > 0) {
            setDirection(-1);
            setActiveIndex((prev) => prev - 1);
        } else if (autoPlay) {
            setDirection(-1);
            setActiveIndex(items.length - 1);
        }
    }, [activeIndex, items.length, autoPlay]);

    const handleSelect = useCallback((index: number) => {
        if (index === activeIndex) return;
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
    }, [activeIndex]);

    // Refined subtle rotations for layered deck look
    const rotations = useMemo(() => [2.5, -2, -3.5, 3], []);

    if (!items || items.length === 0) {
        return null;
    }

    const cardWidthStyle = typeof width === "number" ? `${width}px` : width;

    return (
        <div
            className={cn("w-full flex items-center justify-center select-none py-2", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Shifted row: Card stack slightly left, controls shifted right with generous gap */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-7 sm:gap-10 md:gap-14 lg:gap-16">
                {/* Left: Card Stack (reduced size, shifted left) + Pagination Dots */}
                <div className="flex flex-col items-center md:-translate-x-3">
                    <div
                        className="relative w-[290px] sm:w-[370px] md:w-[410px] h-[215px] sm:h-[210px]"
                        style={{
                            perspective: "1400px",
                            maxWidth: cardWidthStyle,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        <AnimatePresence custom={direction}>
                            {items.map((item, index) => {
                                const isActive = index === activeIndex;
                                const offset = index - activeIndex;

                                // Only render cards within a visible window for optimal performance
                                if (Math.abs(offset) > 3) return null;

                                return (
                                    <motion.div
                                        key={item.id}
                                        onClick={() => !isActive && handleSelect(index)}
                                        className={cn(
                                            "absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between overflow-hidden transition-colors duration-200",
                                            "border shadow-xl backdrop-blur-md",
                                            isActive
                                                ? "bg-white/95 dark:bg-[#2D211B] border-[#3D1F12]/20 dark:border-[#4A3930] shadow-[0_20px_40px_-15px_rgba(61,31,18,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] cursor-default"
                                                : "bg-[#F7F4EE]/90 dark:bg-[#241812]/90 border-[#3D1F12]/15 dark:border-[#38261E] cursor-pointer hover:border-[#3D1F12]/30 dark:hover:border-[#A85A3C]/40"
                                        )}
                                        initial={{
                                            x: offset * 12,
                                            y: Math.abs(offset) * 5,
                                            z: -140 * Math.abs(offset),
                                            scale: 0.9 - Math.abs(offset) * 0.035,
                                            rotateZ: rotations[index % 4],
                                            opacity: isActive ? 1 : 0.5,
                                            zIndex: 10 - Math.abs(offset),
                                        }}
                                        animate={
                                            isActive
                                                ? {
                                                    x: [offset * 12, direction === 1 ? -160 : 160, 0],
                                                    y: [Math.abs(offset) * 5, 0, 0],
                                                    z: [-180, 140, 220],
                                                    scale: [0.9, 1.02, 1],
                                                    rotateZ: [rotations[index % 4], direction === 1 ? -3 : 3, 0],
                                                    opacity: 1,
                                                    zIndex: 100,
                                                }
                                                : {
                                                    x: offset * 12,
                                                    y: Math.abs(offset) * 5,
                                                    z: -140 * Math.abs(offset),
                                                    rotateZ: rotations[index % 4],
                                                    scale: 0.9 - Math.abs(offset) * 0.035,
                                                    opacity: Math.max(0.35, 0.65 - Math.abs(offset) * 0.12),
                                                    zIndex: 10 - Math.abs(offset),
                                                }
                                        }
                                        exit={{
                                            x: direction === 1 ? -190 : 190,
                                            z: -240,
                                            scale: 0.78,
                                            rotateZ: direction === 1 ? -8 : 8,
                                            opacity: 0,
                                        }}
                                        transition={{
                                            duration: 0.7,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        {/* Card Top Row: Category pill & Secondary badge */}
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                {item.category && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#3D1F12]/10 dark:bg-[#3D1F12]/40 text-[#A85A3C] dark:text-[#E29D7D] border border-[#A85A3C]/20">
                                                        {item.category}
                                                    </span>
                                                )}
                                                {item.badge && (
                                                    <span className="text-[10px] font-mono text-[#3D1F12]/50 dark:text-[#A99D91]">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reduced Title Font Size */}
                                            <h4 className="font-display text-[13.5px] sm:text-[14.5px] font-bold text-[#3D1F12] dark:text-[#F0EEE6] leading-snug line-clamp-2">
                                                {item.title}
                                            </h4>

                                            {/* Reduced Description Font Size & Tight Leading */}
                                            {item.description && (
                                                <p className="text-[11px] sm:text-[11.5px] text-[#3D1F12]/75 dark:text-[#A99D91] mt-1.5 leading-relaxed line-clamp-3">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Bottom Meta */}
                                        <div className="flex items-center justify-between pt-2.5 border-t border-[#3D1F12]/10 dark:border-[#4A3930]/60 mt-1.5">
                                            <span className="text-[11px] font-semibold text-[#A85A3C] dark:text-[#F0B094] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                                                Read Policy Document <span aria-hidden="true">→</span>
                                            </span>
                                            {item.date && (
                                                <span className="text-[10px] font-mono text-[#3D1F12]/50 dark:text-[#A99D91]">
                                                    {item.date}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Dot Indicators centered directly under the card with generous downward spacing */}
                    {items.length > 1 && (
                        <div className="flex items-center justify-center gap-1.5 mt-10 sm:mt-12">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSelect(i)}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                                        i === activeIndex
                                            ? "w-6 bg-[#A85A3C] dark:bg-[#F0B094]"
                                            : "w-2 bg-[#3D1F12]/25 dark:bg-white/20 hover:bg-[#3D1F12]/50 dark:hover:bg-white/40"
                                    )}
                                    aria-label={`Go to item ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Counter & Navigation Arrows (shifted right) */}
                <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:gap-3.5 z-20 relative md:translate-x-3">
                    {/* Counter Badge */}
                    {showCounter && (
                        <div className="px-3 py-1.5 rounded-xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] font-mono text-xs font-bold text-[#3D1F12] dark:text-[#F0EEE6] shadow-sm">
                            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
                            <span className="text-[#3D1F12]/40 dark:text-[#A99D91]"> / </span>
                            <span className="text-[#3D1F12]/60 dark:text-[#A99D91]">{String(items.length).padStart(2, "0")}</span>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {showNavigation && items.length > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={activeIndex === 0 && !autoPlay}
                                onClick={handlePrev}
                                className={cn(
                                    "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all shadow-sm",
                                    "border-[#3D1F12]/20 dark:border-[#4A3930] bg-white/90 dark:bg-[#2D211B] text-[#3D1F12] dark:text-[#F0EEE6]",
                                    activeIndex === 0 && !autoPlay
                                        ? "opacity-40 cursor-not-allowed"
                                        : "hover:bg-[#3D1F12]/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 hover:border-[#3D1F12]/40"
                                )}
                                aria-label="Previous card"
                            >
                                <ArrowLeft className="w-4 h-4 text-[#3D1F12] dark:text-[#F0EEE6]" />
                            </button>
                            <button
                                type="button"
                                disabled={activeIndex === items.length - 1 && !autoPlay}
                                onClick={handleNext}
                                className={cn(
                                    "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all shadow-sm",
                                    "border-[#3D1F12]/20 dark:border-[#4A3930] bg-white/90 dark:bg-[#2D211B] text-[#3D1F12] dark:text-[#F0EEE6]",
                                    activeIndex === items.length - 1 && !autoPlay
                                        ? "opacity-40 cursor-not-allowed"
                                        : "hover:bg-[#3D1F12]/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 hover:border-[#3D1F12]/40"
                                )}
                                aria-label="Next card"
                            >
                                <ArrowRight className="w-4 h-4 text-[#3D1F12] dark:text-[#F0EEE6]" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TestimonialsCard;
