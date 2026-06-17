export function SkeletonText({ className = '', lines = 1 }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className={`skeleton h-4 w-full rounded-md ${i === lines - 1 && lines > 1 ? 'w-2/3' : ''}`}></div>
            ))}
        </div>
    );
}

export function SkeletonCard({ className = '' }) {
    return (
        <div className={`glass-card p-6 flex flex-col gap-4 ${className}`}>
            <div className="skeleton h-10 w-10 rounded-full"></div>
            <SkeletonText lines={2} />
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
    return (
        <div className={`w-full overflow-hidden rounded-xl border border-primary/10 bg-surface-lighter/30 ${className}`}>
            <div className="grid border-b border-[rgba(99,102,241,0.08)] p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="skeleton h-4 w-20 rounded-md"></div>
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid border-b border-[rgba(99,102,241,0.08)] p-4 hover:bg-[rgba(99,102,241,0.02)] transition-colors" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {Array.from({ length: columns }).map((_, j) => (
                        <div key={j} className="skeleton h-4 w-full max-w-[80%] rounded-md"></div>
                    ))}
                </div>
            ))}
        </div>
    );
}
