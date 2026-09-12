import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Card = ({
  i,
  title,
  description,
  color,
  badge,
  metric,
  totalCards,
}) => {
  return (
    <div
      className="sticky"
      style={{
        top: `calc(90px + ${i * 44}px)`,
        zIndex: i + 1,
        marginBottom: i === totalCards - 1 ? '0px' : '36px',
      }}
    >
      <div
        style={{ backgroundColor: color }}
        className={cn(
          'w-full max-w-3xl mx-auto rounded-[28px] border border-white/20 p-6 sm:p-8',
          'shadow-[0_-8px_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center',
          'text-white transition-all duration-300'
        )}
      >
        {/* Top header row: visible when cards stack */}
        <div className="flex items-center justify-between w-full max-w-xl pb-3 mb-4 border-b border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold tracking-tight px-2.5 py-0.5 rounded-lg bg-white/15 text-white">
              0{i + 1}
            </span>
            <span className="font-semibold uppercase tracking-wider text-indigo-300">
              {badge}
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-[11px] font-medium">
            {metric}
          </span>
        </div>

        {/* Centered Main Content (no image, compact, center-aligned) */}
        <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-2">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-white mb-3 text-center">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-center max-w-lg">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const StackingCards = forwardRef(({ projects = [] }, ref) => {
  return (
    <div ref={ref} className="relative w-full max-w-4xl mx-auto pb-12 pt-4">
      {projects.map((project, i) => (
        <Card
          key={`p_${i}`}
          i={i}
          title={project.title}
          description={project.description}
          color={project.color}
          badge={project.badge}
          metric={project.metric}
          totalCards={projects.length}
        />
      ))}
    </div>
  );
});

StackingCards.displayName = 'StackingCards';

export default StackingCards;
