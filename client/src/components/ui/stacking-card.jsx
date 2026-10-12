import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Card presentation element.
 * The card design, colors, text, fonts, badges, and shadows are 100% UNCHANGED.
 */
const CardContent = ({ project, i, isCompact = false }) => {
  return (
    <div
      style={{ backgroundColor: project.color }}
      className={cn(
        'w-full rounded-[28px] border border-white/20 text-white',
        'shadow-[0_-8px_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center',
        'transition-all duration-300 relative select-none',
        isCompact ? 'p-4 sm:p-6' : 'p-6 sm:p-8'
      )}
    >
      {/* Top header row: visible when cards stack */}
      <div className="flex items-center justify-between w-full max-w-xl pb-2.5 sm:pb-3 mb-3 sm:mb-4 border-b border-white/10 text-xs font-mono">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="text-xs sm:text-sm font-extrabold tracking-tight px-2 sm:px-2.5 py-0.5 rounded-lg bg-white/15 text-white">
            0{i + 1}
          </span>
          <span className="font-semibold uppercase tracking-wider text-[#B8734F] text-[11px] sm:text-xs">
            {project.badge}
          </span>
        </div>
        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-[10px] sm:text-[11px] font-medium">
          {project.metric}
        </span>
      </div>

      {/* Centered Main Content */}
      <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-1 sm:py-2">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-extrabold tracking-tight text-white mb-2 sm:mb-3 text-center leading-snug">
          {project.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-center max-w-lg line-clamp-3 sm:line-clamp-none">
          {project.description}
        </p>
      </div>
    </div>
  );
};

/**
 * Normal scroll-stack Card.
 * Must be a direct child of the scroll container for position: sticky to work properly!
 */
export const Card = forwardRef(({
  i,
  title,
  description,
  color,
  badge,
  metric,
  totalCards,
  isTopCard,
  isStackFinished,
  onTopCardClick,
  scale = 1,
  opacity = 1,
}, ref) => {
  return (
    <div
      ref={ref}
      className="sticky will-change-transform"
      style={{
        // Increasing top offset keeps earlier cards peeking out as a thin strip behind the next one
        top: `calc(96px + ${i * 44}px)`,
        zIndex: 10 + i,
        marginBottom: i === totalCards - 1 ? '0px' : '56px',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        opacity: opacity,
        transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
      }}
    >
      <div
        onClick={isTopCard && isStackFinished ? onTopCardClick : undefined}
        className={cn(
          'w-full max-w-3xl mx-auto transition-all duration-300 relative',
          isTopCard && isStackFinished && 'cursor-pointer group'
        )}
      >
        <CardContent
          project={{ title, description, color, badge, metric }}
          i={i}
        />
      </div>
    </div>
  );
});

Card.displayName = 'Card';

/**
 * Main StackingCards Component:
 * - Phase 1: Native card-over-card scroll stacking (direct sticky children, scroll-based scale & dimming).
 * - Phase 2: Click on completed top card triggers smooth GPU spread into a clean 2x2 grid.
 * - Phase 3: Click again returns cards into the stack, restoring normal scroll behavior.
 */
const StackingCards = forwardRef(({ projects = [] }, externalRef) => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const gridContainerRef = useRef(null);
  const sampleCardRef = useRef(null);

  const [isSpread, setIsSpread] = useState(false);
  const [isStackFinished, setIsStackFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Scroll polish: earlier cards scale down slightly (~0.95) and dim when covered
  const [cardScales, setCardScales] = useState([1, 1, 1, 1]);
  const [cardOpacities, setCardOpacities] = useState([1, 1, 1, 1]);

  // Grid offsets calculation for smooth FLIP transition between stack and 2x2 grid
  const [gridMetrics, setGridMetrics] = useState({
    dx: 240,
    dy: 120,
  });

  // Track scroll position to update sticky stacking progress and detect stack completion
  const handleScroll = useCallback(() => {
    if (!cardRefs.current || cardRefs.current.length < 4) return;

    const isReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const baseTop = 96;
    const step = 44;

    // 1. Check if the stack is completed (topmost card is at its sticky docking top)
    const topCardEl = cardRefs.current[3];
    if (topCardEl) {
      const topRect = topCardEl.getBoundingClientRect();
      const targetTop = baseTop + 3 * step; // 96 + 132 = 228px
      if (topRect.top <= targetTop + 15) {
        setIsStackFinished(true);
      } else {
        setIsStackFinished(false);
      }
    }

    // 2. Scroll-driven scale down (0.95) and dimming (0.85) as each card gets covered
    if (isReducedMotion) {
      setCardScales([1, 1, 1, 1]);
      setCardOpacities([1, 1, 1, 1]);
      return;
    }

    const newScales = [1, 1, 1, 1];
    const newOpacities = [1, 1, 1, 1];

    for (let i = 0; i < 3; i++) {
      const nextCardEl = cardRefs.current[i + 1];
      if (nextCardEl) {
        const nextRect = nextCardEl.getBoundingClientRect();
        const targetNextTop = baseTop + (i + 1) * step;
        const distance = nextRect.top - targetNextTop;

        if (distance <= 0) {
          // Fully covered
          newScales[i] = 0.95;
          newOpacities[i] = 0.85;
        } else if (distance < 240) {
          // Progressively covering
          const factor = 1 - distance / 240;
          newScales[i] = 1 - 0.05 * factor;
          newOpacities[i] = 1 - 0.15 * factor;
        }
      }
    }

    setCardScales(newScales);
    setCardOpacities(newOpacities);
  }, []);

  // Update 2x2 grid coordinates relative to container
  const updateGridMetrics = useCallback(() => {
    if (!sampleCardRef.current || !gridContainerRef.current) return;
    const cardRect = sampleCardRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const gap = isMobile ? 12 : 20;

    const dx = (cardRect.width + gap) / 2;
    const dy = (cardRect.height + gap) / 2;

    setGridMetrics({ dx, dy });
  }, []);

  useEffect(() => {
    const handleSync = () => {
      handleScroll();
      updateGridMetrics();
    };

    const rafId = requestAnimationFrame(handleSync);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleSync, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleSync);
    };
  }, [handleScroll, updateGridMetrics]);

  // Open 2x2 spread grid
  const handleOpenSpread = () => {
    if (isAnimating || !isStackFinished) return;
    setIsAnimating(true);
    setIsSpread(true);
    setIsClosing(false);

    // Measure metrics right as grid appears
    setTimeout(() => {
      updateGridMetrics();
    }, 10);

    // Lock clicks until animation finishes (800ms duration + 210ms max stagger)
    setTimeout(() => {
      setIsAnimating(false);
    }, 1050);
  };

  // Close 2x2 spread grid back to stack
  const handleCloseSpread = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsClosing(true);

    // Allow reverse animation to complete before unmounting spread view
    setTimeout(() => {
      setIsSpread(false);
      setIsClosing(false);
      setIsAnimating(false);
    }, 1050);
  };

  // Forward ref handling
  const setCombinedRef = (node) => {
    containerRef.current = node;
    if (typeof externalRef === 'function') {
      externalRef(node);
    } else if (externalRef) {
      externalRef.current = node;
    }
  };

  // Get initial stack translate offsets for each card in the 2x2 grid
  const getStackOffset = (index) => {
    const { dx, dy } = gridMetrics;
    if (index === 0) return { sx: dx, sy: dy - 66, tilt: -3 };
    if (index === 1) return { sx: -dx, sy: dy - 22, tilt: 3 };
    if (index === 2) return { sx: dx, sy: -dy + 22, tilt: -2.5 };
    if (index === 3) return { sx: -dx, sy: -dy + 66, tilt: 2.5 };
    return { sx: 0, sy: 0, tilt: 0 };
  };

  return (
    <div
      ref={setCombinedRef}
      className={cn(
        'relative w-full max-w-4xl mx-auto pt-4 transition-[padding] duration-500',
        // Generous bottom padding keeps the stack comfortably pinned at the end for scrolling
        'pb-48 sm:pb-64'
      )}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. ORIGINAL CARD-OVER-CARD SCROLL STACK                       */}
      {/* Cards are direct children so position: sticky works reliably  */}
      {/* ------------------------------------------------------------- */}
      {projects.map((project, i) => {
        const isTopCard = i === projects.length - 1;
        return (
          <Card
            key={`p_${i}`}
            ref={(el) => (cardRefs.current[i] = el)}
            i={i}
            title={project.title}
            description={project.description}
            color={project.color}
            badge={project.badge}
            metric={project.metric}
            totalCards={projects.length}
            isTopCard={isTopCard}
            isStackFinished={isStackFinished}
            onTopCardClick={handleOpenSpread}
            scale={cardScales[i]}
            opacity={cardOpacities[i]}
          />
        );
      })}

      {/* ------------------------------------------------------------- */}
      {/* 2. SPREAD 2x2 GRID OVERLAY                                   */}
      {/* Smoothly moves out from the center stack into a clean 2x2 grid */}
      {/* ------------------------------------------------------------- */}
      {isSpread && (
        <div
          onClick={handleCloseSpread}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex items-center justify-center p-4 sm:p-6',
            'transition-opacity duration-300'
          )}
          style={{ top: '80px' }} // Safely below the 80px navbar
        >
          {/* Backdrop hint */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10" />

          {/* Embedded GPU keyframe animation styles */}
          <style>{`
            /* Card 0: Top-Left */
            @keyframes spreadFly0 {
              0% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.45), calc(var(--sy) * 0.45), 0) rotate(var(--tilt)); }
              100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            }
            @keyframes collapseFly0 {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.55), calc(var(--sy) * 0.55), 0) rotate(calc(var(--tilt) * -1)); }
              100% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
            }

            /* Card 1: Top-Right */
            @keyframes spreadFly1 {
              0% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.45), calc(var(--sy) * 0.45), 0) rotate(var(--tilt)); }
              100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            }
            @keyframes collapseFly1 {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.55), calc(var(--sy) * 0.55), 0) rotate(calc(var(--tilt) * -1)); }
              100% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
            }

            /* Card 2: Bottom-Left */
            @keyframes spreadFly2 {
              0% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.45), calc(var(--sy) * 0.45), 0) rotate(var(--tilt)); }
              100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            }
            @keyframes collapseFly2 {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.55), calc(var(--sy) * 0.55), 0) rotate(calc(var(--tilt) * -1)); }
              100% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
            }

            /* Card 3: Bottom-Right */
            @keyframes spreadFly3 {
              0% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.45), calc(var(--sy) * 0.45), 0) rotate(var(--tilt)); }
              100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            }
            @keyframes collapseFly3 {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); }
              50% { transform: translate3d(calc(var(--sx) * 0.55), calc(var(--sy) * 0.55), 0) rotate(calc(var(--tilt) * -1)); }
              100% { transform: translate3d(var(--sx), var(--sy), 0) rotate(0deg); }
            }

            .spread-fly-0 { animation: spreadFly0 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
            .collapse-fly-0 { animation: collapseFly0 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

            .spread-fly-1 { animation: spreadFly1 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
            .collapse-fly-1 { animation: collapseFly1 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

            .spread-fly-2 { animation: spreadFly2 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
            .collapse-fly-2 { animation: collapseFly2 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

            .spread-fly-3 { animation: spreadFly3 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
            .collapse-fly-3 { animation: collapseFly3 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

            @media (prefers-reduced-motion: reduce) {
              .grid-card-motion {
                animation: none !important;
                transform: none !important;
              }
            }
          `}</style>

          {/* 2x2 Grid Container: Exactly 2 rows and 2 columns, centered, equal gaps */}
          <div
            ref={gridContainerRef}
            className="w-full max-w-5xl mx-auto grid grid-cols-2 gap-3 sm:gap-5 md:gap-6 items-stretch justify-items-stretch"
          >
            {projects.map((project, i) => {
              const { sx, sy, tilt } = getStackOffset(i);
              const spreadDelay = (3 - i) * 70;
              const collapseDelay = i * 70;
              const delay = isClosing ? collapseDelay : spreadDelay;

              return (
                <div
                  key={`spread_card_${i}`}
                  ref={i === 0 ? sampleCardRef : undefined}
                  className={cn(
                    'grid-card-motion will-change-transform cursor-pointer group',
                    isClosing ? `collapse-fly-${i}` : `spread-fly-${i}`
                  )}
                  style={{
                    '--sx': `${sx}px`,
                    '--sy': `${sy}px`,
                    '--tilt': `${tilt}deg`,
                    animationDelay: `${delay}ms`,
                    zIndex: i + 1,
                  }}
                >
                  <div className="transition-transform duration-200 ease-out group-hover:scale-[1.03] group-hover:shadow-[0_24px_50px_rgba(0,0,0,0.65)] rounded-[28px] relative h-full">
                    <CardContent
                      project={project}
                      i={i}
                      isCompact={true}
                    />

                    {/* Click hint tooltip on hover */}
                    <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white/90 text-[10px] font-mono pointer-events-none">
                      Click to Stack ↙
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

StackingCards.displayName = 'StackingCards';

export default StackingCards;


